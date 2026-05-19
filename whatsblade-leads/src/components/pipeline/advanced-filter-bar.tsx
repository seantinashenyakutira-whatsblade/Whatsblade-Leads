'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ChevronDown, ChevronUp, Filter, X } from 'lucide-react';

interface AdvancedFilterBarProps {
  filters: Record<string, unknown>;
  onFilterChange: (filters: Record<string, unknown>) => void;
  onClear: () => void;
  onSavePreset: () => void;
  agents: { id: string; name: string }[];
  industries: string[];
  countries: string[];
  cities: string[];
}

export function AdvancedFilterBar({
  filters,
  onFilterChange,
  onClear,
  onSavePreset,
  agents,
  industries,
  countries,
  cities,
}: AdvancedFilterBarProps) {
  const [expanded, setExpanded] = useState(false);

  const activeCount = Object.entries(filters).filter(([k, v]) => {
    if (k === 'page' || k === 'pageSize' || k === 'sortBy' || k === 'sortOrder') return false;
    return v !== undefined && v !== '' && v !== false;
  }).length;

  const update = (key: string, value: unknown) => {
    onFilterChange({ ...filters, [key]: value || undefined });
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
        >
          <Filter className="h-4 w-4" />
          Advanced Filters
          {activeCount > 0 && (
            <Badge variant="secondary" className="text-xs">{activeCount}</Badge>
          )}
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onSavePreset} disabled={activeCount === 0}>
            Save Preset
          </Button>
          <Button variant="ghost" size="sm" onClick={onClear} disabled={activeCount === 0}>
            <X className="h-3 w-3 mr-1" /> Clear
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Status</label>
            <Select
              value={(filters.status as string) || ''}
              onChange={(e) => update('status', e.target.value)}
            >
              <option value="">All</option>
              <option value="new">New Lead</option>
              <option value="contacted">Contacted</option>
              <option value="replied">Replied</option>
              <option value="meeting_booked">Meeting Booked</option>
              <option value="proposal_sent">Proposal Sent</option>
              <option value="converted">Closed Won</option>
              <option value="lost">Closed Lost</option>
            </Select>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Industry</label>
            <Select
              value={(filters.industry as string) || ''}
              onChange={(e) => update('industry', e.target.value)}
            >
              <option value="">All</option>
              {industries.map((ind) => (
                <option key={ind} value={ind}>{ind}</option>
              ))}
            </Select>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Country</label>
            <Select
              value={(filters.country as string) || ''}
              onChange={(e) => update('country', e.target.value)}
            >
              <option value="">All</option>
              {countries.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">City</label>
            <Select
              value={(filters.city as string) || ''}
              onChange={(e) => update('city', e.target.value)}
            >
              <option value="">All</option>
              {cities.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Min Lead Score</label>
            <Input
              type="number"
              min={0}
              max={100}
              placeholder="0"
              value={(filters.minLeadScore as number) ?? ''}
              onChange={(e) => update('minLeadScore', e.target.value ? Number(e.target.value) : undefined)}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Max Lead Score</label>
            <Input
              type="number"
              min={0}
              max={100}
              placeholder="100"
              value={(filters.maxLeadScore as number) ?? ''}
              onChange={(e) => update('maxLeadScore', e.target.value ? Number(e.target.value) : undefined)}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Assigned Agent</label>
            <Select
              value={(filters.assignedTo as string) || ''}
              onChange={(e) => update('assignedTo', e.target.value)}
            >
              <option value="">All</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </Select>
          </div>

          <div className="flex items-end gap-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={(filters.hasPhone as boolean) || false}
                onChange={(e) => update('hasPhone', e.target.checked)}
                className="rounded border-gray-300"
              />
              Has Phone
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={(filters.hasEmail as boolean) || false}
                onChange={(e) => update('hasEmail', e.target.checked)}
                className="rounded border-gray-300"
              />
              Has Email
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={(filters.hasSocial as boolean) || false}
                onChange={(e) => update('hasSocial', e.target.checked)}
                className="rounded border-gray-300"
              />
              Has Social
            </label>
          </div>
        </div>
      )}
    </Card>
  );
}
