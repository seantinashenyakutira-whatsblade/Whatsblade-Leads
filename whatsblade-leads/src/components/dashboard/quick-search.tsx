'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useLeads } from '@/hooks/use-leads';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Building2, MapPin, Loader2 } from 'lucide-react';
import { statusColor } from '@/lib/utils';

export function QuickSearch() {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useLeads({
    search: query || undefined,
    page: 1,
    pageSize: 8,
    sortBy: 'lead_score',
    sortOrder: 'desc',
  });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (id: string) => {
    setOpen(false);
    setQuery('');
    router.push(`/dashboard/leads/${id}`);
  };

  return (
    <div ref={ref} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search leads..."
          className="pl-9"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => query && setOpen(true)}
        />
      </div>

      {open && query && (
        <Card className="absolute z-50 mt-1 w-full shadow-lg max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : !data?.items.length ? (
            <div className="p-4 text-sm text-muted-foreground text-center">No results</div>
          ) : (
            <div className="py-1">
              {data.items.map((lead) => {
                const name = lead.company || `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Unknown';
                return (
                  <button
                    key={lead.id}
                    onClick={() => handleSelect(lead.id)}
                    className="flex items-center gap-3 w-full px-3 py-2 hover:bg-accent text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {lead.industry && (
                          <span className="flex items-center gap-0.5">
                            <Building2 className="h-3 w-3" />
                            {lead.industry}
                          </span>
                        )}
                        {lead.city && (
                          <span className="flex items-center gap-0.5">
                            <MapPin className="h-3 w-3" />
                            {lead.city}
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline" className={`text-[10px] ${statusColor(lead.status)}`}>
                      {lead.status}
                    </Badge>
                  </button>
                );
              })}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
