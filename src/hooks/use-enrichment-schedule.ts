'use client';

import { trpc } from '@/lib/trpc/trpc-provider';

export function useEnrichmentSchedules(leadId: string) {
  return trpc.enrichmentSchedule.getByLead.useQuery({ leadId }, {
    enabled: !!leadId,
    refetchOnWindowFocus: false,
  });
}

export function useCreateEnrichmentSchedule() {
  const utils = trpc.useUtils();
  return trpc.enrichmentSchedule.create.useMutation({
    onSuccess: (_, variables) => {
      utils.enrichmentSchedule.getByLead.invalidate({ leadId: variables.leadId });
    },
  });
}

export function useCancelEnrichmentSchedule() {
  const utils = trpc.useUtils();
  return trpc.enrichmentSchedule.cancel.useMutation({
    onSuccess: () => {
      utils.enrichmentSchedule.getByLead.invalidate();
    },
  });
}

export function useRunEnrichmentNow() {
  const utils = trpc.useUtils();
  return trpc.enrichmentSchedule.runNow.useMutation({
    onSuccess: (_, variables) => {
      utils.enrichment.getEnrichmentStatus.invalidate({ leadId: variables.leadId });
      utils.enrichment.getLeadIntelligence.invalidate({ leadId: variables.leadId });
      utils.leads.getById.invalidate({ id: variables.leadId });
    },
  });
}

export function useBatchEnrich() {
  const utils = trpc.useUtils();
  return trpc.enrichmentSchedule.batchEnrich.useMutation({
    onSuccess: () => {
      utils.leads.list.invalidate();
    },
  });
}
