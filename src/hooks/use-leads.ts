'use client';

import { trpc } from '@/lib/trpc/trpc-provider';
import type { LeadFilterInput } from '@/lib/validations/lead';

export function useLeads(filters: LeadFilterInput) {
  return trpc.leads.list.useQuery(filters);
}

export function useLead(id: string) {
  return trpc.leads.getById.useQuery({ id }, { enabled: !!id });
}

export function useCreateLead() {
  const utils = trpc.useUtils();
  return trpc.leads.create.useMutation({
    onSuccess: () => utils.leads.list.invalidate(),
  });
}

export function useUpdateLead() {
  const utils = trpc.useUtils();
  return trpc.leads.update.useMutation({
    onSuccess: () => {
      utils.leads.list.invalidate();
      utils.leads.getById.invalidate();
    },
  });
}

export function useDeleteLead() {
  const utils = trpc.useUtils();
  return trpc.leads.delete.useMutation({
    onSuccess: () => utils.leads.list.invalidate(),
  });
}

export function useAssignLeads() {
  const utils = trpc.useUtils();
  return trpc.leads.assign.useMutation({
    onSuccess: () => utils.leads.list.invalidate(),
  });
}

export function useUpdateDealValue() {
  const utils = trpc.useUtils();
  return trpc.leads.updateDealValue.useMutation({
    onSuccess: () => {
      utils.leads.list.invalidate();
      utils.leads.getById.invalidate();
    },
  });
}

export function useUpdateNextAction() {
  const utils = trpc.useUtils();
  return trpc.leads.updateNextAction.useMutation({
    onSuccess: () => {
      utils.leads.list.invalidate();
      utils.leads.getById.invalidate();
    },
  });
}
