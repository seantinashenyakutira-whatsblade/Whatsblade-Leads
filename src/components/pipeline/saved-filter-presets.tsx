'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { useSavedFilters, useSaveFilter, useDeleteFilter } from '@/hooks/use-saved-filters';
import { Bookmark, Trash2, Loader2 } from 'lucide-react';
import type { SavedFilter } from '@/types';

interface SavedFilterPresetsProps {
  currentFilters: Record<string, unknown>;
  onApply: (filter: SavedFilter) => void;
}

export function SavedFilterPresets({ currentFilters, onApply }: SavedFilterPresetsProps) {
  const { data: filters, isLoading } = useSavedFilters();
  const saveFilter = useSaveFilter();
  const deleteFilter = useDeleteFilter();
  const [saving, setSaving] = useState(false);
  const [presetName, setPresetName] = useState('');

  const handleSave = async () => {
    if (!presetName.trim()) return;
    setSaving(true);
    await saveFilter.mutateAsync({
      name: presetName.trim(),
      filterConfig: currentFilters,
    });
    setPresetName('');
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    await deleteFilter.mutateAsync({ id });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <Bookmark className="h-4 w-4 mr-1" />
          Saved Filters
          {filters && filters.length > 0 && (
            <Badge variant="secondary" className="ml-1 text-xs">{filters.length}</Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <div className="p-3 border-b">
          <p className="text-sm font-medium mb-2">Save current filter</p>
          <div className="flex gap-2">
            <Input
              placeholder="Preset name..."
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              className="h-8 text-sm"
            />
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving || !presetName.trim()}
              className="h-8"
            >
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Save'}
            </Button>
          </div>
        </div>
        <div className="max-h-64 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">Loading...</div>
          ) : !filters?.length ? (
            <div className="p-4 text-center text-sm text-muted-foreground">No saved filters</div>
          ) : (
            filters.map((f) => (
              <div
                key={f.id}
                className="flex items-center justify-between px-3 py-2 hover:bg-accent cursor-pointer group"
              >
                <button
                  onClick={() => onApply(f)}
                  className="flex-1 text-left text-sm font-medium truncate"
                >
                  {f.name}
                  {f.is_default && (
                    <Badge variant="secondary" className="ml-2 text-[10px]">Default</Badge>
                  )}
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100"
                  onClick={(e) => { e.stopPropagation(); handleDelete(f.id); }}
                >
                  <Trash2 className="h-3 w-3 text-muted-foreground" />
                </Button>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
