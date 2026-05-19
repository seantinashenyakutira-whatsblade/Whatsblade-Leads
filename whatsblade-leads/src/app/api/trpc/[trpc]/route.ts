import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { NextRequest } from 'next/server';
import { appRouter } from '@/lib/trpc/router';
import { createTRPCContext } from '@/lib/trpc/context';

const handler = (req: NextRequest) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: async (opts: { req: Request; resHeaders: Headers }) => {
      const ctx = await createTRPCContext({
        req: opts.req as never,
        res: opts.resHeaders as never,
      });
      return ctx;
    },
    onError:
      process.env.NODE_ENV === 'development'
        ? ({ path, error }) => {
            console.error(`❌ tRPC failed on ${path}:`, error);
          }
        : undefined,
  });

export { handler as GET, handler as POST };
