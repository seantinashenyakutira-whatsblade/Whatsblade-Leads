import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import type { TRPCContext } from '@/lib/trpc/context';
import { checkRateLimit, getRateLimitKey } from '@/lib/rate-limit';

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape }) {
    return shape;
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'You must be logged in' });
  }
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User profile not found' });
  }
  if (!ctx.user.is_active) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Account is deactivated' });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export const rateLimitedProcedure = protectedProcedure.use(({ ctx, next }) => {
  const key = getRateLimitKey(ctx.user.id, ctx.req.url ?? 'unknown');
  const result = checkRateLimit(key);

  if (!result.allowed) {
    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: `Rate limit exceeded. Try again after ${new Date(result.resetAt).toISOString()}`,
    });
  }

  return next({ ctx: { ...ctx, user: ctx.user } });
});
