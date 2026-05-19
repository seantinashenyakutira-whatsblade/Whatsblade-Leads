import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import crypto from 'crypto';
import { router, protectedProcedure, rateLimitedProcedure } from '@/lib/trpc/init';
import { webhookSchema } from '@/lib/validations/webhook';
import { logActivity } from '@/lib/audit';

export const webhooksRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    let query = ctx.supabaseAdmin.from('webhooks').select('*');

    if (ctx.user.role !== 'admin') {
      query = query.eq('user_id', ctx.user.id);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
    return data ?? [];
  }),

  create: rateLimitedProcedure
    .input(webhookSchema)
    .mutation(async ({ ctx, input }) => {
      const secret = crypto.randomBytes(32).toString('hex');

      const { data, error } = await ctx.supabaseAdmin
        .from('webhooks')
        .insert({
          user_id: ctx.user.id,
          name: input.name,
          url: input.url,
          events: input.events,
          secret,
        })
        .select()
        .single();

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

      await logActivity({
        userId: ctx.user.id,
        action: 'webhook.created',
        entityType: 'webhook',
        entityId: data.id,
        metadata: { name: input.name, url: input.url },
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      });

      return data;
    }),

  update: protectedProcedure
    .input(z.object({ id: z.string().uuid(), data: webhookSchema }))
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabaseAdmin
        .from('webhooks')
        .update({
          name: input.data.name,
          url: input.data.url,
          events: input.data.events,
        })
        .eq('id', input.id)
        .eq('user_id', ctx.user.id)
        .select()
        .single();

      if (error) throw new TRPCError({ code: 'NOT_FOUND', message: 'Webhook not found' });
      return data;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabaseAdmin
        .from('webhooks')
        .delete()
        .eq('id', input.id)
        .eq('user_id', ctx.user.id);

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

      await logActivity({
        userId: ctx.user.id,
        action: 'webhook.deleted',
        entityType: 'webhook',
        entityId: input.id,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      });

      return { success: true };
    }),

  test: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabaseAdmin
        .from('webhooks')
        .select('*')
        .eq('id', input.id)
        .eq('user_id', ctx.user.id)
        .single();

      if (error) throw new TRPCError({ code: 'NOT_FOUND', message: 'Webhook not found' });

      const payload = JSON.stringify({
        event: 'webhook.test',
        data: { message: 'This is a test ping from Whatsblade Leads' },
        timestamp: new Date().toISOString(),
      });

      const signature = crypto
        .createHmac('sha256', data.secret)
        .update(payload)
        .digest('hex');

      try {
        const response = await fetch(data.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Whatsblade-Signature': signature,
            'X-Whatsblade-Event': 'webhook.test',
          },
          body: payload,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        return { success: true, statusCode: response.status };
      } catch (err) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Webhook delivery failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
        });
      }
    }),
});
