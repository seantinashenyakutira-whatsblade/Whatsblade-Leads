import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { router, protectedProcedure, rateLimitedProcedure } from '@/lib/trpc/init';
import { sendMessageSchema, messageFilterSchema } from '@/lib/validations/message';
import { logActivity } from '@/lib/audit';

export const messagesRouter = router({
  list: protectedProcedure
    .input(messageFilterSchema)
    .query(async ({ ctx, input }) => {
      let query = ctx.supabaseAdmin.from('messages').select('*', { count: 'exact' });

      if (ctx.user.role !== 'admin') {
        query = query.eq('sent_by', ctx.user.id);
      }

      if (input.leadId) query = query.eq('lead_id', input.leadId);
      if (input.campaignId) query = query.eq('campaign_id', input.campaignId);
      if (input.sentBy) query = query.eq('sent_by', input.sentBy);
      if (input.channel) query = query.eq('channel', input.channel);
      if (input.status) query = query.eq('status', input.status);

      const from = (input.page - 1) * input.pageSize;
      const to = from + input.pageSize - 1;

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

      return {
        items: data ?? [],
        total: count ?? 0,
        page: input.page,
        pageSize: input.pageSize,
        totalPages: Math.ceil((count ?? 0) / input.pageSize),
      };
    }),

  send: rateLimitedProcedure
    .input(sendMessageSchema)
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabaseAdmin
        .from('messages')
        .insert({
          lead_id: input.leadId,
          campaign_id: input.campaignId ?? null,
          sent_by: ctx.user.id,
          channel: input.channel,
          subject: input.subject || null,
          body: input.body,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

      await logActivity({
        userId: ctx.user.id,
        action: 'message.sent',
        entityType: 'message',
        entityId: data.id,
        metadata: { leadId: input.leadId, channel: input.channel },
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      });

      return data;
    }),

  getByLead: protectedProcedure
    .input(z.object({ leadId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabaseAdmin
        .from('messages')
        .select('*')
        .eq('lead_id', input.leadId)
        .order('created_at', { ascending: false });

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      return data ?? [];
    }),

  trackDelivery: protectedProcedure
    .input(z.object({
      messageId: z.string().uuid(),
      status: z.enum(['sent', 'delivered', 'failed', 'bounced']),
      metadata: z.record(z.unknown()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const updates: Record<string, unknown> = { status: input.status };
      if (input.metadata) updates.metadata = input.metadata;

      if (input.status === 'sent') updates.sent_at = new Date().toISOString();
      if (input.status === 'delivered') updates.delivered_at = new Date().toISOString();

      const { data, error } = await ctx.supabaseAdmin
        .from('messages')
        .update(updates)
        .eq('id', input.messageId)
        .select()
        .single();

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

      await logActivity({
        userId: ctx.user.id,
        action: `message.${input.status}`,
        entityType: 'message',
        entityId: input.messageId,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      });

      return data;
    }),
});
