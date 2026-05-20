import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { router, protectedProcedure, rateLimitedProcedure } from '@/lib/trpc/init';
import { runEnrichment } from '@/lib/enrichment/engine';

export const enrichmentScheduleRouter = router({
  create: rateLimitedProcedure
    .input(z.object({
      leadId: z.string().uuid(),
      scheduleType: z.enum(['once', 'daily', 'weekly', 'monthly']).default('once'),
      scheduledAt: z.string().datetime(),
      recurrence: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { data: lead } = await ctx.supabaseAdmin
        .from('leads')
        .select('assigned_to, created_by')
        .eq('id', input.leadId)
        .single();

      if (!lead) throw new TRPCError({ code: 'NOT_FOUND', message: 'Lead not found' });

      if (ctx.user.role !== 'admin' && lead.assigned_to !== ctx.user.id && lead.created_by !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
      }

      const { data, error } = await ctx.supabaseAdmin
        .from('enrichment_schedules')
        .insert({
          user_id: ctx.user.id,
          lead_id: input.leadId,
          schedule_type: input.scheduleType,
          scheduled_at: input.scheduledAt,
          recurrence: input.recurrence || null,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

      return data;
    }),

  getByLead: protectedProcedure
    .input(z.object({ leadId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabaseAdmin
        .from('enrichment_schedules')
        .select('*')
        .eq('lead_id', input.leadId)
        .order('scheduled_at', { ascending: false });

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

      return data || [];
    }),

  cancel: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabaseAdmin
        .from('enrichment_schedules')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', input.id)
        .eq('user_id', ctx.user.id);

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

      return { success: true };
    }),

  runNow: rateLimitedProcedure
    .input(z.object({ leadId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { data: lead } = await ctx.supabaseAdmin
        .from('leads')
        .select('assigned_to, created_by')
        .eq('id', input.leadId)
        .single();

      if (!lead) throw new TRPCError({ code: 'NOT_FOUND', message: 'Lead not found' });

      if (ctx.user.role !== 'admin' && lead.assigned_to !== ctx.user.id && lead.created_by !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
      }

      await ctx.supabaseAdmin
        .from('leads')
        .update({ enrichment_status: 'running' })
        .eq('id', input.leadId);

      const result = await runEnrichment(input.leadId, ctx.user.id);

      await ctx.supabaseAdmin
        .from('leads')
        .update({ enrichment_status: 'completed' })
        .eq('id', input.leadId);

      return result;
    }),

  batchEnrich: rateLimitedProcedure
    .input(z.object({ leadIds: z.array(z.string().uuid()) }))
    .mutation(async ({ ctx, input }) => {
      const results: { leadId: string; success: boolean; error?: string }[] = [];

      for (const leadId of input.leadIds) {
        try {
          const { data: lead } = await ctx.supabaseAdmin
            .from('leads')
            .select('assigned_to, created_by')
            .eq('id', leadId)
            .single();

          if (!lead) {
            results.push({ leadId, success: false, error: 'Lead not found' });
            continue;
          }

          if (ctx.user.role !== 'admin' && lead.assigned_to !== ctx.user.id && lead.created_by !== ctx.user.id) {
            results.push({ leadId, success: false, error: 'Access denied' });
            continue;
          }

          await runEnrichment(leadId, ctx.user.id);
          results.push({ leadId, success: true });
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          results.push({ leadId, success: false, error: message });
        }
      }

      return {
        total: input.leadIds.length,
        successful: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
        results,
      };
    }),
});
