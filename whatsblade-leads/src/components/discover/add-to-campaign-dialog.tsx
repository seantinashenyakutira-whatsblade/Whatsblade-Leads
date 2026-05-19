'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { trpc } from '@/lib/trpc/trpc-provider';
import type { DiscoveredLead } from '@/types';

interface AddToCampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedLeads: DiscoveredLead[];
  onSuccess: () => void;
}

export function AddToCampaignDialog({ open, onOpenChange, selectedLeads, onSuccess }: AddToCampaignDialogProps) {
  const { data: campaigns } = trpc.campaigns.list.useQuery({ page: 1, pageSize: 50 });
  const bulkSave = trpc.discover.bulkSave.useMutation();
  const [campaignId, setCampaignId] = useState('');
  const [error, setError] = useState('');

  const handleSave = async () => {
    setError('');
    try {
      await bulkSave.mutateAsync({
        leads: selectedLeads,
        campaignId: campaignId || null,
      });
      onOpenChange(false);
      setCampaignId('');
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add to Campaign</DialogTitle>
          <DialogDescription>
            Save {selectedLeads.length} lead{selectedLeads.length > 1 ? 's' : ''} and optionally add them to a campaign.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
          )}
          <div className="space-y-2">
            <label className="text-sm font-medium">Campaign (optional)</label>
            <Select value={campaignId} onChange={(e) => setCampaignId(e.target.value)}>
              <option value="">No campaign</option>
              {campaigns?.items.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={bulkSave.isPending}>
            {bulkSave.isPending ? 'Saving...' : `Save ${selectedLeads.length} lead${selectedLeads.length > 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
