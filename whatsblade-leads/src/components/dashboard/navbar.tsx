'use client';

import { useAuth } from '@/providers/auth-provider';
import { useLogout } from '@/hooks/use-auth';
import { useUnreadCount } from '@/hooks/use-notifications';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Bell, LogOut, Settings } from 'lucide-react';
import { getInitials } from '@/lib/utils';
import Link from 'next/link';
import { useState } from 'react';
import { QuickSearch } from '@/components/dashboard/quick-search';

export function Navbar() {
  const { user } = useAuth();
  const logout = useLogout();
  const { data: unreadCount } = useUnreadCount();
  const [showMenu, setShowMenu] = useState(false);

  return (
    <header className="flex h-14 items-center border-b bg-card px-4 lg:px-6">
      <div className="flex-1">
        <QuickSearch />
      </div>

      <div className="flex items-center gap-2">
        <Link href="/dashboard/activity">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {(unreadCount ?? 0) > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                {unreadCount}
              </span>
            )}
          </Button>
        </Link>

        <div className="relative">
          <Button
            variant="ghost"
            className="flex items-center gap-2"
            onClick={() => setShowMenu(!showMenu)}
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.avatar_url ?? undefined} />
              <AvatarFallback>{user ? getInitials(user.full_name ?? user.email) : '?'}</AvatarFallback>
            </Avatar>
            <div className="hidden text-left md:block">
              <p className="text-sm font-medium">{user?.full_name ?? user?.email}</p>
              <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
            </div>
          </Button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 z-50 mt-1 w-48 rounded-md border bg-popover p-1 shadow-md">
                <Link
                  href="/dashboard/settings"
                  className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                  onClick={() => setShowMenu(false)}
                >
                  <Settings className="h-4 w-4" /> Settings
                </Link>
                <button
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                  onClick={() => {
                    setShowMenu(false);
                    logout.mutate();
                  }}
                >
                  <LogOut className="h-4 w-4" /> Log out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
