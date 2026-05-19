'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCampaigns } from '@/hooks/use-campaigns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, statusColor } from '@/lib/utils';
import { Plus, Play, Pause, CheckCircle } from 'lucide-react';
import { useStartCampaign, usePauseCampaign, useCompleteCampaign } from '@/hooks/use-campaigns';

export default function CampaignsPage() {
  const [page] = useState(1);
  const { data, isLoading } = useCampaigns({ page, pageSize: 20 });
  const startCampaign = useStartCampaign();
  const pauseCampaign = usePauseCampaign();
  const completeCampaign = useCompleteCampaign();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Campaigns</h1>
          <p className="text-muted-foreground">Manage outreach campaigns</p>
        </div>
        <Link href="/dashboard/campaigns/new">
          <Button><Plus className="mr-2 h-4 w-4" /> New Campaign</Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40" />)}
        </div>
      ) : !data?.items.length ? (
        <div className="rounded-lg border p-8 text-center">
          <p className="text-muted-foreground">No campaigns yet</p>
          <Link href="/dashboard/campaigns/new">
            <Button variant="outline" className="mt-4">Create your first campaign</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.items.map((campaign) => (
            <Card key={campaign.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">
                      <Link href={`/dashboard/campaigns/${campaign.id}`} className="hover:underline">
                        {campaign.name}
                      </Link>
                    </CardTitle>
                    <Badge variant="outline" className={`mt-1 ${statusColor(campaign.status)}`}>
                      {campaign.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {campaign.description && (
                  <p className="mb-3 text-sm text-muted-foreground line-clamp-2">{campaign.description}</p>
                )}
                <p className="text-xs text-muted-foreground">Created {formatDate(campaign.created_at)}</p>
                <div className="mt-3 flex gap-1">
                  {campaign.status === 'draft' && (
                    <Button variant="ghost" size="sm" onClick={() => startCampaign.mutate({ id: campaign.id })}>
                      <Play className="mr-1 h-3 w-3" /> Start
                    </Button>
                  )}
                  {campaign.status === 'active' && (
                    <Button variant="ghost" size="sm" onClick={() => pauseCampaign.mutate({ id: campaign.id })}>
                      <Pause className="mr-1 h-3 w-3" /> Pause
                    </Button>
                  )}
                  {campaign.status === 'paused' && (
                    <Button variant="ghost" size="sm" onClick={() => startCampaign.mutate({ id: campaign.id })}>
                      <Play className="mr-1 h-3 w-3" /> Resume
                    </Button>
                  )}
                  {(campaign.status === 'active' || campaign.status === 'paused') && (
                    <Button variant="ghost" size="sm" onClick={() => completeCampaign.mutate({ id: campaign.id })}>
                      <CheckCircle className="mr-1 h-3 w-3" /> Complete
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
