import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { router, protectedProcedure, rateLimitedProcedure } from '@/lib/trpc/init';
import { integrationSchema } from '@/lib/validations/settings';
import { logActivity } from '@/lib/audit';
import { nanoid } from 'nanoid';

export const integrationsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabaseAdmin
      .from('integrations')
      .select('*')
      .eq('user_id', ctx.user.id)
      .order('created_at', { ascending: false });

    if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
    return data ?? [];
  }),

  create: rateLimitedProcedure
    .input(integrationSchema)
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabaseAdmin
        .from('integrations')
        .insert({
          user_id: ctx.user.id,
          type: input.type,
          name: input.name,
          config: input.config,
        })
        .select()
        .single();

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

      await logActivity({
        userId: ctx.user.id,
        action: 'integration.created',
        entityType: 'integration',
        entityId: data.id,
        metadata: { type: input.type, name: input.name },
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      });

      return data;
    }),

  update: rateLimitedProcedure
    .input(z.object({
      id: z.string().uuid(),
      config: z.record(z.unknown()).optional(),
      isActive: z.boolean().optional(),
      name: z.string().max(100).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;

      const { data: existing } = await ctx.supabaseAdmin
        .from('integrations')
        .select('user_id')
        .eq('id', id)
        .single();

      if (!existing) throw new TRPCError({ code: 'NOT_FOUND', message: 'Integration not found' });
      if (existing.user_id !== ctx.user.id && ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'You do not own this integration' });
      }

      const { data, error } = await ctx.supabaseAdmin
        .from('integrations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

      return data;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabaseAdmin
        .from('integrations')
        .delete()
        .eq('id', input.id)
        .eq('user_id', ctx.user.id);

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

      await logActivity({
        userId: ctx.user.id,
        action: 'integration.deleted',
        entityType: 'integration',
        entityId: input.id,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      });

      return { success: true };
    }),

  testConnection: rateLimitedProcedure
    .input(z.object({ type: z.string(), config: z.record(z.unknown()) }))
    .mutation(async ({ input }) => {
      const startTime = Date.now();

      try {
        if (input.type === 'zapier') {
          const url = input.config.webhookUrl as string;
          if (!url) throw new Error('Webhook URL is required');
          const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ test: true, timestamp: new Date().toISOString() }),
            signal: AbortSignal.timeout(10000),
          });
          const responseTime = Date.now() - startTime;
          return { success: response.ok, responseTime, message: response.ok ? 'Webhook test sent successfully' : `Failed with status ${response.status}` };
        }

        if (input.type === 'slack') {
          const url = input.config.webhookUrl as string;
          if (!url) throw new Error('Slack webhook URL is required');
          const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: '🔗 Whatsblade Leads: Test connection successful!' }),
            signal: AbortSignal.timeout(10000),
          });
          const responseTime = Date.now() - startTime;
          return { success: response.ok, responseTime, message: response.ok ? 'Slack notification sent!' : `Failed with status ${response.status}` };
        }

        if (input.type === 'google_sheets') {
          const responseTime = Date.now() - startTime;
          return { success: false, responseTime, message: 'OAuth required. Connect via Google to complete setup.' };
        }

        if (input.type === 'google_calendar') {
          const responseTime = Date.now() - startTime;
          return { success: false, responseTime, message: 'OAuth required. Connect via Google to complete setup.' };
        }

        return { success: false, responseTime: Date.now() - startTime, message: 'Unknown integration type' };
      } catch (err: unknown) {
        const responseTime = Date.now() - startTime;
        return { success: false, responseTime, message: err instanceof Error ? err.message : 'Connection failed' };
      }
    }),

  getZapierEndpoint: protectedProcedure.query(async ({ ctx }) => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const endpoint = `${baseUrl}/api/webhooks/zapier?user_id=${ctx.user.id}&secret=${nanoid(32)}`;
    return endpoint;
  }),
});
