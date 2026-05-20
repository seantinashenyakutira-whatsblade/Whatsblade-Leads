'use client';

import { trpc } from '@/lib/trpc/trpc-provider';

export function useRecentSearches(limit = 10) {
  return trpc.search.getRecent.useQuery({ limit }, {
    refetchOnWindowFocus: false,
  });
}

export function useSaveSearch() {
  const utils = trpc.useUtils();
  return trpc.search.saveSearch.useMutation({
    onSuccess: () => {
      utils.search.getRecent.invalidate();
    },
  });
}

export function useSavedSearches() {
  return trpc.search.getSaved.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });
}

export function useSaveSearchPreset() {
  const utils = trpc.useUtils();
  return trpc.search.saveSearchPreset.useMutation({
    onSuccess: () => {
      utils.search.getSaved.invalidate();
    },
  });
}

export function useUpdateSavedSearch() {
  const utils = trpc.useUtils();
  return trpc.search.updateSavedSearch.useMutation({
    onSuccess: () => {
      utils.search.getSaved.invalidate();
    },
  });
}

export function useDeleteSavedSearch() {
  const utils = trpc.useUtils();
  return trpc.search.deleteSavedSearch.useMutation({
    onSuccess: () => {
      utils.search.getSaved.invalidate();
    },
  });
}
