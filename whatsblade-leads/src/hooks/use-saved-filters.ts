'use client';

import { trpc } from '@/lib/trpc/trpc-provider';

export function useSavedFilters() {
  return trpc.filters.list.useQuery();
}

export function useSaveFilter() {
  const utils = trpc.useUtils();
  return trpc.filters.save.useMutation({
    onSuccess: () => {
      utils.filters.list.invalidate();
    },
  });
}

export function useUpdateFilter() {
  const utils = trpc.useUtils();
  return trpc.filters.update.useMutation({
    onSuccess: () => {
      utils.filters.list.invalidate();
    },
  });
}

export function useDeleteFilter() {
  const utils = trpc.useUtils();
  return trpc.filters.delete.useMutation({
    onSuccess: () => {
      utils.filters.list.invalidate();
    },
  });
}
