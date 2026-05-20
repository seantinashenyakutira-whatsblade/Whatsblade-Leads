import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { router, protectedProcedure, rateLimitedProcedure } from '@/lib/trpc/init';

export const searchRouter = router({
  getRecent: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(20).default(10) }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabaseAdmin
        .from('search_history')
        .select('*')
        .eq('user_id', ctx.user.id)
        .order('created_at', { ascending: false })
        .limit(input.limit);

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

      return data || [];
    }),

  saveSearch: rateLimitedProcedure
    .input(z.object({
      query: z.string(),
      industry: z.string().optional(),
      country: z.string().optional(),
      city: z.string().optional(),
      radius: z.number().optional(),
      filters: z.record(z.unknown()).optional(),
      resultCount: z.number().default(0),
    }))
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabaseAdmin
        .from('search_history')
        .insert({
          user_id: ctx.user.id,
          query: input.query,
          industry: input.industry || null,
          country: input.country || null,
          city: input.city || null,
          radius: input.radius || null,
          filters: input.filters || {},
          result_count: input.resultCount,
        })
        .select()
        .single();

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

      return data;
    }),

  getSaved: protectedProcedure
    .query(async ({ ctx }) => {
      const { data, error } = await ctx.supabaseAdmin
        .from('saved_searches')
        .select('*')
        .eq('user_id', ctx.user.id)
        .order('is_default', { ascending: false })
        .order('name', { ascending: true });

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

      return data || [];
    }),

  saveSearchPreset: rateLimitedProcedure
    .input(z.object({
      name: z.string().min(1).max(100),
      industry: z.string().optional(),
      country: z.string().optional(),
      city: z.string().optional(),
      radius: z.number().default(25),
      filters: z.record(z.unknown()).default({}),
      maxResults: z.number().default(25),
      sortBy: z.string().default('leadScore'),
      sortOrder: z.enum(['asc', 'desc']).default('desc'),
      isDefault: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabaseAdmin
        .from('saved_searches')
        .insert({
          user_id: ctx.user.id,
          name: input.name,
          industry: input.industry || null,
          country: input.country || null,
          city: input.city || null,
          radius: input.radius,
          filters: input.filters,
          max_results: input.maxResults,
          sort_by: input.sortBy,
          sort_order: input.sortOrder,
          is_default: input.isDefault,
        })
        .select()
        .single();

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

      return data;
    }),

  updateSavedSearch: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      name: z.string().min(1).max(100).optional(),
      industry: z.string().optional(),
      country: z.string().optional(),
      city: z.string().optional(),
      radius: z.number().optional(),
      filters: z.record(z.unknown()).optional(),
      maxResults: z.number().optional(),
      sortBy: z.string().optional(),
      sortOrder: z.enum(['asc', 'desc']).optional(),
      isDefault: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;

      const { data, error } = await ctx.supabaseAdmin
        .from('saved_searches')
        .update({
          name: updates.name,
          industry: updates.industry,
          country: updates.country,
          city: updates.city,
          radius: updates.radius,
          filters: updates.filters,
          max_results: updates.maxResults,
          sort_by: updates.sortBy,
          sort_order: updates.sortOrder,
          is_default: updates.isDefault,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', ctx.user.id)
        .select()
        .single();

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      if (!data) throw new TRPCError({ code: 'NOT_FOUND', message: 'Saved search not found' });

      return data;
    }),

  deleteSavedSearch: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabaseAdmin
        .from('saved_searches')
        .delete()
        .eq('id', input.id)
        .eq('user_id', ctx.user.id);

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

      return { success: true };
    }),
});
