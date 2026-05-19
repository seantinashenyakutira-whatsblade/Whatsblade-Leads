'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, List, Megaphone, MessageSquare, BarChart3 } from 'lucide-react';

const navItems = [
  { href: '/dashboard/discover', icon: Search, label: 'Search' },
  { href: '/dashboard/leads', icon: List, label: 'Leads' },
  { href: '/dashboard/campaigns', icon: Megaphone, label: 'Campaigns' },
  { href: '/dashboard/messages', icon: MessageSquare, label: 'Messages' },
  { href: '/dashboard', icon: BarChart3, label: 'Dashboard' },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-zinc-800 bg-zinc-950/95 backdrop-blur-lg md:hidden"
      role="navigation"
      aria-label="Mobile navigation"
    >
      {navItems.map(({ href, icon: Icon, label }) => {
        const isActive =
          href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname.startsWith(href);

        return (
          <Link
            key={href}
            href={href}
            className={`flex min-h-[48px] min-w-[48px] flex-col items-center justify-center gap-0.5 px-3 py-2 text-xs transition-colors ${
              isActive
                ? 'text-indigo-400'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
