'use client';

import Link from 'next/link';
import { trpc } from '@/lib/trpc/trpc-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ActivityFeed } from '@/components/dashboard/activity-feed';
import { StatCard } from '@/components/dashboard/stat-card';
import { CampaignPerformanceCard } from '@/components/dashboard/campaign-performance-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Phone, Calendar, CheckCircle, DollarSign, TrendingUp, Building2, MapPin } from 'lucide-react';
import { statusColor } from '@/lib/utils';

export default function DashboardPage() {
  const { data: stats, isLoading } = trpc.settings.getStats.useQuery();

  const statCards = [
    { title: 'Total Leads', value: stats?.totalLeads ?? 0, icon: Users, color: 'text-blue-600' },
    { title: 'Contacted Today', value: stats?.contactedToday ?? 0, icon: Phone, color: 'text-green-600', subtitle: 'Leads contacted today' },
    { title: 'Meetings This Week', value: stats?.meetingsThisWeek ?? 0, icon: Calendar, color: 'text-purple-600', subtitle: 'Booked meetings' },
    { title: 'Closed Won', value: stats?.closedWonThisMonth ?? 0, icon: CheckCircle, color: 'text-emerald-600', subtitle: 'This month' },
    { title: 'Revenue Pipeline', value: stats?.revenuePipeline ? `$${stats.revenuePipeline.toLocaleString()}` : '$0', icon: DollarSign, color: 'text-orange-600', subtitle: 'Active deals' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your lead generation activity</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {statCards.map((stat) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            isLoading={isLoading}
            subtitle={stat.subtitle}
          />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Activity Feed */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityFeed />
          </CardContent>
        </Card>

        {/* Top Leads */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Top Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : !stats?.topLeads?.length ? (
              <p className="text-sm text-muted-foreground">No leads yet</p>
            ) : (
              <div className="space-y-2">
                {stats.topLeads.map((lead: { id: string; company: string | null; first_name: string | null; last_name: string | null; industry: string | null; lead_score: number; status: string }, i: number) => {
                  const name = lead.company || `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Unknown';
                  return (
                    <Link
                      key={lead.id}
                      href={`/dashboard/leads/${lead.id}`}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors block"
                    >
                      <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {lead.industry && (
                            <span className="flex items-center gap-0.5">
                              <Building2 className="h-3 w-3" />
                              {lead.industry}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{lead.lead_score}</Badge>
                        <Badge variant="outline" className={`text-[10px] ${statusColor(lead.status)}`}>
                          {lead.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Campaign Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Performance</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : !stats?.campaignPerformance?.length ? (
            <p className="text-sm text-muted-foreground">No campaigns yet</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {stats.campaignPerformance.map((c: { id: string; name: string; status: string }) => (
                <CampaignPerformanceCard key={c.id} campaign={c} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-4">
            <Link
              href="/dashboard/leads/new"
              className="flex items-center gap-3 rounded-lg border p-4 text-sm font-medium transition-colors hover:bg-accent"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                <Users className="h-4 w-4" />
              </div>
              Add New Lead
            </Link>
            <Link
              href="/dashboard/pipeline"
              className="flex items-center gap-3 rounded-lg border p-4 text-sm font-medium transition-colors hover:bg-accent"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                <TrendingUp className="h-4 w-4" />
              </div>
              View Pipeline
            </Link>
            <Link
              href="/dashboard/campaigns/new"
              className="flex items-center gap-3 rounded-lg border p-4 text-sm font-medium transition-colors hover:bg-accent"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 text-green-600">
                <Calendar className="h-4 w-4" />
              </div>
              Create Campaign
            </Link>
            <Link
              href="/dashboard/discover"
              className="flex items-center gap-3 rounded-lg border p-4 text-sm font-medium transition-colors hover:bg-accent"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
                <MapPin className="h-4 w-4" />
              </div>
              Discover Leads
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
