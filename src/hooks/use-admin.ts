'use client';

import { trpc } from '@/lib/trpc/trpc-provider';

export function useAdminStats() {
  return trpc.admin.getStats.useQuery();
}

export function useAgentPerformance() {
  return trpc.admin.getAgentPerformance.useQuery();
}

export function useApiUsage(days?: number, provider?: string) {
  return trpc.admin.getApiUsage.useQuery({
    days: days ?? 30,
    provider,
  });
}

export function useLeadSourceBreakdown() {
  return trpc.admin.getLeadSourceBreakdown.useQuery();
}

export function useSystemHealth() {
  return trpc.admin.getSystemHealth.useQuery(undefined, {
    refetchInterval: 60000,
  });
}

export function useInviteUser() {
  const utils = trpc.useUtils();
  return trpc.admin.inviteUser.useMutation({
    onSuccess: () => {
      utils.admin.getStats.invalidate();
    },
  });
}

export function useDeactivateUser() {
  const utils = trpc.useUtils();
  return trpc.admin.deactivateUser.useMutation({
    onSuccess: () => {
      utils.admin.getAgentPerformance.invalidate();
      utils.auth.listUsers.invalidate();
    },
  });
}

export function useReactivateUser() {
  const utils = trpc.useUtils();
  return trpc.admin.reactivateUser.useMutation({
    onSuccess: () => {
      utils.admin.getAgentPerformance.invalidate();
      utils.auth.listUsers.invalidate();
    },
  });
}
