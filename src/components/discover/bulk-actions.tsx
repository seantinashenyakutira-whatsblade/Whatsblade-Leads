'use client';

import { Button } from '@/components/ui/button';
import { Save, Send, X, FileSpreadsheet } from 'lucide-react';

interface BulkActionsProps {
  selectedCount: number;
  onSave: () => void;
  onAddToCampaign: () => void;
  onExport: () => void;
  onClear: () => void;
}

export function BulkActions({ selectedCount, onSave, onAddToCampaign, onExport, onClear }: BulkActionsProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center justify-between rounded-lg border bg-accent/50 px-4 py-2">
      <span className="text-sm font-medium">{selectedCount} lead{selectedCount > 1 ? 's' : ''} selected</span>
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={onSave}>
          <Save className="mr-1.5 h-3.5 w-3.5" /> Save Selected
        </Button>
        <Button size="sm" variant="outline" onClick={onAddToCampaign}>
          <Send className="mr-1.5 h-3.5 w-3.5" /> Add to Campaign
        </Button>
        <Button size="sm" variant="outline" onClick={onExport}>
          <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5" /> Export
        </Button>
        <Button size="sm" variant="ghost" onClick={onClear}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
