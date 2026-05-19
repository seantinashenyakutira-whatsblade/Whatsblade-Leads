'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLeads } from '@/hooks/use-leads';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, statusColor } from '@/lib/utils';
import { Plus, Search, ChevronLeft, ChevronRight, Download, FileSpreadsheet, LayoutGrid, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { AdvancedFilterBar } from '@/components/pipeline/advanced-filter-bar';
import { SavedFilterPresets } from '@/components/pipeline/saved-filter-presets';
import type { SavedFilter } from '@/types';

const INDUSTRIES = ['Restaurant', 'Retail', 'Healthcare', 'Technology', 'Finance', 'Education', 'Real Estate', 'Automotive', 'Hospitality', 'Construction'];
const COUNTRIES = ['Zambia', 'South Africa', 'Kenya', 'Nigeria', 'Ghana', 'Tanzania', 'Uganda', 'Zimbabwe', 'Botswana', 'Namibia'];

type SortField = 'created_at' | 'first_name' | 'last_name' | 'email' | 'status' | 'updated_at' | 'lead_score' | 'company' | 'last_contacted_at' | 'deal_value';
type SortDirection = 'asc' | 'desc';

export default function LeadsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortDirection>('desc');
  const [filters, setFilters] = useState<Record<string, unknown>>({});

  const queryFilters = {
    search: search || undefined,
    page,
    pageSize: 20,
    sortBy,
    sortOrder,
    ...filters,
  };

  const { data, isLoading } = useLeads(queryFilters);

  const handleSort = (column: SortField) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
    setPage(1);
  };

  const handleClearFilters = () => {
    setFilters({});
    setSearch('');
    setPage(1);
  };

  const handleSavePreset = () => {};

  const handleApplyPreset = (preset: SavedFilter) => {
    setFilters(preset.filter_config as Record<string, unknown>);
    setPage(1);
  };

  const handleExportCSV = async () => {
    const input = encodeURIComponent(JSON.stringify(filters));
    const res = await fetch(`/api/trpc/export.leadsCSV?input=${input}`);
    const json = await res.json();
    const result = json.result.data;
    const blob = new Blob([result.csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = result.filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportExcel = async () => {
    const input = encodeURIComponent(JSON.stringify(filters));
    const res = await fetch(`/api/trpc/export.leadsExcel?input=${input}`);
    const json = await res.json();
    const result = json.result.data;
    const byteCharacters = atob(result.excel);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = result.filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sortBy !== column) return <ArrowUpDown className="h-3 w-3 ml-1" />;
    return sortOrder === 'asc' ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Leads</h1>
          <p className="text-muted-foreground">Manage your leads and prospects</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/pipeline">
            <Button variant="outline" size="sm">
              <LayoutGrid className="mr-1 h-4 w-4" /> Pipeline View
            </Button>
          </Link>
          <Link href="/dashboard/leads/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Lead
            </Button>
          </Link>
        </div>
      </div>

      {/* Search and quick filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search leads..."
            className="pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <Select value={(filters.status as string) || ''} onChange={(e) => { setFilters({ ...filters, status: e.target.value || undefined }); setPage(1); }}>
          <option value="">All statuses</option>
          <option value="new">New Lead</option>
          <option value="contacted">Contacted</option>
          <option value="replied">Replied</option>
          <option value="meeting_booked">Meeting Booked</option>
          <option value="proposal_sent">Proposal Sent</option>
          <option value="converted">Closed Won</option>
          <option value="lost">Closed Lost</option>
        </Select>
        <SavedFilterPresets currentFilters={{ ...filters, search }} onApply={handleApplyPreset} />
        <Button variant="outline" size="sm" onClick={handleExportCSV}>
          <Download className="mr-1 h-3 w-3" /> CSV
        </Button>
        <Button variant="outline" size="sm" onClick={handleExportExcel}>
          <FileSpreadsheet className="mr-1 h-3 w-3" /> Excel
        </Button>
      </div>

      {/* Advanced filters */}
      <AdvancedFilterBar
        filters={filters}
        onFilterChange={setFilters}
        onClear={handleClearFilters}
        onSavePreset={handleSavePreset}
        agents={[]}
        industries={INDUSTRIES}
        countries={COUNTRIES}
        cities={[]}
      />

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer" onClick={() => handleSort('company')}>
                <span className="flex items-center">Name <SortIcon column="company" /></span>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('email')}>
                <span className="flex items-center">Email <SortIcon column="email" /></span>
              </TableHead>
              <TableHead>Industry</TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('lead_score')}>
                <span className="flex items-center">Score <SortIcon column="lead_score" /></span>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('status')}>
                <span className="flex items-center">Status <SortIcon column="status" /></span>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('deal_value')}>
                <span className="flex items-center">Deal Value <SortIcon column="deal_value" /></span>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('last_contacted_at')}>
                <span className="flex items-center">Last Contacted <SortIcon column="last_contacted_at" /></span>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : data?.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  No leads found
                </TableCell>
              </TableRow>
            ) : (
              data?.items.map((lead) => {
                const businessName = lead.company || `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Unknown';
                return (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">
                      <Link href={`/dashboard/leads/${lead.id}`} className="hover:underline">
                        {businessName}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm">{lead.email || '—'}</TableCell>
                    <TableCell className="text-sm">{lead.industry || '—'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {lead.lead_score}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs ${statusColor(lead.status)}`}>
                        {lead.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {lead.deal_value ? `$${lead.deal_value.toLocaleString()}` : '—'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {lead.last_contacted_at ? formatDate(lead.last_contacted_at) : 'Never'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/dashboard/leads/${lead.id}`}>
                        <Button variant="ghost" size="sm">View</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {data.page} of {data.totalPages} ({data.total} total)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
