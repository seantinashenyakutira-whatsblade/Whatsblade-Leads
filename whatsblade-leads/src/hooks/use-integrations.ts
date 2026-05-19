'use client';

import { trpc } from '@/lib/trpc/trpc-provider';

export function useIntegrations() {
  return trpc.integrations.list.useQuery();
}

export function useCreateIntegration() {
  const utils = trpc.useUtils();
  return trpc.integrations.create.useMutation({
    onSuccess: () => {
      utils.integrations.list.invalidate();
    },
  });
}

export function useUpdateIntegration() {
  const utils = trpc.useUtils();
  return trpc.integrations.update.useMutation({
    onSuccess: () => {
      utils.integrations.list.invalidate();
    },
  });
}

export function useDeleteIntegration() {
  const utils = trpc.useUtils();
  return trpc.integrations.delete.useMutation({
    onSuccess: () => {
      utils.integrations.list.invalidate();
    },
  });
}

export function useTestIntegration() {
  return trpc.integrations.testConnection.useMutation();
}

export function useZapierEndpoint() {
  return trpc.integrations.getZapierEndpoint.useQuery();
}
