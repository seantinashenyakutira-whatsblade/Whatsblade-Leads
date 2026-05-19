'use client';

import { useAuth } from '@/providers/auth-provider';
import { trpc } from '@/lib/trpc/trpc-provider';

export function useUser() {
  const { user } = useAuth();
  return user;
}

export function useRole() {
  const { user } = useAuth();
  return user?.role ?? null;
}

export function useIsAdmin() {
  const { user } = useAuth();
  return user?.role === 'admin';
}

export function useSession() {
  const { session, supabaseUser } = useAuth();
  return { session, user: supabaseUser };
}

export function useLogin() {
  const utils = trpc.useUtils();
  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: () => utils.auth.me.invalidate(),
  });
  return loginMutation;
}

export function useLogout() {
  const utils = trpc.useUtils();
  return trpc.auth.logout.useMutation({
    onSuccess: () => {
      utils.auth.me.invalidate();
      window.location.href = '/login';
    },
  });
}

export function useUpdateProfile() {
  const utils = trpc.useUtils();
  return trpc.auth.updateProfile.useMutation({
    onSuccess: () => utils.auth.me.invalidate(),
  });
}
