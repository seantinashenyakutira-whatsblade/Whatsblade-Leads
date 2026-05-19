'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Phone, Mail, MessageCircle, Instagram, Facebook, Globe,
  RefreshCw, Sparkles, Target, Clock, Star,
  CheckCircle2, XCircle, AlertTriangle, Image as ImageIcon,
} from 'lucide-react';

interface IntelligencePanelProps {
  data: {
    lastEnrichedAt: string | null;
    instagramUrl: string | null;
    instagramFollowers: number | null;
    instagramVerified: boolean | null;
    facebookFollowers: number | null;
    facebookLastPostDate: string | null;
    whatsappAvailable: boolean | null;
    websiteStatus: string | null;
    hasBookingSystem: boolean | null;
    isMobileResponsive: boolean | null;
    websiteQualityScore: number | null;
    socialPresenceScore: number;
    aiSummary: string | null;
    opportunityTags: string[];
    photos: unknown[];
    openingHours: Record<string, unknown>;
    googleRating: number | null;
    googleReviewCount: number | null;
  } | null;
  isLoading: boolean;
  isEnriching: boolean;
  onReEnrich: () => void;
}

const TAG_COLORS: Record<string, string> = {
  'no website': 'bg-red-100 text-red-700 border-red-200',
  'parked domain': 'bg-orange-100 text-orange-700 border-orange-200',
  'poor website': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'no booking system': 'bg-blue-100 text-blue-700 border-blue-200',
  'not mobile responsive': 'bg-purple-100 text-purple-700 border-purple-200',
  'low reviews': 'bg-amber-100 text-amber-700 border-amber-200',
  'no social presence': 'bg-gray-100 text-gray-700 border-gray-200',
  'no whatsapp': 'bg-green-100 text-green-700 border-green-200',
  'high opportunity': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'well-established online': 'bg-sky-100 text-sky-700 border-sky-200',
};

function getTagColor(tag: string): string {
  const lower = tag.toLowerCase();
  for (const [key, color] of Object.entries(TAG_COLORS)) {
    if (lower.includes(key)) return color;
  }
  return 'bg-muted text-muted-foreground border-border';
}

function formatNumber(n: number | null): string {
  if (n === null || n === undefined) return '0';
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  const date = new Date(dateStr);
  const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getWebsiteStatusBadge(status: string | null) {
  switch (status) {
    case 'live':
      return <Badge className="bg-green-100 text-green-700 border-green-200"><CheckCircle2 className="h-3 w-3 mr-1" /> Live</Badge>;
    case 'parked':
      return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200"><AlertTriangle className="h-3 w-3 mr-1" /> Parked</Badge>;
    case 'down':
      return <Badge className="bg-red-100 text-red-700 border-red-200"><XCircle className="h-3 w-3 mr-1" /> Down</Badge>;
    case 'none':
      return <Badge variant="outline">None</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
}

function ScoreBar({ score, label }: { score: number; label: string }) {
  const color = score >= 70 ? 'bg-green-500' : score >= 40 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{score}/100</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

export function IntelligencePanel({ data, isLoading, isEnriching, onReEnrich }: IntelligencePanelProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-8 w-24" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              Intelligence Panel
            </CardTitle>
            <Button onClick={onReEnrich} disabled={isEnriching} size="sm">
              <RefreshCw className={`mr-2 h-4 w-4 ${isEnriching ? 'animate-spin' : ''}`} />
              {isEnriching ? 'Enriching...' : 'Enrich'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Click &quot;Enrich&quot; to analyze this lead.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Intelligence Panel
          </CardTitle>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDate(data.lastEnrichedAt)}
            </span>
            <Button onClick={onReEnrich} disabled={isEnriching} size="sm" variant="outline">
              <RefreshCw className={`mr-2 h-3.5 w-3.5 ${isEnriching ? 'animate-spin' : ''}`} />
              {isEnriching ? 'Enriching...' : 'Re-enrich'}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Contact Channels */}
        <div>
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            Contact Channels
          </h4>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            <ChannelBadge icon={<Phone className="h-3.5 w-3.5" />} label="Phone" active={true} />
            <ChannelBadge icon={<Mail className="h-3.5 w-3.5" />} label="Email" active={true} />
            <ChannelBadge icon={<MessageCircle className="h-3.5 w-3.5" />} label="WhatsApp" active={!!data.whatsappAvailable} />
            <ChannelBadge icon={<Instagram className="h-3.5 w-3.5" />} label="Instagram" active={!!data.instagramUrl} />
            <ChannelBadge icon={<Facebook className="h-3.5 w-3.5" />} label="Facebook" active={!!data.facebookFollowers} />
            <ChannelBadge icon={<Globe className="h-3.5 w-3.5" />} label="Website" active={data.websiteStatus === 'live'} status={data.websiteStatus} />
          </div>
        </div>

        {/* Scores */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ScoreBar score={data.socialPresenceScore} label="Social Presence" />
          <ScoreBar score={data.websiteQualityScore || 0} label="Website Quality" />
        </div>

        {/* Social Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Facebook className="h-4 w-4 text-blue-600" />
            <span className="text-muted-foreground">Facebook:</span>
            <span className="font-medium">{data.facebookFollowers ? `${formatNumber(data.facebookFollowers)} followers` : 'Not found'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Instagram className="h-4 w-4 text-pink-600" />
            <span className="text-muted-foreground">Instagram:</span>
            {data.instagramUrl ? (
              <a href={data.instagramUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                {data.instagramVerified && <span className="text-blue-500 mr-1">✓</span>}
                Profile found
              </a>
            ) : (
              <span className="text-muted-foreground">Not found</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-green-600" />
            <span className="text-muted-foreground">WhatsApp:</span>
            <span className={data.whatsappAvailable ? 'text-green-600' : 'text-muted-foreground'}>
              {data.whatsappAvailable ? 'Available' : 'Not available'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-500" />
            <span className="text-muted-foreground">Google:</span>
            <span className="font-medium">
              {data.googleRating ? `${data.googleRating}/5` : 'N/A'}
              {data.googleReviewCount ? ` (${data.googleReviewCount} reviews)` : ''}
            </span>
          </div>
        </div>

        {/* Website Details */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            Website Analysis
          </h4>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Status:</span>
              {getWebsiteStatusBadge(data.websiteStatus)}
            </div>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Booking:</span>
              <Badge variant={data.hasBookingSystem ? 'default' : 'outline'} className="text-[10px]">
                {data.hasBookingSystem ? 'Yes' : 'No'}
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Mobile:</span>
              <Badge variant={data.isMobileResponsive ? 'default' : 'outline'} className="text-[10px]">
                {data.isMobileResponsive ? 'Responsive' : 'Not responsive'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Opportunity Tags */}
        {data.opportunityTags.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              Opportunity Tags
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {data.opportunityTags.map((tag, i) => (
                <Badge key={i} variant="outline" className={`text-[11px] ${getTagColor(tag)}`}>
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* AI Summary */}
        {data.aiSummary && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-500" />
              AI Summary
            </h4>
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground leading-relaxed">{data.aiSummary}</p>
            </div>
          </div>
        )}

        {/* Opening Hours */}
        {data.openingHours && Object.keys(data.openingHours).length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Opening Hours
            </h4>
            <div className="text-sm text-muted-foreground">
              {Array.isArray((data.openingHours as { weekdayDescriptions?: string[] }).weekdayDescriptions)
                ? (data.openingHours as { weekdayDescriptions: string[] }).weekdayDescriptions.join(' • ')
                : JSON.stringify(data.openingHours)}
            </div>
          </div>
        )}

        {/* Photos */}
        {data.photos && data.photos.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
              Google Photos ({data.photos.length})
            </h4>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {data.photos.slice(0, 6).map((photo: unknown, i: number) => (
                <div key={i} className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ChannelBadge({ icon, label, active, status }: { icon: React.ReactNode; label: string; active: boolean; status?: string | null }) {
  if (status === 'none') {
    return (
      <div className="flex flex-col items-center gap-1 p-2 rounded-lg border bg-muted/30">
        <div className="text-muted-foreground">{icon}</div>
        <span className="text-[10px] text-muted-foreground">{label}</span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center gap-1 p-2 rounded-lg border ${active ? 'bg-green-50 border-green-200' : 'bg-muted/30'}`}>
      <div className={active ? 'text-green-600' : 'text-muted-foreground'}>{icon}</div>
      <span className={`text-[10px] ${active ? 'text-green-700' : 'text-muted-foreground'}`}>{label}</span>
      {active && <CheckCircle2 className="h-3 w-3 text-green-500" />}
    </div>
  );
}
