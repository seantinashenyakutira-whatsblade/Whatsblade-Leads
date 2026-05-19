'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/trpc-provider';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function ActivityPage() {
  const [entityType, setEntityType] = useState('');
  const [action, setAction] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = trpc.activity.list.useQuery({
    entityType: entityType || undefined,
    action: action || undefined,
    page,
    pageSize: 50,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Activity Log</h1>
        <p className="text-muted-foreground">Full audit trail of all actions</p>
      </div>

      <div className="flex items-center gap-4">
        <Select value={entityType} onChange={(e) => { setEntityType(e.target.value); setPage(1); }}>
          <option value="">All entity types</option>
          <option value="lead">Lead</option>
          <option value="campaign">Campaign</option>
          <option value="message">Message</option>
          <option value="user">User</option>
          <option value="api_key">API Key</option>
          <option value="webhook">Webhook</option>
        </Select>
        <Select value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }}>
          <option value="">All actions</option>
          <option value="lead.created">Lead Created</option>
          <option value="lead.updated">Lead Updated</option>
          <option value="lead.deleted">Lead Deleted</option>
          <option value="lead.assigned">Lead Assigned</option>
          <option value="campaign.created">Campaign Created</option>
          <option value="campaign.started">Campaign Started</option>
          <option value="campaign.completed">Campaign Completed</option>
          <option value="message.sent">Message Sent</option>
          <option value="message.failed">Message Failed</option>
        </Select>
      </div>

      <Card>
        <CardHeader><CardTitle>Timeline</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !data?.items.length ? (
            <p className="text-sm text-muted-foreground">No activity found</p>
          ) : (
            <div className="space-y-4">
              {data.items.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                    {activity.action.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{activity.action.replace('.', ' › ')}</span>
                      {activity.entity_type && (
                        <span className="text-xs text-muted-foreground">
                          on {activity.entity_type}{activity.entity_id ? ` #${activity.entity_id.slice(0, 8)}` : ''}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{formatDate(activity.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {data.page} of {data.totalPages} ({data.total} total)
          </p>
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
