'use client';

import { trpc } from '@/lib/trpc/trpc-provider';

export function useBusinessProfile() {
  const utils = trpc.useUtils();
  const profile = trpc.outreach.getBusinessProfile.useQuery();
  const update = trpc.outreach.updateBusinessProfile.useMutation({
    onSuccess: () => {
      utils.outreach.getBusinessProfile.invalidate();
    },
  });
  return { profile: profile.data, isLoading: profile.isLoading, update };
}

export function useGenerateMessage() {
  return trpc.outreach.generateMessage.useMutation();
}

export function useRegenerateMessage() {
  return trpc.outreach.regenerateMessage.useMutation();
}

export function useSaveOutreach() {
  const utils = trpc.useUtils();
  return trpc.outreach.saveOutreach.useMutation({
    onSuccess: (_, vars) => {
      utils.outreach.getLeadHistory.invalidate({ leadId: vars.leadId });
      utils.messages.getByLead.invalidate({ leadId: vars.leadId });
    },
  });
}

export function useLeadHistory(leadId: string) {
  return trpc.outreach.getLeadHistory.useQuery({ leadId }, { enabled: !!leadId });
}

export function useUpdateMessageStatus() {
  const utils = trpc.useUtils();
  return trpc.outreach.updateMessageStatus.useMutation({
    onSuccess: () => {
      utils.outreach.getLeadHistory.invalidate();
      utils.messages.list.invalidate();
    },
  });
}

export function useBulkGenerate() {
  return trpc.outreach.generateBulkMessages.useMutation();
}

export function useCampaignStats(campaignId: string) {
  return trpc.outreach.getCampaignStats.useQuery({ campaignId }, { enabled: !!campaignId });
}

export function useMessageTemplates() {
  const utils = trpc.useUtils();
  const templates = trpc.outreach.listTemplates.useQuery();
  const create = trpc.outreach.createTemplate.useMutation({
    onSuccess: () => {
      utils.outreach.listTemplates.invalidate();
    },
  });
  const remove = trpc.outreach.deleteTemplate.useMutation({
    onSuccess: () => {
      utils.outreach.listTemplates.invalidate();
    },
  });
  return { templates: templates.data || [], isLoading: templates.isLoading, create, remove };
}

export function useApplyTemplate() {
  return trpc.outreach.applyTemplate.useMutation();
}

export function useLeadAnalysis(leadId: string) {
  return trpc.outreach.getLeadAnalysis.useQuery({ leadId }, { enabled: !!leadId });
}

export function useAnalyzeLead() {
  const utils = trpc.useUtils();
  return trpc.outreach.analyzeLead.useMutation({
    onSuccess: (_, vars) => {
      utils.outreach.getLeadAnalysis.invalidate({ leadId: vars.leadId });
    },
  });
}
