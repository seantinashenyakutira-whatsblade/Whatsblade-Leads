'use client';

import { useState } from 'react';
import { SearchFilters } from '@/components/discover/search-filters';
import { ResultsTable } from '@/components/discover/results-table';
import { BulkActions } from '@/components/discover/bulk-actions';
import { AddToCampaignDialog } from '@/components/discover/add-to-campaign-dialog';
import { useDiscoverSearch, useSaveDiscoveredLeads } from '@/hooks/use-discover';
import { useSaveSearch } from '@/hooks/use-search';
import type { DiscoveredLead } from '@/types';
import type { DiscoverFilterInput } from '@/lib/validations/discover';
import { toast } from 'sonner';

const DEFAULT_FILTERS: DiscoverFilterInput = {
  industry: undefined,
  country: undefined,
  city: undefined,
  radius: '25',
  noWebsiteOnly: false,
  hasPhone: false,
  hasEmail: false,
  hasSocialMedia: false,
  minRating: undefined,
  maxResults: '25',
  page: 1,
  sortBy: 'leadScore',
  sortOrder: 'desc',
};

export default function DiscoverPage() {
  const [filters, setFilters] = useState<DiscoverFilterInput>(DEFAULT_FILTERS);
  const [results, setResults] = useState<DiscoveredLead[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortColumn, setSortColumn] = useState<string>('leadScore');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showCampaignDialog, setShowCampaignDialog] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  const { isLoading, refetch } = useDiscoverSearch(filters);
  const saveMutation = useSaveDiscoveredLeads();
  const saveSearchMutation = useSaveSearch();

  const handleSearch = async () => {
    try {
      const result = await refetch();
      if (result.data && !result.data.error) {
        setResults(result.data.items || []);
        setPagination({
          page: result.data.page || 1,
          totalPages: result.data.totalPages || 1,
          total: result.data.total || 0,
        });

        const searchQuery = [filters.industry, filters.city, filters.country].filter(Boolean).join(' ');
        saveSearchMutation.mutate({
          query: searchQuery || 'business',
          industry: filters.industry,
          country: filters.country,
          city: filters.city,
          radius: parseInt(filters.radius),
          filters: {
            noWebsiteOnly: filters.noWebsiteOnly,
            hasPhone: filters.hasPhone,
            hasEmail: filters.hasEmail,
            hasSocialMedia: filters.hasSocialMedia,
            minRating: filters.minRating,
          },
          resultCount: result.data.total || 0,
        });
      } else if (result.data?.error) {
        toast.error(result.data.error);
        setResults([]);
        setPagination({ page: 1, totalPages: 1, total: 0 });
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Search failed. Please try again.';
      toast.error(message);
      setResults([]);
      setPagination({ page: 1, totalPages: 1, total: 0 });
    }
  };

  const handleFilterChange = (newFilters: {
    industry: string;
    country: string;
    city: string;
    radius: string;
    noWebsiteOnly: boolean;
    hasPhone: boolean;
    hasEmail: boolean;
    hasSocialMedia: boolean;
    minRating: number | undefined;
    maxResults: string;
    page?: number;
    sortBy?: string;
    sortOrder?: string;
  }) => {
    setFilters({
      industry: newFilters.industry || undefined,
      country: newFilters.country || undefined,
      city: newFilters.city || undefined,
      radius: newFilters.radius as DiscoverFilterInput['radius'],
      noWebsiteOnly: newFilters.noWebsiteOnly,
      hasPhone: newFilters.hasPhone,
      hasEmail: newFilters.hasEmail,
      hasSocialMedia: newFilters.hasSocialMedia,
      minRating: newFilters.minRating,
      maxResults: newFilters.maxResults as DiscoverFilterInput['maxResults'],
      page: newFilters.page || 1,
      sortBy: (newFilters.sortBy as DiscoverFilterInput['sortBy']) || 'leadScore',
      sortOrder: (newFilters.sortOrder as DiscoverFilterInput['sortOrder']) || 'desc',
    });
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
    handleSearch();
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === results.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(results.map((r) => r.id)));
    }
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortOrder('desc');
    }
    setFilters((prev) => ({ ...prev, sortBy: column as DiscoverFilterInput['sortBy'], sortOrder: sortOrder === 'asc' ? 'desc' : 'asc' }));
  };

  const handleSaveSelected = async () => {
    const selected = results.filter((r) => selectedIds.has(r.id));
    try {
      await saveMutation.mutateAsync({ leads: selected });
      toast.success(`${selected.length} lead(s) saved successfully.`);
      setSelectedIds(new Set());
    } catch {
      toast.error('Failed to save leads.');
    }
  };

  const handleAddToCampaign = () => {
    setShowCampaignDialog(true);
  };

  const handleExport = () => {
    const selected = results.filter((r) => selectedIds.has(r.id));
    const csv = [
      'Name,Industry,City,Country,Phone,Email,Website,Rating,Score,Source',
      ...selected.map((r) =>
        `"${r.name}","${r.industry || ''}","${r.city || ''}","${r.country || ''}","${r.phone || ''}","${r.email || ''}","${r.website || ''}",${r.googleRating || ''},${r.leadScore},${r.source}`
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'leads-export.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Leads exported successfully.');
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  const sortedResults = [...results].sort((a, b) => {
    const aVal = a[sortColumn as keyof DiscoveredLead];
    const bVal = b[sortColumn as keyof DiscoveredLead];

    if (aVal == null) return 1;
    if (bVal == null) return -1;

    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }

    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    }

    return 0;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Business Intelligence Search</h1>
        <p className="text-muted-foreground">Discover and score leads from Google and Facebook.</p>
      </div>

      <SearchFilters
        filters={{
          industry: filters.industry || '',
          country: filters.country || '',
          city: filters.city || '',
          radius: filters.radius,
          noWebsiteOnly: filters.noWebsiteOnly,
          hasPhone: filters.hasPhone,
          hasEmail: filters.hasEmail,
          hasSocialMedia: filters.hasSocialMedia,
          minRating: filters.minRating,
          maxResults: filters.maxResults,
          page: filters.page,
          sortBy: filters.sortBy,
          sortOrder: filters.sortOrder,
        }}
        onChange={handleFilterChange}
        onSearch={handleSearch}
        isSearching={isLoading}
      />

      <ResultsTable
        items={sortedResults}
        isLoading={isLoading}
        selectedIds={selectedIds}
        onToggleSelect={handleToggleSelect}
        onSelectAll={handleSelectAll}
        onSort={handleSort}
        sortColumn={sortColumn}
        sortOrder={sortOrder}
        page={pagination.page}
        totalPages={pagination.totalPages}
        total={pagination.total}
        onPageChange={handlePageChange}
      />

      <BulkActions
        selectedCount={selectedIds.size}
        onSave={handleSaveSelected}
        onAddToCampaign={handleAddToCampaign}
        onExport={handleExport}
        onClear={handleClearSelection}
      />

      <AddToCampaignDialog
        open={showCampaignDialog}
        onOpenChange={setShowCampaignDialog}
        selectedLeads={results.filter((r) => selectedIds.has(r.id))}
        onSuccess={() => {
          toast.success('Leads added to campaign.');
          setSelectedIds(new Set());
        }}
      />
    </div>
  );
}
