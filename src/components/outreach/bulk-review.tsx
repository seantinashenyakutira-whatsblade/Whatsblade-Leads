'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Check, X, RefreshCw, Grid, List } from 'lucide-react';
import { PLATFORM_LIMITS, getCharacterStatus } from '@/lib/ai/platform-limits';

interface BulkReviewProps {
  leadId: string;
  leadName: string;
  message: string;
  platform: string;
  error?: string;
  onEdit: (leadId: string, message: string) => void;
  onApprove: (leadId: string) => void;
  onRegenerate: (leadId: string) => void;
  approved: boolean;
}

interface BulkReviewContainerProps {
  results: Array<{
    leadId: string;
    leadName: string;
    message: string;
    characterCount: number;
    error?: string;
  }>;
  platform: string;
  onEdit: (leadId: string, message: string) => void;
  onApprove: (leadId: string) => void;
  onRegenerate: (leadId: string) => void;
  onApproveAll: () => void;
  approvedIds: Set<string>;
}

export function BulkReviewCard({
  leadId,
  leadName,
  message,
  platform,
  error,
  onEdit,
  onApprove,
  onRegenerate,
  approved,
}: BulkReviewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(message);

  const charLimit = PLATFORM_LIMITS[platform];
  const charStatus = charLimit ? getCharacterStatus(platform, editValue.length) : { ok: true, warning: false, overLimit: false };

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium">{leadName}</span>
          <Badge variant="destructive">Error</Badge>
        </div>
        <p className="text-sm text-destructive">{error}</p>
        <Button onClick={() => onRegenerate(leadId)} variant="outline" size="sm" className="mt-2">
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border p-4 ${approved ? 'bg-green-50 border-green-200' : ''}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-medium">{leadName}</span>
          {approved && <Badge variant="default" className="text-[10px]"><Check className="h-3 w-3 mr-1" /> Approved</Badge>}
        </div>
        <div className="flex items-center gap-1">
          <span className={`text-xs ${charStatus.overLimit ? 'text-destructive' : charStatus.warning ? 'text-yellow-500' : 'text-muted-foreground'}`}>
            {editValue.length} chars
          </span>
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-2">
          <Textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="min-h-[100px] text-sm"
          />
          <div className="flex gap-2">
            <Button
              onClick={() => {
                onEdit(leadId, editValue);
                setIsEditing(false);
              }}
              size="sm"
            >
              <Check className="mr-1.5 h-3.5 w-3.5" /> Save
            </Button>
            <Button onClick={() => { setEditValue(message); setIsEditing(false); }} variant="outline" size="sm">
              <X className="h-3.5 w-3.5" /> Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-4">{editValue}</p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
              Edit
            </Button>
            <Button onClick={() => onRegenerate(leadId)} variant="outline" size="sm">
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Regenerate
            </Button>
            {!approved && (
              <Button onClick={() => onApprove(leadId)} size="sm">
                <Check className="mr-1.5 h-3.5 w-3.5" /> Approve
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function BulkReview({
  results,
  platform,
  onEdit,
  onApprove,
  onRegenerate,
  onApproveAll,
  approvedIds,
}: BulkReviewContainerProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{results.length} messages generated</span>
          <span className="text-sm text-muted-foreground">•</span>
          <span className="text-sm text-green-600">{approvedIds.size} approved</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-r-none h-8"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-l-none h-8"
              onClick={() => setViewMode('list')}
            >
              <List className="h-3.5 w-3.5" />
            </Button>
          </div>
          {approvedIds.size < results.length && (
            <Button onClick={onApproveAll} size="sm">
              <Check className="mr-1.5 h-3.5 w-3.5" /> Approve All
            </Button>
          )}
        </div>
      </div>

      <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'space-y-3'}>
        {results.map((result) => (
          <BulkReviewCard
            key={result.leadId}
            leadId={result.leadId}
            leadName={result.leadName}
            message={result.message}
            platform={platform}
            error={result.error}
            onEdit={onEdit}
            onApprove={onApprove}
            onRegenerate={onRegenerate}
            approved={approvedIds.has(result.leadId)}
          />
        ))}
      </div>
    </div>
  );
}
