'use client';

import { trpc } from '@/lib/trpc/trpc-provider';
import type { CampaignFilterInput } from '@/lib/validations/campaign';

export function useCampaigns(filters: CampaignFilterInput) {
  return trpc.campaigns.list.useQuery(filters);
}

export function useCampaign(id: string) {
  return trpc.campaigns.getById.useQuery({ id }, { enabled: !!id });
}

export function useCreateCampaign() {
  const utils = trpc.useUtils();
  return trpc.campaigns.create.useMutation({
    onSuccess: () => utils.campaigns.list.invalidate(),
  });
}

export function useUpdateCampaign() {
  const utils = trpc.useUtils();
  return trpc.campaigns.update.useMutation({
    onSuccess: () => {
      utils.campaigns.list.invalidate();
      utils.campaigns.getById.invalidate();
    },
  });
}

export function useStartCampaign() {
  const utils = trpc.useUtils();
  return trpc.campaigns.start.useMutation({
    onSuccess: () => {
      utils.campaigns.list.invalidate();
      utils.campaigns.getById.invalidate();
    },
  });
}

export function usePauseCampaign() {
  const utils = trpc.useUtils();
  return trpc.campaigns.pause.useMutation({
    onSuccess: () => {
      utils.campaigns.list.invalidate();
      utils.campaigns.getById.invalidate();
    },
  });
}

export function useCompleteCampaign() {
  const utils = trpc.useUtils();
  return trpc.campaigns.complete.useMutation({
    onSuccess: () => {
      utils.campaigns.list.invalidate();
      utils.campaigns.getById.invalidate();
    },
  });
}

export function useAddLeadsToCampaign() {
  const utils = trpc.useUtils();
  return trpc.campaigns.addLeads.useMutation({
    onSuccess: () => utils.campaigns.getById.invalidate(),
  });
}
