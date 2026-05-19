'use client';

import { useState } from 'react';
import { useSwipe } from '@/hooks/use-swipe';
import { Phone, MessageSquare, Check, X } from 'lucide-react';

interface LeadCardSwipeProps {
  lead: {
    id: string;
    name: string;
    phone?: string | null;
    company?: string | null;
    status: string;
  };
  onSwipeRight?: (leadId: string) => void;
  onSwipeLeft?: (leadId: string) => void;
  children: React.ReactNode;
}

export function LeadCardSwipe({
  lead,
  onSwipeRight,
  onSwipeLeft,
  children,
}: LeadCardSwipeProps) {
  const [action, setAction] = useState<'contacted' | 'dismissed' | null>(null);

  const { bind, swipeState } = useSwipe({
    onSwipeRight: () => {
      setAction('contacted');
      onSwipeRight?.(lead.id);
      setTimeout(() => setAction(null), 1500);
    },
    onSwipeLeft: () => {
      setAction('dismissed');
      onSwipeLeft?.(lead.id);
      setTimeout(() => setAction(null), 1500);
    },
    threshold: 100,
  });

  const translateX = swipeState.direction === 'right'
    ? swipeState.progress * 120
    : swipeState.direction === 'left'
      ? -swipeState.progress * 120
      : 0;

  const backgroundColor = swipeState.direction === 'right'
    ? `rgba(34, 197, 94, ${swipeState.progress * 0.3})`
    : swipeState.direction === 'left'
      ? `rgba(239, 68, 68, ${swipeState.progress * 0.3})`
      : 'transparent';

  return (
    <div
      className="relative overflow-hidden rounded-lg"
      style={{ backgroundColor }}
    >
      {swipeState.direction === 'right' && swipeState.progress > 0.3 && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-green-400">
          <Check className="h-8 w-8" />
        </div>
      )}

      {swipeState.direction === 'left' && swipeState.progress > 0.3 && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-red-400">
          <X className="h-8 w-8" />
        </div>
      )}

      <div
        {...bind()}
        className="relative touch-pan-y transition-transform duration-150 ease-out"
        style={{
          transform: `translateX(${translateX}px)`,
          cursor: 'grab',
        }}
      >
        {children}
      </div>

      <div className="flex items-center gap-2 px-3 py-2 md:hidden">
        {lead.phone && (
          <a
            href={`tel:${lead.phone}`}
            className="flex min-h-[48px] min-w-[48px] flex-1 items-center justify-center gap-2 rounded-lg bg-green-600/20 px-4 py-2 text-sm font-medium text-green-400 transition-colors hover:bg-green-600/30"
            aria-label={`Call ${lead.name}`}
          >
            <Phone className="h-4 w-4" />
            Call
          </a>
        )}
        <a
            href={`https://wa.me/${lead.phone?.replace(/[^\d]/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-[48px] min-w-[48px] flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600/20 px-4 py-2 text-sm font-medium text-emerald-400 transition-colors hover:bg-emerald-600/30"
            aria-label={`WhatsApp ${lead.name}`}
          >
            <MessageSquare className="h-4 w-4" />
            WhatsApp
          </a>
      </div>

      {action && (
        <div
          className={`absolute inset-0 flex items-center justify-center rounded-lg text-lg font-semibold transition-opacity ${
            action === 'contacted'
              ? 'bg-green-500/20 text-green-400'
              : 'bg-red-500/20 text-red-400'
          }`}
        >
          {action === 'contacted' ? 'Marked Contacted' : 'Dismissed'}
        </div>
      )}
    </div>
  );
}
