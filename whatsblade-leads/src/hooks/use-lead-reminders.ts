'use client';

import { trpc } from '@/lib/trpc/trpc-provider';

export function useLeadReminders(leadId: string) {
  return trpc.reminders.list.useQuery({ leadId }, { enabled: !!leadId });
}

export function useUpcomingReminders() {
  return trpc.reminders.upcoming.useQuery();
}

export function useCreateReminder() {
  const utils = trpc.useUtils();
  return trpc.reminders.create.useMutation({
    onSuccess: (_, variables) => {
      utils.reminders.list.invalidate({ leadId: variables.leadId });
      utils.reminders.upcoming.invalidate();
    },
  });
}

export function useUpdateReminder() {
  const utils = trpc.useUtils();
  return trpc.reminders.update.useMutation({
    onSuccess: () => {
      utils.reminders.list.invalidate();
      utils.reminders.upcoming.invalidate();
    },
  });
}

export function useDeleteReminder() {
  const utils = trpc.useUtils();
  return trpc.reminders.delete.useMutation({
    onSuccess: () => {
      utils.reminders.list.invalidate();
      utils.reminders.upcoming.invalidate();
    },
  });
}

export function useMarkReminderDone() {
  const utils = trpc.useUtils();
  return trpc.reminders.markDone.useMutation({
    onSuccess: () => {
      utils.reminders.list.invalidate();
      utils.reminders.upcoming.invalidate();
    },
  });
}
