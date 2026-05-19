'use client';

import { useNotifications, useMarkRead, useMarkAllRead } from '@/hooks/use-notifications';
import { useUnreadCount } from '@/hooks/use-notifications';
import { Button } from '@/components/ui/button';
import { Bell, CheckCheck } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useState } from 'react';

export function NotificationBell() {
  const { data: notifications } = useNotifications();
  const { data: unreadCount } = useUnreadCount();
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <Button variant="ghost" size="icon" className="relative" onClick={() => setOpen(!open)}>
        <Bell className="h-5 w-5" />
        {(unreadCount ?? 0) > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
            {Math.min(unreadCount ?? 0, 99)}
          </span>
        )}
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-80 rounded-md border bg-popover shadow-md">
            <div className="flex items-center justify-between border-b px-4 py-2">
              <p className="text-sm font-medium">Notifications</p>
              {(unreadCount ?? 0) > 0 && (
                <Button variant="ghost" size="sm" className="h-auto text-xs" onClick={() => markAllRead.mutate()}>
                  <CheckCheck className="mr-1 h-3 w-3" /> Mark all read
                </Button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {!notifications?.length ? (
                <p className="p-4 text-center text-sm text-muted-foreground">No notifications</p>
              ) : (
                notifications.slice(0, 20).map((n) => (
                  <div
                    key={n.id}
                    className={`cursor-pointer border-b px-4 py-3 transition-colors hover:bg-accent ${!n.is_read ? 'bg-accent/50' : ''}`}
                    onClick={() => {
                      if (!n.is_read) markRead.mutate({ id: n.id });
                      setOpen(false);
                    }}
                  >
                    <p className="text-sm font-medium">{n.title}</p>
                    {n.body && <p className="text-xs text-muted-foreground">{n.body}</p>}
                    <p className="mt-1 text-xs text-muted-foreground">{formatDate(n.created_at)}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
