'use client';

import { trpc } from '@/lib/trpc/trpc-provider';

export function useNotifications() {
  return trpc.settings.getNotifications.useQuery();
}

export function useUnreadCount() {
  return trpc.settings.getUnreadCount.useQuery();
}

export function useMarkRead() {
  const utils = trpc.useUtils();
  return trpc.settings.markNotificationRead.useMutation({
    onSuccess: () => {
      utils.settings.getNotifications.invalidate();
      utils.settings.getUnreadCount.invalidate();
    },
  });
}

export function useMarkAllRead() {
  const utils = trpc.useUtils();
  return trpc.settings.markAllNotificationsRead.useMutation({
    onSuccess: () => {
      utils.settings.getNotifications.invalidate();
      utils.settings.getUnreadCount.invalidate();
    },
  });
}
