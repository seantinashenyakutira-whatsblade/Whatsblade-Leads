'use client';

import { Badge } from '@/components/ui/badge';
import { getScoreColor, getScoreLabel } from '@/lib/scoring';

interface LeadScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md';
}

export function LeadScoreBadge({ score, size = 'md' }: LeadScoreBadgeProps) {
  const colorClass = getScoreColor(score);
  const label = getScoreLabel(score);

  return (
    <Badge variant="outline" className={`${colorClass} ${size === 'sm' ? 'text-[10px] px-1.5 py-0' : 'text-xs px-2 py-0.5'} font-bold`}>
      {score} {label}
    </Badge>
  );
}
