import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { router, protectedProcedure, adminProcedure, rateLimitedProcedure } from '@/lib/trpc/init';
import { leadSchema, leadFilterSchema, assignLeadSchema } from '@/lib/validations/lead';
import { logActivity } from '@/lib/audit';
import { runEnrichmentInBackground } from '@/lib/enrichment/engine';

export const leadsRouter = router({
  list: protectedProcedure
    .input(leadFilterSchema)
    .query(async ({ ctx, input }) => {
      let query = ctx.supabaseAdmin.from('leads').select('*', { count: 'exact' });

      if (ctx.user.role !== 'admin') {
        query = query.or(`assigned_to.eq.${ctx.user.id},created_by.eq.${ctx.user.id}`);
      }

      if (input.search) {
        query = query.or(
          `first_name.ilike.%${input.search}%,last_name.ilike.%${input.search}%,email.ilike.%${input.search}%,company.ilike.%${input.search}%`
        );
      }
      if (input.status) query = query.eq('status', input.status);
      if (input.assignedTo) query = query.eq('assigned_to', input.assignedTo);
      if (input.source) query = query.eq('source', input.source);
      if (input.industry) query = query.eq('industry', input.industry);
      if (input.country) query = query.eq('country', input.country);
      if (input.city) query = query.eq('city', input.city);
      if (input.minLeadScore !== undefined) query = query.gte('lead_score', input.minLeadScore);
      if (input.maxLeadScore !== undefined) query = query.lte('lead_score', input.maxLeadScore);
      if (input.dateFrom) query = query.gte('created_at', input.dateFrom);
      if (input.dateTo) query = query.lte('created_at', input.dateTo);
      if (input.hasPhone === true) query = query.neq('phone', null).neq('phone', '');
      if (input.hasEmail === true) query = query.neq('email', null).neq('email', '');
      if (input.hasSocial === true) query = query.neq('social_media', '{}');
      if (input.lastContactedFrom) query = query.gte('last_contacted_at', input.lastContactedFrom);
      if (input.lastContactedTo) query = query.lte('last_contacted_at', input.lastContactedTo);

      const from = (input.page - 1) * input.pageSize;
      const to = from + input.pageSize - 1;

      const { data, error, count } = await query
        .order(input.sortBy, { ascending: input.sortOrder === 'asc' })
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
        .from('leads')
        .select('*')
        .eq('id', input.id)
        .single();

      if (error) throw new TRPCError({ code: 'NOT_FOUND', message: 'Lead not found' });

      if (ctx.user.role !== 'admin' && data.assigned_to !== ctx.user.id && data.created_by !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
      }

      const lastEnriched = data.last_enriched_at ? new Date(data.last_enriched_at).getTime() : 0;
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      if (lastEnriched < sevenDaysAgo) {
        runEnrichmentInBackground(input.id, ctx.user.id);
      }

      return data;
    }),

  create: rateLimitedProcedure
    .input(leadSchema)
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabaseAdmin
        .from('leads')
        .insert({
          first_name: input.firstName || null,
          last_name: input.lastName || null,
          email: input.email || null,
          phone: input.phone || null,
          company: input.company || null,
          position: input.position || null,
          website: input.website || null,
          status: input.status,
          source: input.source || null,
          notes: input.notes || null,
          assigned_to: input.assignedTo ?? null,
          custom_fields: input.customFields ?? {},
          deal_value: input.dealValue ?? 0,
          expected_close_date: input.expectedCloseDate || null,
          next_action: input.nextAction || null,
          next_action_date: input.nextActionDate || null,
          created_by: ctx.user.id,
        })
        .select()
        .single();

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

      await logActivity({
        userId: ctx.user.id,
        action: 'lead.created',
        entityType: 'lead',
        entityId: data.id,
        metadata: { name: `${input.firstName} ${input.lastName}` },
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      });

      return data;
    }),

  update: protectedProcedure
    .input(z.object({ id: z.string().uuid(), data: leadSchema }))
    .mutation(async ({ ctx, input }) => {
      const { data: existing } = await ctx.supabaseAdmin
        .from('leads')
        .select('*')
        .eq('id', input.id)
        .single();

      if (!existing) throw new TRPCError({ code: 'NOT_FOUND', message: 'Lead not found' });

      if (ctx.user.role !== 'admin' && existing.assigned_to !== ctx.user.id && existing.created_by !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
      }

      const { data, error } = await ctx.supabaseAdmin
        .from('leads')
        .update({
          first_name: input.data.firstName || null,
          last_name: input.data.lastName || null,
          email: input.data.email || null,
          phone: input.data.phone || null,
          company: input.data.company || null,
          position: input.data.position || null,
          website: input.data.website || null,
          status: input.data.status,
          source: input.data.source || null,
          notes: input.data.notes || null,
          assigned_to: input.data.assignedTo ?? null,
          custom_fields: input.data.customFields ?? {},
          deal_value: input.data.dealValue ?? existing.deal_value,
          expected_close_date: input.data.expectedCloseDate || existing.expected_close_date,
          next_action: input.data.nextAction ?? existing.next_action,
          next_action_date: input.data.nextActionDate ?? existing.next_action_date,
        })
        .eq('id', input.id)
        .select()
        .single();

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

      await logActivity({
        userId: ctx.user.id,
        action: 'lead.updated',
        entityType: 'lead',
        entityId: input.id,
        metadata: { changes: input.data },
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      });

      return data;
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabaseAdmin
        .from('leads')
        .delete()
        .eq('id', input.id);

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

      await logActivity({
        userId: ctx.user.id,
        action: 'lead.deleted',
        entityType: 'lead',
        entityId: input.id,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      });

      return { success: true };
    }),

  assign: adminProcedure
    .input(assignLeadSchema)
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabaseAdmin
        .from('leads')
        .update({ assigned_to: input.userId })
        .in('id', input.leadIds);

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

      await logActivity({
        userId: ctx.user.id,
        action: 'lead.assigned',
        entityType: 'lead',
        entityId: input.leadIds[0],
        metadata: { leadIds: input.leadIds, assignedTo: input.userId },
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      });

      return { success: true, count: input.leadIds.length };
    }),

  updateStatus: protectedProcedure
    .input(z.object({ id: z.string().uuid(), status: z.enum(['new', 'contacted', 'replied', 'meeting_booked', 'proposal_sent', 'converted', 'lost']) }))
    .mutation(async ({ ctx, input }) => {
      const { data: existing } = await ctx.supabaseAdmin
        .from('leads')
        .select('*')
        .eq('id', input.id)
        .single();

      if (!existing) throw new TRPCError({ code: 'NOT_FOUND', message: 'Lead not found' });
      if (ctx.user.role !== 'admin' && existing.assigned_to !== ctx.user.id && existing.created_by !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
      }

      const updates: Record<string, unknown> = { status: input.status };
      if (input.status === 'contacted' || input.status === 'replied' || input.status === 'meeting_booked' || input.status === 'proposal_sent') {
        updates.last_contacted_at = new Date().toISOString();
      }

      const { data, error } = await ctx.supabaseAdmin
        .from('leads')
        .update(updates)
        .eq('id', input.id)
        .select()
        .single();

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

      await logActivity({
        userId: ctx.user.id,
        action: 'lead.status_changed',
        entityType: 'lead',
        entityId: input.id,
        metadata: { from: existing.status, to: input.status },
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      });

      return data;
    }),

  updateDealValue: protectedProcedure
    .input(z.object({ id: z.string().uuid(), dealValue: z.number().min(0) }))
    .mutation(async ({ ctx, input }) => {
      const { data: existing } = await ctx.supabaseAdmin
        .from('leads')
        .select('*')
        .eq('id', input.id)
        .single();

      if (!existing) throw new TRPCError({ code: 'NOT_FOUND', message: 'Lead not found' });
      if (ctx.user.role !== 'admin' && existing.assigned_to !== ctx.user.id && existing.created_by !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
      }

      const { data, error } = await ctx.supabaseAdmin
        .from('leads')
        .update({ deal_value: input.dealValue })
        .eq('id', input.id)
        .select()
        .single();

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      return data;
    }),

  updateNextAction: protectedProcedure
    .input(z.object({ id: z.string().uuid(), action: z.string().max(500).nullable(), date: z.string().datetime().nullable() }))
    .mutation(async ({ ctx, input }) => {
      const { data: existing } = await ctx.supabaseAdmin
        .from('leads')
        .select('*')
        .eq('id', input.id)
        .single();

      if (!existing) throw new TRPCError({ code: 'NOT_FOUND', message: 'Lead not found' });
      if (ctx.user.role !== 'admin' && existing.assigned_to !== ctx.user.id && existing.created_by !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
      }

      const { data, error } = await ctx.supabaseAdmin
        .from('leads')
        .update({ next_action: input.action, next_action_date: input.date })
        .eq('id', input.id)
        .select()
        .single();

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      return data;
    }),
});
