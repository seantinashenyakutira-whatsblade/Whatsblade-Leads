'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useCampaign, useStartCampaign, usePauseCampaign, useCompleteCampaign } from '@/hooks/use-campaigns';
import { trpc } from '@/lib/trpc/trpc-provider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, statusColor } from '@/lib/utils';
import { ArrowLeft, Play, Pause, CheckCircle, Plus } from 'lucide-react';
interface CampaignLeadRow {
  id: string;
  campaign_id: string;
  lead_id: string;
  added_at: string;
  leads: {
    first_name: string;
    last_name: string;
    email: string | null;
    status: string;
  } | null;
}
import { useState } from 'react';
import { useAddLeadsToCampaign } from '@/hooks/use-campaigns';

export default function CampaignDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: campaign, isLoading } = useCampaign(id);
  const startCampaign = useStartCampaign();
  const pauseCampaign = usePauseCampaign();
  const completeCampaign = useCompleteCampaign();
  const addLeads = useAddLeadsToCampaign();
  const [showAddLeads, setShowAddLeads] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);

  const { data: allLeads } = trpc.leads.list.useQuery(
    { page: 1, pageSize: 100 },
    { enabled: showAddLeads }
  );

  const handleAddLeads = async () => {
    if (selectedLeads.length === 0) return;
    await addLeads.mutateAsync({ campaignId: id, leadIds: selectedLeads });
    setSelectedLeads([]);
    setShowAddLeads(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!campaign) return <p>Campaign not found</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/campaigns">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{campaign.name}</h1>
              <Badge variant="outline" className={statusColor(campaign.status)}>{campaign.status}</Badge>
            </div>
            <p className="text-muted-foreground">Created {formatDate(campaign.created_at)}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {campaign.status === 'draft' && (
            <Button size="sm" onClick={() => startCampaign.mutate({ id })}>
              <Play className="mr-2 h-4 w-4" /> Start
            </Button>
          )}
          {campaign.status === 'active' && (
            <Button variant="outline" size="sm" onClick={() => pauseCampaign.mutate({ id })}>
              <Pause className="mr-2 h-4 w-4" /> Pause
            </Button>
          )}
          {campaign.status === 'paused' && (
            <Button size="sm" onClick={() => startCampaign.mutate({ id })}>
              <Play className="mr-2 h-4 w-4" /> Resume
            </Button>
          )}
          {(campaign.status === 'active' || campaign.status === 'paused') && (
            <Button variant="outline" size="sm" onClick={() => completeCampaign.mutate({ id })}>
              <CheckCircle className="mr-2 h-4 w-4" /> Complete
            </Button>
          )}
        </div>
      </div>

      {campaign.description && (
        <Card>
          <CardHeader><CardTitle>Description</CardTitle></CardHeader>
          <CardContent><p className="text-sm">{campaign.description}</p></CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Leads ({campaign.leads?.length ?? 0})</CardTitle>
          <Button variant="outline" size="sm" onClick={() => setShowAddLeads(!showAddLeads)}>
            <Plus className="mr-2 h-4 w-4" /> Add Leads
          </Button>
        </CardHeader>
        <CardContent>
          {showAddLeads && (
            <div className="mb-4 rounded-md border p-4">
              <p className="mb-2 text-sm font-medium">Select leads to add:</p>
              <div className="max-h-40 space-y-1 overflow-y-auto">
                {allLeads?.items.map((lead) => (
                  <label key={lead.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedLeads.includes(lead.id)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedLeads([...selectedLeads, lead.id]);
                        else setSelectedLeads(selectedLeads.filter((l) => l !== lead.id));
                      }}
                    />
                    {lead.first_name} {lead.last_name} ({lead.email || '—'})
                  </label>
                ))}
              </div>
              <Button size="sm" className="mt-2" onClick={handleAddLeads} disabled={selectedLeads.length === 0}>
                Add {selectedLeads.length} lead(s)
              </Button>
            </div>
          )}

          {!campaign.leads?.length ? (
            <p className="text-sm text-muted-foreground">No leads in this campaign</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Added</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaign.leads.map((cl: CampaignLeadRow) => {
                  const lead = cl.leads;
                  return (
                    <TableRow key={cl.id}>
                      <TableCell>
                        <Link href={`/dashboard/leads/${cl.lead_id}`} className="hover:underline font-medium">
                          {lead?.first_name ?? ''} {lead?.last_name ?? ''}
                        </Link>
                      </TableCell>
                      <TableCell>{lead?.email ?? ''}</TableCell>
                      <TableCell>
                        {lead && <Badge variant="outline" className={statusColor(lead.status)}>{lead.status}</Badge>}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(cl.added_at)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
