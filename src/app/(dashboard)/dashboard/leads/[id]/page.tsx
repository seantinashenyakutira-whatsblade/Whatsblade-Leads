'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLead, useDeleteLead, useUpdateDealValue, useUpdateNextAction } from '@/hooks/use-leads';
import { useEnrichment, useLeadIntelligence } from '@/hooks/use-enrichment';
import { trpc } from '@/lib/trpc/trpc-provider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, statusColor } from '@/lib/utils';
import { ArrowLeft, Edit, Trash2, Mail, MessageSquare, Building2, MapPin, Star, TrendingUp, Calendar, Clock, Phone, Globe, AtSign } from 'lucide-react';
import { IntelligencePanel } from '@/components/leads/intelligence-panel';
import { NotesEditor } from '@/components/leads/notes-editor';
import { TagInput } from '@/components/leads/tag-input';
import { ReminderPicker } from '@/components/leads/reminder-picker';

const TABS = ['overview', 'intelligence', 'outreach', 'notes', 'activity'] as const;
type Tab = typeof TABS[number];

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: lead, isLoading, refetch } = useLead(id);
  const { data: messages } = trpc.messages.getByLead.useQuery({ leadId: id }, { enabled: !!id });
  const { data: activities } = trpc.activity.getByEntity.useQuery({ entityType: 'lead', entityId: id }, { enabled: !!id });
  const { data: reminders } = trpc.reminders.list.useQuery({ leadId: id }, { enabled: !!id });
  const { data: intelligence, isLoading: intelligenceLoading } = useLeadIntelligence(id);
  const { run: runEnrichment } = useEnrichment(id);
  const deleteLead = useDeleteLead();
  const updateDealValue = useUpdateDealValue();
  const updateNextAction = useUpdateNextAction();
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [editingDeal, setEditingDeal] = useState(false);
  const [dealValue, setDealValue] = useState('');
  const [editingAction, setEditingAction] = useState(false);
  const [nextAction, setNextAction] = useState('');
  const [nextActionDate, setNextActionDate] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this lead?')) return;
    setDeleting(true);
    await deleteLead.mutateAsync({ id });
    router.push('/dashboard/leads');
  };

  const handleReEnrich = async () => {
    await runEnrichment.mutateAsync({ leadId: id });
    refetch();
  };

  const handleSaveDeal = async () => {
    const val = parseFloat(dealValue);
    if (!isNaN(val)) {
      await updateDealValue.mutateAsync({ id, dealValue: val });
    }
    setEditingDeal(false);
  };

  const handleSaveAction = async () => {
    await updateNextAction.mutateAsync({
      id,
      action: nextAction || null,
      date: nextActionDate ? new Date(nextActionDate).toISOString() : null,
    });
    setEditingAction(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!lead) {
    return <p>Lead not found</p>;
  }

  const businessName = lead.company || `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Unknown';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/leads">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold">{businessName}</h1>
              <Badge variant="outline" className={statusColor(lead.status)}>{lead.status.replace('_', ' ')}</Badge>
              {lead.lead_score !== null && lead.lead_score > 0 && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Score: {lead.lead_score}
                </Badge>
              )}
              {lead.industry && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {lead.industry}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1 flex-wrap">
              <span>Created {formatDate(lead.created_at)}</span>
              {lead.city && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {lead.city}{lead.country ? `, ${lead.country}` : ''}
                </span>
              )}
              {lead.google_rating && (
                <span className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  {lead.google_rating}{lead.google_review_count ? ` (${lead.google_review_count})` : ''}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <ReminderPicker leadId={id} />
          <Link href={`/dashboard/leads/${id}/edit`}>
            <Button variant="outline" size="sm"><Edit className="mr-2 h-4 w-4" /> Edit</Button>
          </Link>
          <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting}>
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize ${
              activeTab === tab
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Contact Information</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" /> Email</span>
                <span>{lead.email || '—'}</span>
                <span className="text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" /> Phone</span>
                <span>{lead.phone || '—'}</span>
                <span className="text-muted-foreground flex items-center gap-1"><Building2 className="h-3 w-3" /> Company</span>
                <span>{lead.company || '—'}</span>
                <span className="text-muted-foreground">Position</span>
                <span>{lead.position || '—'}</span>
                <span className="text-muted-foreground flex items-center gap-1"><Globe className="h-3 w-3" /> Website</span>
                <span>{lead.website ? <a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{lead.website}</a> : '—'}</span>
                <span className="text-muted-foreground flex items-center gap-1"><AtSign className="h-3 w-3" /> Source</span>
                <span>{lead.source || lead.source_platform || '—'}</span>
                {lead.address && (
                  <>
                    <span className="text-muted-foreground">Address</span>
                    <span>{lead.address}</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Deal Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Deal Value</label>
                {editingDeal ? (
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={dealValue}
                      onChange={(e) => setDealValue(e.target.value)}
                      placeholder="0"
                      className="h-8"
                    />
                    <Button size="sm" onClick={handleSaveDeal}>Save</Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingDeal(false)}>Cancel</Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold">${(lead.deal_value || 0).toLocaleString()}</span>
                    <Button variant="ghost" size="sm" onClick={() => { setDealValue(String(lead.deal_value || 0)); setEditingDeal(true); }}>
                      <Edit className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Expected Close Date</label>
                <p className="text-sm">{lead.expected_close_date ? new Date(lead.expected_close_date).toLocaleDateString() : 'Not set'}</p>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Last Contacted</label>
                <p className="text-sm flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {lead.last_contacted_at ? formatDate(lead.last_contacted_at) : 'Never'}
                </p>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Next Action</label>
                {editingAction ? (
                  <div className="space-y-2">
                    <Input
                      value={nextAction}
                      onChange={(e) => setNextAction(e.target.value)}
                      placeholder="What's the next step?"
                      className="h-8"
                    />
                    <Input
                      type="datetime-local"
                      value={nextActionDate}
                      onChange={(e) => setNextActionDate(e.target.value)}
                      className="h-8"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSaveAction}>Save</Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingAction(false)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm">{lead.next_action || 'No action set'}</p>
                      {lead.next_action_date && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Due: {new Date(lead.next_action_date).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setNextAction(lead.next_action || '');
                        setNextActionDate(lead.next_action_date ? new Date(lead.next_action_date).toISOString().slice(0, 16) : '');
                        setEditingAction(true);
                      }}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>

              {reminders && reminders.length > 0 && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Reminders</label>
                  <div className="space-y-1">
                    {reminders.filter((r) => r.status === 'pending').slice(0, 3).map((r) => (
                      <div key={r.id} className="flex items-center gap-2 text-sm">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span>{r.action}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(r.remind_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Tags</CardTitle></CardHeader>
            <CardContent>
              <TagInput
                tags={tags}
                onChange={setTags}
                suggestions={['Hot', 'Follow up', 'VIP', 'New', 'Urgent', 'Referral']}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Lead Source</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Platform</span>
                  <Badge variant="outline">{lead.source_platform || 'Manual'}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Source</span>
                  <span>{lead.source || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span>{formatDate(lead.created_at)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Intelligence Tab */}
      {activeTab === 'intelligence' && (
        <IntelligencePanel
          data={intelligence || null}
          isLoading={intelligenceLoading}
          isEnriching={runEnrichment.isPending}
          onReEnrich={handleReEnrich}
        />
      )}

      {/* Outreach Tab */}
      {activeTab === 'outreach' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Messages ({messages?.length ?? 0})</CardTitle>
            <Button variant="outline" size="sm">
              <Mail className="mr-2 h-4 w-4" /> Send Message
            </Button>
          </CardHeader>
          <CardContent>
            {!messages?.length ? (
              <p className="text-sm text-muted-foreground">No messages yet</p>
            ) : (
              <div className="space-y-3">
                {messages.map((msg) => (
                  <div key={msg.id} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium capitalize">{msg.channel}</span>
                        <Badge variant="outline" className="text-xs">{msg.status}</Badge>
                        {msg.ai_generated && <Badge variant="secondary" className="text-xs">AI</Badge>}
                      </div>
                      <span className="text-xs text-muted-foreground">{formatDate(msg.created_at)}</span>
                    </div>
                    {msg.subject && <p className="mt-1 text-sm font-medium">{msg.subject}</p>}
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{msg.body}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Notes Tab */}
      {activeTab === 'notes' && (
        <Card>
          <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
          <CardContent>
            <NotesEditor leadId={id} />
          </CardContent>
        </Card>
      )}

      {/* Activity Tab */}
      {activeTab === 'activity' && (
        <Card>
          <CardHeader><CardTitle>Activity Timeline</CardTitle></CardHeader>
          <CardContent>
            {!activities?.length ? (
              <p className="text-sm text-muted-foreground">No activity recorded</p>
            ) : (
              <div className="space-y-3">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 text-sm">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-medium">
                      {activity.action.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">{activity.action.replace('.', ' • ')}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(activity.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
