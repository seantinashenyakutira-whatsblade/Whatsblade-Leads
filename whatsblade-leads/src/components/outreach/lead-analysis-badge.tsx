'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, ChevronDown, ChevronUp, Target } from 'lucide-react';
import { useState } from 'react';
import type { LeadAnalysis } from '@/types';

interface LeadAnalysisBadgeProps {
  analysis: LeadAnalysis | null;
  onAnalyze: () => Promise<void>;
  isAnalyzing: boolean;
}

const TAG_COLORS: Record<string, string> = {
  'needs website': 'bg-red-100 text-red-700 border-red-200',
  'poor online presence': 'bg-orange-100 text-orange-700 border-orange-200',
  'high growth potential': 'bg-green-100 text-green-700 border-green-200',
  'active on social': 'bg-blue-100 text-blue-700 border-blue-200',
  'low rating': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'no contact info': 'bg-gray-100 text-gray-700 border-gray-200',
  'competitor nearby': 'bg-purple-100 text-purple-700 border-purple-200',
  'seasonal business': 'bg-indigo-100 text-indigo-700 border-indigo-200',
};

function getTagColor(tag: string): string {
  const lower = tag.toLowerCase();
  for (const [key, color] of Object.entries(TAG_COLORS)) {
    if (lower.includes(key)) return color;
  }
  return 'bg-muted text-muted-foreground border-border';
}

export function LeadAnalysisBadge({ analysis, onAnalyze, isAnalyzing }: LeadAnalysisBadgeProps) {
  const [expanded, setExpanded] = useState(false);

  if (!analysis && !isAnalyzing) {
    return (
      <Button onClick={onAnalyze} variant="outline" size="sm" className="text-xs">
        <Sparkles className="mr-1.5 h-3.5 w-3.5" />
        AI Analyze Lead
      </Button>
    );
  }

  if (isAnalyzing) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Sparkles className="h-4 w-4 animate-pulse" />
        Analyzing lead...
      </div>
    );
  }

  if (!analysis) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-purple-500" />
        <span className="text-sm font-medium">AI Analysis</span>
        <Button onClick={() => setExpanded(!expanded)} variant="ghost" size="sm" className="h-6 px-2 ml-auto">
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </Button>
      </div>

      {analysis.opportunity_tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {analysis.opportunity_tags.map((tag, i) => (
            <Badge key={i} variant="outline" className={`text-[10px] ${getTagColor(tag)}`}>
              <Target className="h-2.5 w-2.5 mr-1" />
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {expanded && analysis.summary && (
        <div className="rounded-lg border p-3 bg-muted/30">
          <p className="text-sm text-muted-foreground">{analysis.summary}</p>
          {analysis.recommended_platform && (
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <span>Recommended:</span>
              <Badge variant="secondary" className="text-[10px] capitalize">{analysis.recommended_platform}</Badge>
              {analysis.recommended_tone && (
                <Badge variant="outline" className="text-[10px] capitalize">{analysis.recommended_tone}</Badge>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
