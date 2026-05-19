'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/trpc-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Trash2, Send, Copy } from 'lucide-react';
import { formatDate } from '@/lib/utils';

const EVENT_OPTIONS = [
  'lead.created', 'lead.updated', 'lead.deleted', 'lead.assigned', 'lead.converted',
  'campaign.created', 'campaign.started', 'campaign.paused', 'campaign.completed',
  'message.sent', 'message.delivered', 'message.failed', 'message.opened', 'message.replied',
  'webhook.test',
];

export default function WebhooksPage() {
  const { data: webhooks, isLoading } = trpc.webhooks.list.useQuery();
  const createWebhook = trpc.webhooks.create.useMutation();
  const deleteWebhook = trpc.webhooks.delete.useMutation();
  const testWebhook = trpc.webhooks.test.useMutation();

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createWebhook.mutateAsync({ name, url, events: selectedEvents });
    setName('');
    setUrl('');
    setSelectedEvents([]);
    setShowForm(false);
  };

  const toggleEvent = (event: string) => {
    if (selectedEvents.includes(event)) {
      setSelectedEvents(selectedEvents.filter((e) => e !== event));
    } else {
      setSelectedEvents([...selectedEvents, event]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Webhooks</h1>
          <p className="text-muted-foreground">Configure outgoing webhook integrations</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" /> Add Webhook
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>New Webhook</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="webhookName">Name</Label>
                <Input id="webhookName" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Slack Notifications" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="webhookUrl">URL</Label>
                <Input id="webhookUrl" required type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://hooks.slack.com/..." />
              </div>
              <div className="space-y-2">
                <Label>Events</Label>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                  {EVENT_OPTIONS.map((event) => (
                    <label key={event} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={selectedEvents.includes(event)}
                        onChange={() => toggleEvent(event)}
                      />
                      {event}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit" disabled={createWebhook.isPending}>Save Webhook</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Configured Webhooks</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
            </div>
          ) : !webhooks?.length ? (
            <p className="text-sm text-muted-foreground">No webhooks configured</p>
          ) : (
            <div className="space-y-4">
              {webhooks.map((wh) => (
                <div key={wh.id} className="rounded-lg border p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium">{wh.name}</p>
                      <p className="text-xs text-muted-foreground">{wh.url}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {wh.events.map((evt: string) => (
                          <Badge key={evt} variant="outline" className="text-xs">{evt}</Badge>
                        ))}
                      </div>
                      {wh.last_triggered_at && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Last triggered: {formatDate(wh.last_triggered_at)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={wh.is_active ? 'success' : 'secondary'}>
                        {wh.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Button variant="ghost" size="sm" onClick={() => testWebhook.mutate({ id: wh.id })}>
                        <Send className="mr-1 h-3 w-3" /> Test
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteWebhook.mutate({ id: wh.id })}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
