'use client';

import { trpc } from '@/lib/trpc/trpc-provider';

export function usePreferences() {
  return trpc.settings.getPreferences.useQuery();
}

export function useUpdatePreferences() {
  const utils = trpc.useUtils();
  return trpc.settings.updatePreferences.useMutation({
    onSuccess: () => {
      utils.settings.getPreferences.invalidate();
    },
  });
}

export function useUpdateTheme() {
  const utils = trpc.useUtils();
  return trpc.settings.updateTheme.useMutation({
    onSuccess: () => {
      utils.settings.getPreferences.invalidate();
    },
  });
}
