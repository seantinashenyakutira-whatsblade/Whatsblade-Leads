'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { LeadScoreBadge } from './lead-score-badge';
import { Facebook, Instagram, Linkedin, Twitter, Star, MapPin, Phone, Mail, Globe, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, SearchX } from 'lucide-react';
import type { DiscoveredLead } from '@/types';

interface ResultsTableProps {
  items: DiscoveredLead[];
  isLoading: boolean;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onSort: (column: string) => void;
  sortColumn: string;
  sortOrder: 'asc' | 'desc';
  page?: number;
  totalPages?: number;
  total?: number;
  onPageChange?: (page: number) => void;
}

export function ResultsTable({
  items,
  isLoading,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onSort,
  sortColumn,
  sortOrder,
  page = 1,
  totalPages = 1,
  total = 0,
  onPageChange,
}: ResultsTableProps) {
  const allSelected = items.length > 0 && items.every((item) => selectedIds.has(item.id));

  const SortIcon = ({ column }: { column: string }) => {
    if (sortColumn !== column) return <ChevronUp className="h-3 w-3 text-muted-foreground" />;
    return sortOrder === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />;
  };

  const SocialIcons = ({ socialMedia }: { socialMedia: Record<string, string> }) => {
    const icons: Record<string, React.ReactNode> = {
      facebook: <Facebook className="h-3.5 w-3.5 text-blue-600" />,
      instagram: <Instagram className="h-3.5 w-3.5 text-pink-600" />,
      linkedin: <Linkedin className="h-3.5 w-3.5 text-blue-700" />,
      twitter: <Twitter className="h-3.5 w-3.5 text-sky-500" />,
      google_maps: <MapPin className="h-3.5 w-3.5 text-red-500" />,
    };
    return (
      <div className="flex gap-1">
        {Object.keys(socialMedia).map((key) => (
          <a key={key} href={socialMedia[key]} target="_blank" rel="noopener noreferrer" className="hover:opacity-70">
            {icons[key] || <Globe className="h-3.5 w-3.5" />}
          </a>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"></TableHead>
              {Array.from({ length: 9 }).map((_, i) => (
                <TableHead key={i}><Skeleton className="h-4 w-20" /></TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 8 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: 10 }).map((_, j) => (
                  <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="rounded-md border p-12 text-center">
        <SearchX className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No results found</h3>
        <p className="text-muted-foreground mb-4">Try adjusting your search criteria or expanding your search radius.</p>
        <div className="text-sm text-muted-foreground">
          <p>Tips:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Try a different industry or keyword</li>
            <li>Expand your search radius</li>
            <li>Remove some filters</li>
            <li>Try searching in a different city</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={onSelectAll}
                />
              </TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => onSort('leadScore')}>
                <div className="flex items-center gap-1">Score <SortIcon column="leadScore" /></div>
              </TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => onSort('name')}>
                <div className="flex items-center gap-1">Business <SortIcon column="name" /></div>
              </TableHead>
              <TableHead>Industry</TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => onSort('city')}>
                <div className="flex items-center gap-1">Location <SortIcon column="city" /></div>
              </TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => onSort('rating')}>
                <div className="flex items-center gap-1">Rating <SortIcon column="rating" /></div>
              </TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Website</TableHead>
              <TableHead>Social</TableHead>
              <TableHead>Source</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((lead) => (
              <TableRow key={lead.id} className={selectedIds.has(lead.id) ? 'bg-muted/50' : ''}>
                <TableCell>
                  <Checkbox
                    checked={selectedIds.has(lead.id)}
                    onCheckedChange={() => onToggleSelect(lead.id)}
                  />
                </TableCell>
                <TableCell>
                  <LeadScoreBadge score={lead.leadScore} size="sm" />
                </TableCell>
                <TableCell className="font-medium max-w-[200px]">
                  <div className="truncate" title={lead.name}>{lead.name}</div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground max-w-[150px]">
                  <div className="truncate" title={lead.industry || ''}>{lead.industry || '—'}</div>
                </TableCell>
                <TableCell className="text-sm max-w-[150px]">
                  <div className="flex items-center gap-1 truncate">
                    <MapPin className="h-3 w-3 shrink-0 text-muted-foreground" />
                    <span className="truncate">{lead.city || lead.country || '—'}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {lead.googleRating ? (
                    <div className="flex items-center gap-1 text-sm">
                      <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                      <span>{lead.googleRating}</span>
                      {lead.googleReviewCount && (
                        <span className="text-muted-foreground">({lead.googleReviewCount})</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-0.5">
                    {lead.phone && (
                      <div className="flex items-center gap-1 text-xs">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        <span className="truncate max-w-[120px]">{lead.phone}</span>
                      </div>
                    )}
                    {lead.email && (
                      <div className="flex items-center gap-1 text-xs">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        <span className="truncate max-w-[120px]">{lead.email}</span>
                      </div>
                    )}
                    {!lead.phone && !lead.email && <span className="text-muted-foreground text-xs">—</span>}
                  </div>
                </TableCell>
                <TableCell>
                  {lead.website ? (
                    <a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                      <Globe className="h-3 w-3" /> Visit
                    </a>
                  ) : (
                    <Badge variant="outline" className="text-[10px]">No website</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <SocialIcons socialMedia={lead.socialMedia} />
                </TableCell>
                <TableCell>
                  <Badge variant={lead.source === 'google' ? 'default' : 'secondary'} className="text-[10px] capitalize">
                    {lead.source}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {onPageChange && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {items.length} of {total} results (Page {page} of {totalPages})
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              
              return (
                <Button
                  key={pageNum}
                  variant={page === pageNum ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onPageChange(pageNum)}
                  className="w-8 h-8 p-0"
                >
                  {pageNum}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
