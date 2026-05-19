import { type inferAsyncReturnType } from '@trpc/server';
import { type CreateNextContextOptions } from '@trpc/server/adapters/next';
import { createBrowserSupabaseClient } from '@/lib/db/client-browser';
import { getSupabaseAdmin } from '@/lib/db/client';
import type { User } from '@/types';

export async function createTRPCContext(opts: CreateNextContextOptions) {
  const { req, res } = opts;
  const supabase = createBrowserSupabaseClient();
  const supabaseAdmin = getSupabaseAdmin();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  let user: User | null = null;
  if (session?.user) {
    const { data } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();
    user = data;
  }

  const ipAddress =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ??
    req.socket?.remoteAddress ??
    null;

  const userAgent = (req.headers['user-agent'] as string) ?? null;

  return {
    req,
    res,
    supabase,
    supabaseAdmin,
    session,
    user,
    ipAddress,
    userAgent,
  };
}

export type TRPCContext = inferAsyncReturnType<typeof createTRPCContext>;
