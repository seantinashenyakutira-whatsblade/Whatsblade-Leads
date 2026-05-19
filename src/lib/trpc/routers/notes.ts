import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { router, protectedProcedure, rateLimitedProcedure } from '@/lib/trpc/init';
import { noteSchema } from '@/lib/validations/note';
import { logActivity } from '@/lib/audit';

export const notesRouter = router({
  list: protectedProcedure
    .input(z.object({ leadId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
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
        .from('lead_notes')
        .select('*')
        .eq('lead_id', input.leadId)
        .order('created_at', { ascending: false });

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      return data ?? [];
    }),

  create: rateLimitedProcedure
    .input(noteSchema)
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
        .from('lead_notes')
        .insert({
          lead_id: input.leadId,
          user_id: ctx.user.id,
          content: input.content,
          attachments: input.attachments,
        })
        .select()
        .single();

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

      await logActivity({
        userId: ctx.user.id,
        action: 'note.created',
        entityType: 'lead',
        entityId: input.leadId,
        metadata: { noteId: data.id },
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      });

      return data;
    }),

  update: protectedProcedure
    .input(z.object({ id: z.string().uuid(), content: z.string().min(1).max(10000) }))
    .mutation(async ({ ctx, input }) => {
      const { data: existing, error: fetchError } = await ctx.supabaseAdmin
        .from('lead_notes')
        .select('*')
        .eq('id', input.id)
        .single();

      if (fetchError || !existing) throw new TRPCError({ code: 'NOT_FOUND', message: 'Note not found' });
      if (existing.user_id !== ctx.user.id) throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });

      const { data, error } = await ctx.supabaseAdmin
        .from('lead_notes')
        .update({ content: input.content })
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
        .from('lead_notes')
        .select('*')
        .eq('id', input.id)
        .single();

      if (fetchError || !existing) throw new TRPCError({ code: 'NOT_FOUND', message: 'Note not found' });
      if (existing.user_id !== ctx.user.id) throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });

      const { error } = await ctx.supabaseAdmin
        .from('lead_notes')
        .delete()
        .eq('id', input.id);

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      return { success: true };
    }),
});
