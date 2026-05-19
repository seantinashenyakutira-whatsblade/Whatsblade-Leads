'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Send, Users, MessageSquare } from 'lucide-react';
import { statusColor } from '@/lib/utils';

interface CampaignPerformanceCardProps {
  campaign: {
    id: string;
    name: string;
    status: string;
  };
}

export function CampaignPerformanceCard({ campaign }: CampaignPerformanceCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium truncate flex-1">{campaign.name}</h4>
          <Badge variant="outline" className={`text-[10px] ml-2 ${statusColor(campaign.status)}`}>
            {campaign.status}
          </Badge>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            Leads
          </span>
          <span className="flex items-center gap-1">
            <Send className="h-3 w-3" />
            Messages
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare className="h-3 w-3" />
            Replies
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
