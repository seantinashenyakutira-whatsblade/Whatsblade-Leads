'use client';

import { trpc } from '@/lib/trpc/trpc-provider';
import { formatDate } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export function ActivityFeed() {
  const { data: activities, isLoading } = trpc.activity.getRecent.useQuery({ limit: 10 });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (!activities?.length) {
    return <p className="text-sm text-muted-foreground">No recent activity</p>;
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-start gap-3 text-sm">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium capitalize">
            {activity.action.charAt(0)}
          </div>
          <div className="flex-1 space-y-1">
            <p className="text-sm">
              <span className="font-medium">{activity.action.replace('.', ' • ')}</span>
            </p>
            <p className="text-xs text-muted-foreground">{formatDate(activity.created_at)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
