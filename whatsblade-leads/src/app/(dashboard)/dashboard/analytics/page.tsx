'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { trpc } from '@/lib/trpc/trpc-provider';
import { Skeleton } from '@/components/ui/skeleton';

export default function AnalyticsPage() {
  const { data: stats, isLoading } = trpc.settings.getStats.useQuery();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">Performance metrics and insights</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Leads', value: stats?.totalLeads },
          { label: 'Campaigns', value: stats?.totalCampaigns },
          { label: 'Messages Sent', value: stats?.totalMessages },
          { label: 'Conversion Rate', value: '—' },
        ].map((metric) => (
          <Card key={metric.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{metric.label}</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-3xl font-bold">{metric.value ?? 0}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Lead Status Distribution</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              View lead status breakdown in the Leads page. Detailed analytics dashboard with charts will be available with PostHog integration.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Campaign Performance</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Track campaign completion rates and message delivery metrics. Connect PostHog for advanced analytics and funnels.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
