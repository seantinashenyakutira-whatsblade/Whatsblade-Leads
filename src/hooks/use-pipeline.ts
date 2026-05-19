'use client';

import { trpc } from '@/lib/trpc/trpc-provider';
import type { Lead, LeadStatus } from '@/types';

export function usePipeline() {
  const results = trpc.leads.list.useQuery({
    page: 1,
    pageSize: 500,
    sortBy: 'lead_score' as const,
    sortOrder: 'desc' as const,
  });

  const grouped: Record<LeadStatus, Lead[]> = {
    new: [],
    contacted: [],
    replied: [],
    meeting_booked: [],
    proposal_sent: [],
    converted: [],
    lost: [],
  };

  if (results.data?.items) {
    for (const lead of results.data.items) {
      const status = lead.status as LeadStatus;
      if (grouped[status]) {
        grouped[status].push(lead);
      }
    }
  }

  return {
    grouped,
    isLoading: results.isLoading,
    refetch: results.refetch,
  };
}

export function useUpdateLeadStatus() {
  const utils = trpc.useUtils();
  return trpc.leads.updateStatus.useMutation({
    onSuccess: () => {
      utils.leads.list.invalidate();
      utils.leads.getById.invalidate();
    },
  });
}
