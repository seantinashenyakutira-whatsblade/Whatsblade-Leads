import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { router, protectedProcedure, rateLimitedProcedure } from '@/lib/trpc/init';
import { savedFilterSchema } from '@/lib/validations/filter';

export const filtersRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabaseAdmin
      .from('saved_filters')
      .select('*')
      .eq('user_id', ctx.user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
    return data ?? [];
  }),

  save: rateLimitedProcedure
    .input(savedFilterSchema)
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabaseAdmin
        .from('saved_filters')
        .insert({
          user_id: ctx.user.id,
          name: input.name,
          filter_config: input.filterConfig,
          is_default: input.isDefault,
        })
        .select()
        .single();

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      return data;
    }),

  update: protectedProcedure
    .input(z.object({ id: z.string().uuid(), name: z.string().min(1).max(100).optional(), filterConfig: z.record(z.unknown()).optional(), isDefault: z.boolean().optional() }))
    .mutation(async ({ ctx, input }) => {
      const { data: existing, error: fetchError } = await ctx.supabaseAdmin
        .from('saved_filters')
        .select('*')
        .eq('id', input.id)
        .single();

      if (fetchError || !existing) throw new TRPCError({ code: 'NOT_FOUND', message: 'Filter not found' });
      if (existing.user_id !== ctx.user.id) throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });

      const updates: Record<string, unknown> = {};
      if (input.name !== undefined) updates.name = input.name;
      if (input.filterConfig !== undefined) updates.filter_config = input.filterConfig;
      if (input.isDefault !== undefined) updates.is_default = input.isDefault;

      const { data, error } = await ctx.supabaseAdmin
        .from('saved_filters')
        .update(updates)
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
        .from('saved_filters')
        .select('*')
        .eq('id', input.id)
        .single();

      if (fetchError || !existing) throw new TRPCError({ code: 'NOT_FOUND', message: 'Filter not found' });
      if (existing.user_id !== ctx.user.id) throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });

      const { error } = await ctx.supabaseAdmin
        .from('saved_filters')
        .delete()
        .eq('id', input.id);

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      return { success: true };
    }),
});
