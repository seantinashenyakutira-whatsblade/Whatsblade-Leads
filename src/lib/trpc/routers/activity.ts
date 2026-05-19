import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { router, protectedProcedure } from '@/lib/trpc/init';

export const activityRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        userId: z.string().uuid().optional(),
        entityType: z.string().optional(),
        entityId: z.string().uuid().optional(),
        action: z.string().optional(),
        page: z.coerce.number().int().min(1).default(1),
        pageSize: z.coerce.number().int().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      let query = ctx.supabaseAdmin.from('activities').select('*', { count: 'exact' });

      if (ctx.user.role !== 'admin' && !input.userId) {
        query = query.eq('user_id', ctx.user.id);
      }

      if (input.userId) query = query.eq('user_id', input.userId);
      if (input.entityType) query = query.eq('entity_type', input.entityType);
      if (input.entityId) query = query.eq('entity_id', input.entityId);
      if (input.action) query = query.eq('action', input.action);

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

  getByEntity: protectedProcedure
    .input(
      z.object({
        entityType: z.string(),
        entityId: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabaseAdmin
        .from('activities')
        .select('*')
        .eq('entity_type', input.entityType)
        .eq('entity_id', input.entityId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      return data ?? [];
    }),

  getRecent: protectedProcedure
    .input(z.object({ limit: z.coerce.number().int().min(1).max(100).default(20) }))
    .query(async ({ ctx, input }) => {
      let query = ctx.supabaseAdmin
        .from('activities')
        .select('*');

      if (ctx.user.role !== 'admin') {
        query = query.eq('user_id', ctx.user.id);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(input.limit);

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      return data ?? [];
    }),
});
