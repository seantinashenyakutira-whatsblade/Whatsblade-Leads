import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { router, protectedProcedure, rateLimitedProcedure } from '@/lib/trpc/init';
import { campaignSchema, campaignFilterSchema } from '@/lib/validations/campaign';
import { logActivity } from '@/lib/audit';

export const campaignsRouter = router({
  list: protectedProcedure
    .input(campaignFilterSchema)
    .query(async ({ ctx, input }) => {
      let query = ctx.supabaseAdmin.from('campaigns').select('*', { count: 'exact' });

      if (ctx.user.role !== 'admin') {
        query = query.eq('created_by', ctx.user.id);
      }

      if (input.search) query = query.ilike('name', `%${input.search}%`);
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

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabaseAdmin
        .from('campaigns')
        .select('*')
        .eq('id', input.id)
        .single();

      if (error) throw new TRPCError({ code: 'NOT_FOUND', message: 'Campaign not found' });

      if (ctx.user.role !== 'admin' && data.created_by !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
      }

      const { data: leads } = await ctx.supabaseAdmin
        .from('campaign_leads')
        .select('*, leads(*)')
        .eq('campaign_id', input.id);

      return { ...data, leads: leads ?? [] };
    }),

  create: rateLimitedProcedure
    .input(campaignSchema)
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabaseAdmin
        .from('campaigns')
        .insert({
          name: input.name,
          description: input.description || null,
          scheduled_at: input.scheduledAt ?? null,
          created_by: ctx.user.id,
        })
        .select()
        .single();

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

      if (input.leadIds && input.leadIds.length > 0) {
        const leadInserts = input.leadIds.map((leadId) => ({
          campaign_id: data.id,
          lead_id: leadId,
        }));
        await ctx.supabaseAdmin.from('campaign_leads').insert(leadInserts);
      }

      await logActivity({
        userId: ctx.user.id,
        action: 'campaign.created',
        entityType: 'campaign',
        entityId: data.id,
        metadata: { name: input.name },
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      });

      return data;
    }),

  update: protectedProcedure
    .input(z.object({ id: z.string().uuid(), data: campaignSchema }))
    .mutation(async ({ ctx, input }) => {
      const { data: existing } = await ctx.supabaseAdmin
        .from('campaigns')
        .select('id, created_by')
        .eq('id', input.id)
        .single();

      if (!existing) throw new TRPCError({ code: 'NOT_FOUND' });
      if (ctx.user.role !== 'admin' && existing.created_by !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      const { data, error } = await ctx.supabaseAdmin
        .from('campaigns')
        .update({
          name: input.data.name,
          description: input.data.description || null,
          scheduled_at: input.data.scheduledAt ?? null,
        })
        .eq('id', input.id)
        .select()
        .single();

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

      return data;
    }),

  start: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabaseAdmin
        .from('campaigns')
        .update({ status: 'active', started_at: new Date().toISOString() })
        .eq('id', input.id)
        .select()
        .single();

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

      await logActivity({
        userId: ctx.user.id,
        action: 'campaign.started',
        entityType: 'campaign',
        entityId: input.id,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      });

      return data;
    }),

  pause: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabaseAdmin
        .from('campaigns')
        .update({ status: 'paused' })
        .eq('id', input.id)
        .select()
        .single();

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

      return data;
    }),

  complete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabaseAdmin
        .from('campaigns')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', input.id)
        .select()
        .single();

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

      await logActivity({
        userId: ctx.user.id,
        action: 'campaign.completed',
        entityType: 'campaign',
        entityId: input.id,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      });

      return data;
    }),

  addLeads: protectedProcedure
    .input(z.object({ campaignId: z.string().uuid(), leadIds: z.array(z.string().uuid()) }))
    .mutation(async ({ ctx, input }) => {
      const inserts = input.leadIds.map((leadId) => ({
        campaign_id: input.campaignId,
        lead_id: leadId,
      }));

      const { error } = await ctx.supabaseAdmin
        .from('campaign_leads')
        .insert(inserts);

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      return { success: true, count: input.leadIds.length };
    }),

  removeLeads: protectedProcedure
    .input(z.object({ campaignId: z.string().uuid(), leadIds: z.array(z.string().uuid()) }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabaseAdmin
        .from('campaign_leads')
        .delete()
        .eq('campaign_id', input.campaignId)
        .in('lead_id', input.leadIds);

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      return { success: true };
    }),
});
