'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { Building2, Calendar, DollarSign, MapPin } from 'lucide-react';
import type { Lead } from '@/types';

const SCORE_COLORS: Record<string, string> = {
  hot: 'bg-red-100 text-red-700 border-red-200',
  warm: 'bg-orange-100 text-orange-700 border-orange-200',
  moderate: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  cold: 'bg-blue-100 text-blue-700 border-blue-200',
};

function getScoreColor(score: number): string {
  if (score >= 75) return SCORE_COLORS.hot;
  if (score >= 50) return SCORE_COLORS.warm;
  if (score >= 25) return SCORE_COLORS.moderate;
  return SCORE_COLORS.cold;
}

function formatRelativeDate(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  const date = new Date(dateStr);
  const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return '1d ago';
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

interface KanbanCardProps {
  lead: Lead;
  agentName?: string;
}

export function KanbanCard({ lead, agentName }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lead.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const businessName = lead.company || `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Unknown';
  const scoreColor = getScoreColor(lead.lead_score);

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card className="p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow border-l-4 border-l-transparent hover:border-l-primary">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm font-medium leading-tight line-clamp-2 flex-1">{businessName}</h4>
          <Badge variant="outline" className={`text-[10px] shrink-0 ${scoreColor}`}>
            {lead.lead_score}
          </Badge>
        </div>

        {lead.industry && (
          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
            <Building2 className="h-3 w-3" />
            <span className="truncate">{lead.industry}</span>
          </div>
        )}

        {(lead.city || lead.country) && (
          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span className="truncate">{[lead.city, lead.country].filter(Boolean).join(', ')}</span>
          </div>
        )}

        <div className="flex items-center justify-between mt-3 pt-2 border-t">
          <div className="flex items-center gap-2">
            <Avatar className="h-5 w-5">
              <AvatarFallback className="text-[9px]">{getInitials(agentName || 'U')}</AvatarFallback>
            </Avatar>
            <span className="text-[10px] text-muted-foreground truncate max-w-[80px]">
              {agentName || 'Unassigned'}
            </span>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            {lead.deal_value && lead.deal_value > 0 && (
              <span className="flex items-center gap-0.5">
                <DollarSign className="h-3 w-3" />
                {lead.deal_value.toLocaleString()}
              </span>
            )}
            <span className="flex items-center gap-0.5">
              <Calendar className="h-3 w-3" />
              {formatRelativeDate(lead.last_contacted_at)}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
