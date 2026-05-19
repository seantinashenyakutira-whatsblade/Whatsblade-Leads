'use client';

import { useState } from 'react';
import { useIsAdmin } from '@/hooks/use-auth';
import { useAdminStats, useAgentPerformance, useApiUsage, useSystemHealth, useInviteUser, useDeactivateUser, useReactivateUser } from '@/hooks/use-admin';
import { trpc } from '@/lib/trpc/trpc-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@radix-ui/react-tabs';
import { toast } from 'sonner';
import {
  Users, TrendingUp, MessageSquare, DollarSign, UserPlus,
  Shield, AlertCircle, Activity, BarChart3, Search,
  ChevronLeft, ChevronRight, Power, RefreshCw,
  Database, Key, Webhook, Clock,
} from 'lucide-react';

export default function AdminPage() {
  const isAdmin = useIsAdmin();
  const [activeTab, setActiveTab] = useState('overview');

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Shield className="h-16 w-16 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground">Only administrators can access this panel.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <p className="text-muted-foreground">System management, analytics, and user administration</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="inline-flex h-10 rounded-lg bg-muted p-1 flex-wrap gap-1">
          {['overview', 'users', 'audit', 'api-usage', 'performance', 'health'].map((tab) => (
            <TabsTrigger key={tab} value={tab} className={cn('px-4 py-2 text-sm font-medium rounded-md transition-all capitalize', activeTab === tab ? 'bg-background shadow-sm' : 'text-muted-foreground')}>
              {tab === 'api-usage' ? 'API Usage' : tab === 'audit' ? 'Audit Log' : tab}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview"><OverviewTab /></TabsContent>
        <TabsContent value="users"><UsersTab /></TabsContent>
        <TabsContent value="audit"><AuditTab /></TabsContent>
        <TabsContent value="api-usage"><ApiUsageTab /></TabsContent>
        <TabsContent value="performance"><PerformanceTab /></TabsContent>
        <TabsContent value="health"><HealthTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function OverviewTab() {
  const { data: stats, isLoading } = useAdminStats();

  const statCards = [
    { label: 'Total Users', value: stats?.totalUsers, icon: Users, change: stats?.newUsersThisMonth, changeLabel: 'new this month' },
    { label: 'Active Users', value: stats?.activeUsers, icon: Activity },
    { label: 'Total Leads', value: stats?.totalLeads, icon: Search, change: stats?.leadsThisWeek, changeLabel: 'this week' },
    { label: 'Campaigns', value: stats?.totalCampaigns, icon: BarChart3 },
    { label: 'Messages Sent', value: stats?.totalMessages, icon: MessageSquare },
    { label: 'Pipeline Revenue', value: stats?.totalRevenue != null ? `$${stats.totalRevenue.toLocaleString()}` : '$0', icon: DollarSign },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map(({ label, value, icon: Icon, change, changeLabel }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div>
                  <p className="text-3xl font-bold">{value ?? 0}</p>
                  {change !== undefined && changeLabel && (
                    <p className="text-xs text-muted-foreground mt-1">
                      <TrendingUp className="inline h-3 w-3 mr-1" />
                      {change} {changeLabel}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function UsersTab() {
  const { data: usersList, isLoading: loadingList } = trpc.auth.listUsers.useQuery();
  const inviteUser = useInviteUser();
  const deactivateUser = useDeactivateUser();
  const reactivateUser = useReactivateUser();
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'agent'>('agent');

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await inviteUser.mutateAsync({ email: inviteEmail, fullName: inviteName, role: inviteRole });
      toast.success(`Invitation sent to ${inviteEmail}`);
      setInviteEmail('');
      setInviteName('');
      setShowInvite(false);
    } catch {
      toast.error('Failed to send invitation.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">User Management</h2>
          <p className="text-sm text-muted-foreground">Invite, manage, and deactivate team members</p>
        </div>
        <Button onClick={() => setShowInvite(!showInvite)}>
          <UserPlus className="mr-2 h-4 w-4" /> Invite User
        </Button>
      </div>

      {showInvite && (
        <Card>
          <CardHeader><CardTitle>Invite New User</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleInvite} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="inviteEmail">Email</Label>
                  <Input id="inviteEmail" type="email" required value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="agent@company.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inviteName">Full Name</Label>
                  <Input id="inviteName" required value={inviteName} onChange={(e) => setInviteName(e.target.value)} placeholder="John Doe" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inviteRole">Role</Label>
                  <select
                    id="inviteRole"
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as 'admin' | 'agent')}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  >
                    <option value="agent">Agent</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowInvite(false)}>Cancel</Button>
                <Button type="submit" disabled={inviteUser.isPending}>Send Invitation</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Team Members</CardTitle></CardHeader>
        <CardContent>
          {loadingList ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : !usersList?.length ? (
            <p className="text-sm text-muted-foreground">No users found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usersList.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.full_name || '—'}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell><Badge variant="outline" className="capitalize">{user.role}</Badge></TableCell>
                    <TableCell>
                      <Badge variant={user.is_active ? 'success' : 'secondary'}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(user.created_at)}</TableCell>
                    <TableCell>
                      {user.is_active ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { deactivateUser.mutate({ userId: user.id }); toast.success('User deactivated'); }}
                        >
                          <Power className="mr-1 h-3 w-3" /> Deactivate
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { reactivateUser.mutate({ userId: user.id }); toast.success('User reactivated'); }}
                        >
                          <RefreshCw className="mr-1 h-3 w-3" /> Reactivate
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AuditTab() {
  const [page, setPage] = useState(1);
  const [entityType, setEntityType] = useState('');
  const [action, setAction] = useState('');
  const { data, isLoading } = trpc.activity.list.useQuery({
    entityType: entityType || undefined,
    action: action || undefined,
    page,
    pageSize: 50,
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Audit Log</h2>
        <p className="text-sm text-muted-foreground">Full audit trail of all system actions</p>
      </div>

      <div className="flex items-center gap-4">
        <select
          value={entityType}
          onChange={(e) => { setEntityType(e.target.value); setPage(1); }}
          className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
        >
          <option value="">All entity types</option>
          <option value="lead">Lead</option>
          <option value="campaign">Campaign</option>
          <option value="message">Message</option>
          <option value="user">User</option>
          <option value="api_key">API Key</option>
          <option value="webhook">Webhook</option>
          <option value="integration">Integration</option>
          <option value="business_profile">Business Profile</option>
          <option value="user_preferences">Preferences</option>
        </select>
        <select
          value={action}
          onChange={(e) => { setAction(e.target.value); setPage(1); }}
          className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
        >
          <option value="">All actions</option>
          <option value="user.login">Login</option>
          <option value="user.invited">User Invited</option>
          <option value="user.role_changed">Role Changed</option>
          <option value="user.deactivated">User Deactivated</option>
          <option value="lead.created">Lead Created</option>
          <option value="lead.updated">Lead Updated</option>
          <option value="message.sent">Message Sent</option>
          <option value="api_key.created">API Key Created</option>
          <option value="integration.created">Integration Created</option>
          <option value="preferences.updated">Preferences Updated</option>
        </select>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-3">{Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : !data?.items.length ? (
            <p className="text-sm text-muted-foreground">No activity found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell className="font-medium">{activity.user_id?.slice(0, 8)}...</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">{activity.action.replace(/\./g, ' › ')}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {activity.entity_type}{activity.entity_id ? ` #${activity.entity_id.slice(0, 8)}` : ''}
                    </TableCell>
                    <TableCell className="text-xs font-mono">{activity.ip_address || '—'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(activity.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Page {data.page} of {data.totalPages} ({data.total} total)</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="h-4 w-4" /> Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => setPage(page + 1)}>
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ApiUsageTab() {
  const [days, setDays] = useState(30);
  const [provider, setProvider] = useState('');
  const { data: usage, isLoading } = useApiUsage(days, provider);

  const providers = usage ? Array.from(new Set(usage.map((u) => u.provider))) : [];
  const dates = usage ? Array.from(new Set(usage.map((u) => u.date))).sort().slice(-7) : [];
  const maxCalls = usage ? Math.max(...usage.map((u) => u.total_calls), 1) : 1;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">API Usage</h2>
        <p className="text-sm text-muted-foreground">Calls made per day per service</p>
      </div>

      <div className="flex items-center gap-4">
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
        <select
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
          className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
        >
          <option value="">All providers</option>
          {providers.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      <Card>
        <CardHeader><CardTitle>Daily API Calls</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : !usage?.length ? (
            <p className="text-sm text-muted-foreground">No API usage data</p>
          ) : (
            <div className="space-y-4">
              {dates.map((date) => {
                const dayUsage = usage.filter((u) => u.date === date);
                return (
                  <div key={date}>
                    <p className="text-xs text-muted-foreground mb-2">{date}</p>
                    <div className="space-y-1">
                      {dayUsage.map((u) => (
                        <div key={u.provider} className="flex items-center gap-3">
                          <span className="text-xs w-32 truncate capitalize">{u.provider}</span>
                          <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${Math.max((u.total_calls / maxCalls) * 100, 2)}%` }}
                            />
                          </div>
                          <span className="text-xs w-16 text-right">{u.total_calls}</span>
                          <span className={cn('text-xs w-16 text-right', u.failed_calls > 0 ? 'text-red-500' : 'text-green-500')}>
                            {u.successful_calls}/{u.failed_calls}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PerformanceTab() {
  const { data: agents, isLoading } = useAgentPerformance();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Agent Performance</h2>
        <p className="text-sm text-muted-foreground">Leads added, messages sent, meetings booked, deals closed per agent</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : !agents?.length ? (
            <p className="text-sm text-muted-foreground">No agent data available</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent</TableHead>
                  <TableHead>Leads Added</TableHead>
                  <TableHead>Messages Sent</TableHead>
                  <TableHead>Meetings Booked</TableHead>
                  <TableHead>Deals Closed</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agents.map((agent) => (
                  <TableRow key={agent.user_id}>
                    <TableCell className="font-medium">
                      <div>
                        <p>{agent.full_name || '—'}</p>
                        <p className="text-xs text-muted-foreground">{agent.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>{agent.leads_added}</TableCell>
                    <TableCell>{agent.messages_sent}</TableCell>
                    <TableCell>{agent.meetings_booked}</TableCell>
                    <TableCell>{agent.deals_closed}</TableCell>
                    <TableCell className="font-medium">${(agent.total_revenue || 0).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={agent.is_active ? 'success' : 'secondary'}>
                        {agent.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function HealthTab() {
  const { data: health, isLoading } = useSystemHealth();

  const healthIndicators = [
    {
      label: 'Database',
      icon: Database,
      status: health?.database.status,
      detail: `${health?.database.latency_ms}ms latency`,
      color: health?.database.status === 'healthy' ? 'text-green-500' : 'text-red-500',
    },
    {
      label: 'API Keys',
      icon: Key,
      status: (health?.api_keys.expired ?? 0) > 0 ? 'degraded' : 'healthy',
      detail: `${health?.api_keys.total} total, ${health?.api_keys.expiring_soon} expiring soon, ${health?.api_keys.expired} expired`,
      color: (health?.api_keys.expired ?? 0) > 0 ? 'text-red-500' : (health?.api_keys.expiring_soon ?? 0) > 0 ? 'text-amber-500' : 'text-green-500',
    },
    {
      label: 'Webhooks',
      icon: Webhook,
      status: (health?.webhooks.failing ?? 0) > 0 ? 'degraded' : 'healthy',
      detail: `${health?.webhooks.active}/${health?.webhooks.total} active`,
      color: (health?.webhooks.failing ?? 0) > 0 ? 'text-amber-500' : 'text-green-500',
    },
    {
      label: 'Queue',
      icon: Clock,
      status: 'healthy',
      detail: `${health?.queue_depth ?? 0} pending jobs`,
      color: 'text-green-500',
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">System Health</h2>
        <p className="text-sm text-muted-foreground">Real-time system status indicators</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {healthIndicators.map(({ label, icon: Icon, status, detail, color }) => (
          <Card key={label}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className={cn('flex h-12 w-12 items-center justify-center rounded-full bg-muted', color)}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{label}</p>
                    <Badge variant={status === 'healthy' ? 'success' : status === 'degraded' ? 'outline' : 'secondary'} className="capitalize">
                      {status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{detail}</p>
                </div>
                <div className={cn('h-3 w-3 rounded-full', color === 'text-green-500' ? 'bg-green-500' : color === 'text-amber-500' ? 'bg-amber-500' : 'bg-red-500')} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {health?.api_keys.expiring_soon && health.api_keys.expiring_soon > 0 && (
        <Card className="border-amber-300">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-sm font-medium text-amber-700">API Keys Expiring Soon</p>
                <p className="text-xs text-amber-600">{health.api_keys.expiring_soon} key(s) will expire within 7 days. Review and rotate them.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {health?.api_keys.expired && health.api_keys.expired > 0 && (
        <Card className="border-red-300">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm font-medium text-red-700">Expired API Keys</p>
                <p className="text-xs text-red-600">{health.api_keys.expired} key(s) have expired. Update them to restore functionality.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
