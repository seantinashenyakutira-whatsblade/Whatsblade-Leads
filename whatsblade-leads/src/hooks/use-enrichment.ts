'use client';

import { trpc } from '@/lib/trpc/trpc-provider';

export function useEnrichment(leadId: string) {
  const utils = trpc.useUtils();
  const status = trpc.enrichment.getEnrichmentStatus.useQuery({ leadId }, { enabled: !!leadId });
  const run = trpc.enrichment.runEnrichment.useMutation({
    onSuccess: () => {
      utils.enrichment.getEnrichmentStatus.invalidate({ leadId });
      utils.enrichment.getLeadIntelligence.invalidate({ leadId });
    },
  });
  const log = trpc.enrichment.getEnrichmentLog.useQuery({ leadId }, { enabled: !!leadId });
  return {
    status: status.data,
    isLoading: status.isLoading,
    run,
    log: log.data,
  };
}

export function useLeadIntelligence(leadId: string) {
  return trpc.enrichment.getLeadIntelligence.useQuery({ leadId }, { enabled: !!leadId });
}
