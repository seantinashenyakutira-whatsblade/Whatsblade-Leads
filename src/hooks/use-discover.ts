'use client';

import { trpc } from '@/lib/trpc/trpc-provider';
import type { DiscoverFilterInput } from '@/lib/validations/discover';

export function useDiscoverSearch(filters: DiscoverFilterInput) {
  return trpc.discover.search.useQuery(filters, {
    enabled: false,
    refetchOnWindowFocus: false,
  });
}

export function useSaveDiscoveredLeads() {
  const utils = trpc.useUtils();
  return trpc.discover.saveToLeads.useMutation({
    onSuccess: () => {
      utils.leads.list.invalidate();
    },
  });
}

export function useBulkSaveDiscoveredLeads() {
  const utils = trpc.useUtils();
  return trpc.discover.bulkSave.useMutation({
    onSuccess: () => {
      utils.leads.list.invalidate();
      utils.campaigns.list.invalidate();
    },
  });
}
