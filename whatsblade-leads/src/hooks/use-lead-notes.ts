'use client';

import { trpc } from '@/lib/trpc/trpc-provider';

export function useLeadNotes(leadId: string) {
  return trpc.notes.list.useQuery({ leadId }, { enabled: !!leadId });
}

export function useCreateNote() {
  const utils = trpc.useUtils();
  return trpc.notes.create.useMutation({
    onSuccess: (_, variables) => {
      utils.notes.list.invalidate({ leadId: variables.leadId });
    },
  });
}

export function useUpdateNote() {
  const utils = trpc.useUtils();
  return trpc.notes.update.useMutation({
    onSuccess: (data) => {
      utils.notes.list.invalidate({ leadId: data.lead_id });
    },
  });
}

export function useDeleteNote() {
  const utils = trpc.useUtils();
  return trpc.notes.delete.useMutation({
    onSuccess: () => {
      utils.notes.list.invalidate();
    },
  });
}
