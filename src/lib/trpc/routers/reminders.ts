import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { router, protectedProcedure, rateLimitedProcedure } from '@/lib/trpc/init';
import { reminderSchema } from '@/lib/validations/reminder';
import { logActivity } from '@/lib/audit';

export const remindersRouter = router({
  list: protectedProcedure
    .input(z.object({ leadId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabaseAdmin
        .from('lead_reminders')
        .select('*')
        .eq('lead_id', input.leadId)
        .order('remind_at', { ascending: true });

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      return data ?? [];
    }),

  upcoming: protectedProcedure.query(async ({ ctx }) => {
    const now = new Date().toISOString();
    const { data, error } = await ctx.supabaseAdmin
      .from('lead_reminders')
      .select('*, leads!inner(company, first_name, last_name)')
      .eq('user_id', ctx.user.id)
      .eq('status', 'pending')
      .gte('remind_at', now)
      .order('remind_at', { ascending: true })
      .limit(20);

    if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
    return data ?? [];
  }),

  create: rateLimitedProcedure
    .input(reminderSchema)
    .mutation(async ({ ctx, input }) => {
      const { data: lead, error: leadError } = await ctx.supabaseAdmin
        .from('leads')
        .select('id, assigned_to, created_by')
        .eq('id', input.leadId)
        .single();

      if (leadError || !lead) throw new TRPCError({ code: 'NOT_FOUND', message: 'Lead not found' });
      if (ctx.user.role !== 'admin' && lead.assigned_to !== ctx.user.id && lead.created_by !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
      }

      const { data, error } = await ctx.supabaseAdmin
        .from('lead_reminders')
        .insert({
          lead_id: input.leadId,
          user_id: ctx.user.id,
          action: input.action,
          remind_at: input.remindAt,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

      await logActivity({
        userId: ctx.user.id,
        action: 'reminder.created',
        entityType: 'lead',
        entityId: input.leadId,
        metadata: { reminderId: data.id, action: input.action, remindAt: input.remindAt },
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      });

      return data;
    }),

  update: protectedProcedure
    .input(z.object({ id: z.string().uuid(), action: z.string().min(1).max(500), remindAt: z.string().datetime() }))
    .mutation(async ({ ctx, input }) => {
      const { data: existing, error: fetchError } = await ctx.supabaseAdmin
        .from('lead_reminders')
        .select('*')
        .eq('id', input.id)
        .single();

      if (fetchError || !existing) throw new TRPCError({ code: 'NOT_FOUND', message: 'Reminder not found' });
      if (existing.user_id !== ctx.user.id) throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });

      const { data, error } = await ctx.supabaseAdmin
        .from('lead_reminders')
        .update({ action: input.action, remind_at: input.remindAt })
        .eq('id', input.id)
        .select()
        .single();

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      return data;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { data: existing, error: fetchError } = await ctx.supabaseAdmin
        .from('lead_reminders')
        .select('*')
        .eq('id', input.id)
        .single();

      if (fetchError || !existing) throw new TRPCError({ code: 'NOT_FOUND', message: 'Reminder not found' });
      if (existing.user_id !== ctx.user.id) throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });

      const { error } = await ctx.supabaseAdmin
        .from('lead_reminders')
        .delete()
        .eq('id', input.id);

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      return { success: true };
    }),

  markDone: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { data: existing, error: fetchError } = await ctx.supabaseAdmin
        .from('lead_reminders')
        .select('*')
        .eq('id', input.id)
        .single();

      if (fetchError || !existing) throw new TRPCError({ code: 'NOT_FOUND', message: 'Reminder not found' });
      if (existing.user_id !== ctx.user.id) throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });

      const { data, error } = await ctx.supabaseAdmin
        .from('lead_reminders')
        .update({ status: 'done', completed_at: new Date().toISOString() })
        .eq('id', input.id)
        .select()
        .single();

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      return data;
    }),
});
