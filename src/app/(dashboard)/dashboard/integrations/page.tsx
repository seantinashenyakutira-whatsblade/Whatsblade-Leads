'use client';

import { useState } from 'react';
import { useIntegrations, useCreateIntegration, useUpdateIntegration, useDeleteIntegration, useTestIntegration, useZapierEndpoint } from '@/hooks/use-integrations';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Zap, Sheet, MessageSquare, Calendar,
  Copy, ExternalLink, CheckCircle,
  Trash2, Link2, Globe, Loader2,
} from 'lucide-react';

const INTEGRATION_CARDS = [
  {
    type: 'zapier',
    title: 'Zapier',
    description: 'Send lead data to 5,000+ apps via Zapier webhooks',
    icon: Zap,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
  },
  {
    type: 'google_sheets',
    title: 'Google Sheets',
    description: 'Automatically export leads to a Google Spreadsheet',
    icon: Sheet,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
  {
    type: 'slack',
    title: 'Slack',
    description: 'Get notified in Slack when new leads are added',
    icon: MessageSquare,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
  {
    type: 'google_calendar',
    title: 'Google Calendar',
    description: 'Book meetings directly to your Google Calendar',
    icon: Calendar,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
];

export default function IntegrationsPage() {
  const { data: integrations } = useIntegrations();
  const createIntegration = useCreateIntegration();
  const updateIntegration = useUpdateIntegration();
  const deleteIntegration = useDeleteIntegration();
  const testIntegration = useTestIntegration();
  const { data: zapierEndpoint } = useZapierEndpoint();

  const [testingType, setTestingType] = useState<string | null>(null);

  const getIntegration = (type: string) => integrations?.find((i) => i.type === type);

  const handleTest = async (type: string) => {
    setTestingType(type);
    const integration = getIntegration(type);
    if (!integration?.config || Object.keys(integration.config).length === 0) {
      toast.error('Configure this integration first.');
      setTestingType(null);
      return;
    }
    try {
      const result = await testIntegration.mutateAsync({ type, config: integration.config as Record<string, unknown> });
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error('Test failed.');
    } finally {
      setTestingType(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteIntegration.mutateAsync({ id });
      toast.success('Integration removed.');
    } catch {
      toast.error('Failed to remove integration.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Integrations</h1>
        <p className="text-muted-foreground">Connect Whatsblade to your favourite tools</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {INTEGRATION_CARDS.map(({ type, title, description, icon: Icon, color, bgColor }) => {
          const integration = getIntegration(type);
          const isActive = integration?.is_active;

          return (
            <Card key={type} className={cn('transition-all', isActive && 'border-primary/50')}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', bgColor)}>
                      <Icon className={cn('h-5 w-5', color)} />
                    </div>
                    <div>
                      <CardTitle className="text-base">{title}</CardTitle>
                      <CardDescription>{description}</CardDescription>
                    </div>
                  </div>
                  {isActive ? (
                    <Badge variant="success"><CheckCircle className="mr-1 h-3 w-3" /> Connected</Badge>
                  ) : (
                    <Badge variant="secondary">Not connected</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {type === 'zapier' && (
                  <ZapierConfig
                    integration={integration}
                    zapierEndpoint={zapierEndpoint}
                    onTest={() => handleTest(type)}
                    isTesting={testingType === type}
                    onSave={(config) => {
                      if (integration) {
                        updateIntegration.mutate({ id: integration.id, config, isActive: true });
                        toast.success('Zapier webhook updated.');
                      } else {
                        createIntegration.mutate({ type, name: 'Zapier Webhook', config }, {
                          onSuccess: () => toast.success('Zapier webhook configured.'),
                        });
                      }
                    }}
                    onDelete={() => integration && handleDelete(integration.id)}
                  />
                )}

                {type === 'slack' && (
                  <SlackConfig
                    integration={integration}
                    onTest={() => handleTest(type)}
                    isTesting={testingType === type}
                    onSave={(config) => {
                      if (integration) {
                        updateIntegration.mutate({ id: integration.id, config, isActive: true });
                        toast.success('Slack webhook updated.');
                      } else {
                        createIntegration.mutate({ type, name: 'Slack Notifications', config }, {
                          onSuccess: () => toast.success('Slack configured.'),
                        });
                      }
                    }}
                    onDelete={() => integration && handleDelete(integration.id)}
                  />
                )}

                {type === 'google_sheets' && (
                  <GoogleSheetsConfig
                    integration={integration}
                    onSave={(config) => {
                      if (integration) {
                        updateIntegration.mutate({ id: integration.id, config });
                        toast.success('Google Sheets config updated.');
                      } else {
                        createIntegration.mutate({ type, name: 'Google Sheets Export', config }, {
                          onSuccess: () => toast.success('Google Sheets configured.'),
                        });
                      }
                    }}
                    onDelete={() => integration && handleDelete(integration.id)}
                  />
                )}

                {type === 'google_calendar' && (
                  <GoogleCalendarConfig
                    integration={integration}
                    onSave={(config) => {
                      if (integration) {
                        updateIntegration.mutate({ id: integration.id, config });
                        toast.success('Google Calendar config updated.');
                      } else {
                        createIntegration.mutate({ type, name: 'Google Calendar', config }, {
                          onSuccess: () => toast.success('Google Calendar configured.'),
                        });
                      }
                    }}
                    onDelete={() => integration && handleDelete(integration.id)}
                  />
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function ZapierConfig({ integration, zapierEndpoint, onTest, isTesting, onSave, onDelete }: {
  integration: { id: string; config: Record<string, unknown>; is_active: boolean } | undefined;
  zapierEndpoint: string | undefined;
  onTest: () => void;
  isTesting: boolean;
  onSave: (config: Record<string, unknown>) => void;
  onDelete: () => void;
}) {
  const [webhookUrl, setWebhookUrl] = useState((integration?.config?.webhookUrl as string) || '');
  const [saved] = useState(!!integration);

  return (
    <div className="space-y-4">
      {zapierEndpoint && (
        <div>
          <Label>Your Zapier Webhook Endpoint</Label>
          <div className="mt-1 flex items-center gap-2">
            <code className="flex-1 rounded bg-muted px-3 py-2 text-xs break-all">{zapierEndpoint}</code>
            <Button variant="ghost" size="icon" onClick={() => { navigator.clipboard.writeText(zapierEndpoint); toast.success('Copied'); }}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Use this URL in your Zapier webhook trigger</p>
        </div>
      )}

      <div className="border-t my-4" />

      <div>
        <Label htmlFor="zapierWebhookUrl">Zapier Webhook URL (from your Zap)</Label>
        <Input
          id="zapierWebhookUrl"
          value={webhookUrl}
          onChange={(e) => setWebhookUrl(e.target.value)}
          placeholder="https://hooks.zapier.com/hooks/catch/..."
        />
      </div>

      <div className="flex items-center gap-2">
        <Button size="sm" onClick={() => onSave({ webhookUrl })} disabled={!webhookUrl}>
          <Link2 className="mr-1 h-3 w-3" /> {saved ? 'Update' : 'Connect'}
        </Button>
        {saved && (
          <>
            <Button size="sm" variant="outline" onClick={onTest} disabled={isTesting}>
              {isTesting ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <CheckCircle className="mr-1 h-3 w-3" />}
              Test
            </Button>
            <Button size="sm" variant="ghost" onClick={onDelete}>
              <Trash2 className="mr-1 h-3 w-3 text-destructive" /> Remove
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

function SlackConfig({ integration, onTest, isTesting, onSave, onDelete }: {
  integration: { id: string; config: Record<string, unknown>; is_active: boolean } | undefined;
  onTest: () => void;
  isTesting: boolean;
  onSave: (config: Record<string, unknown>) => void;
  onDelete: () => void;
}) {
  const [webhookUrl, setWebhookUrl] = useState((integration?.config?.webhookUrl as string) || '');
  const [saved] = useState(!!integration);

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="slackWebhookUrl">Slack Incoming Webhook URL</Label>
        <Input
          id="slackWebhookUrl"
          value={webhookUrl}
          onChange={(e) => setWebhookUrl(e.target.value)}
          placeholder="https://hooks.slack.com/services/T00/B00/XXX"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Create one at: <a href="https://my.slack.com/services/new/incoming-webhook" target="_blank" rel="noopener noreferrer" className="text-primary underline">Slack Webhook Setup</a>
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Button size="sm" onClick={() => onSave({ webhookUrl })} disabled={!webhookUrl}>
          <Link2 className="mr-1 h-3 w-3" /> {saved ? 'Update' : 'Connect'}
        </Button>
        {saved && (
          <>
            <Button size="sm" variant="outline" onClick={onTest} disabled={isTesting}>
              {isTesting ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <CheckCircle className="mr-1 h-3 w-3" />}
              Test
            </Button>
            <Button size="sm" variant="ghost" onClick={onDelete}>
              <Trash2 className="mr-1 h-3 w-3 text-destructive" /> Remove
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

function GoogleSheetsConfig({ integration, onSave, onDelete }: {
  integration: { id: string; config: Record<string, unknown>; is_active: boolean } | undefined;
  onSave: (config: Record<string, unknown>) => void;
  onDelete: () => void;
}) {
  const [saved] = useState(!!integration);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-dashed p-4 text-center">
        <Globe className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm font-medium">Google OAuth Required</p>
        <p className="text-xs text-muted-foreground mt-1">
          Connect your Google account to enable lead export to Google Sheets.
        </p>
      </div>

      <div>
        <Label htmlFor="sheetsSpreadsheetId">Spreadsheet ID (optional)</Label>
        <Input
          id="sheetsSpreadsheetId"
          value={(integration?.config?.spreadsheetId as string) || ''}
          onChange={(e) => onSave({ spreadsheetId: e.target.value })}
          placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
        />
        <p className="text-xs text-muted-foreground mt-1">
          The ID from your Google Sheets URL: <code>docs.google.com/spreadsheets/d/</code><strong>SPREADSHEET_ID</strong>
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" disabled>
          <ExternalLink className="mr-1 h-3 w-3" /> Connect Google Account
        </Button>
        {saved && (
          <Button size="sm" variant="ghost" onClick={onDelete}>
            <Trash2 className="mr-1 h-3 w-3 text-destructive" /> Remove
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        OAuth flow: <code>{baseUrl}/api/integrations/google-sheets/oauth</code>
      </p>
    </div>
  );
}

function GoogleCalendarConfig({ integration, onSave, onDelete }: {
  integration: { id: string; config: Record<string, unknown>; is_active: boolean } | undefined;
  onSave: (config: Record<string, unknown>) => void;
  onDelete: () => void;
}) {
  const [saved] = useState(!!integration);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-dashed p-4 text-center">
        <Calendar className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm font-medium">Google OAuth Required</p>
        <p className="text-xs text-muted-foreground mt-1">
          Connect your Google account to enable meeting booking via Google Calendar.
        </p>
      </div>

      <div>
        <Label htmlFor="calendarId">Calendar ID (optional)</Label>
        <Input
          id="calendarId"
          value={(integration?.config?.calendarId as string) || ''}
          onChange={(e) => onSave({ calendarId: e.target.value })}
          placeholder="primary or calendar-id@group.calendar.google.com"
        />
        <p className="text-xs text-muted-foreground mt-1">Use &quot;primary&quot; for your main calendar</p>
      </div>

      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" disabled>
          <ExternalLink className="mr-1 h-3 w-3" /> Connect Google Account
        </Button>
        {saved && (
          <Button size="sm" variant="ghost" onClick={onDelete}>
            <Trash2 className="mr-1 h-3 w-3 text-destructive" /> Remove
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        OAuth flow: <code>{baseUrl}/api/integrations/google-calendar/oauth</code>
      </p>
    </div>
  );
}
