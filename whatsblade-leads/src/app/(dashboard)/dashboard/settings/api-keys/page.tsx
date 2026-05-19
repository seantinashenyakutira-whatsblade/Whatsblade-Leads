'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Trash2, Eye, EyeOff, Copy, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { trpc } from '@/lib/trpc/trpc-provider';
import { toast } from 'sonner';

const PRESET_KEYS = [
  { label: 'Google Places API', provider: 'google_places', placeholder: 'AIzaSy...' },
  { label: 'Facebook Graph API', provider: 'facebook_graph', placeholder: 'EAAB...' },
  { label: 'Instagram Access Token', provider: 'instagram', placeholder: 'IGQW...' },
  { label: 'Anthropic (Claude) API', provider: 'anthropic', placeholder: 'sk-ant-...' },
];

export default function ApiKeysPage() {
  const { data: keys, isLoading } = trpc.apiKeys.list.useQuery();
  const createKey = trpc.apiKeys.create.useMutation();
  const deleteKey = trpc.apiKeys.delete.useMutation();
  const decryptKey = trpc.apiKeys.decrypt.useMutation();
  const testConnection = trpc.apiKeys.testConnection.useMutation();

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [provider, setProvider] = useState('');
  const [keyValue, setKeyValue] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [decryptedValues, setDecryptedValues] = useState<Record<string, string>>({});
  const [testingId, setTestingId] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createKey.mutateAsync({
        name,
        provider,
        keyValue,
        expiresAt: expiresAt || null,
      });
      setName('');
      setProvider('');
      setKeyValue('');
      setExpiresAt('');
      setShowForm(false);
      toast.success('API key saved successfully.');
    } catch {
      toast.error('Failed to save API key.');
    }
  };

  const toggleVisibility = async (id: string) => {
    if (visibleKeys.has(id)) {
      const next = new Set(visibleKeys);
      next.delete(id);
      setVisibleKeys(next);
    } else {
      try {
        const result = await decryptKey.mutateAsync({ id });
        setDecryptedValues({ ...decryptedValues, [id]: result.keyValue });
        const next = new Set(visibleKeys);
        next.add(id);
        setVisibleKeys(next);
      } catch {
        toast.error('Failed to decrypt key.');
      }
    }
  };

  const handleTest = async (id: string) => {
    setTestingId(id);
    try {
      const result = await testConnection.mutateAsync({ id });
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error('Test failed.');
    } finally {
      setTestingId(null);
    }
  };

  const now = new Date();
  const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">API Vault</h1>
          <p className="text-muted-foreground">Manage encrypted API keys for integrations</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" /> Add Key
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>New API Key</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <Label>Quick Select</Label>
                <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-4">
                  {PRESET_KEYS.map((preset) => (
                    <button
                      key={preset.provider}
                      type="button"
                      className={`rounded-lg border p-2 text-left text-sm transition-colors ${
                        provider === preset.provider
                          ? 'border-primary bg-primary/10'
                          : 'hover:bg-accent'
                      }`}
                      onClick={() => {
                        setProvider(preset.provider);
                        setName(preset.label);
                      }}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="keyName">Name</Label>
                  <Input id="keyName" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Google Places API" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="provider">Provider</Label>
                  <Input id="provider" required value={provider} onChange={(e) => setProvider(e.target.value)} placeholder="google_places" />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="keyValue">Key Value</Label>
                  <Input id="keyValue" required type="password" value={keyValue} onChange={(e) => setKeyValue(e.target.value)} placeholder={PRESET_KEYS.find(p => p.provider === provider)?.placeholder || 'Enter key value'} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiresAt">Expiry Date (optional)</Label>
                  <Input id="expiresAt" type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit" disabled={createKey.isPending}>Save Key</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Stored Keys</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : !keys?.length ? (
            <p className="text-sm text-muted-foreground">No API keys stored</p>
          ) : (
            <div className="space-y-3">
              {keys.map((key) => {
                const expiresAtDate = key.expires_at ? new Date(key.expires_at) : null;
                const isExpiringSoon = expiresAtDate && expiresAtDate <= sevenDays && expiresAtDate > now;
                const isExpired = expiresAtDate && expiresAtDate <= now;

                return (
                  <div key={key.id} className="rounded-lg border p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{key.name}</p>
                          <Badge variant={key.is_active ? 'success' : 'secondary'}>
                            {key.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                          {isExpiringSoon && (
                            <Badge variant="outline" className="text-amber-600 border-amber-300">
                              <Clock className="mr-1 h-3 w-3" /> Expiring soon
                            </Badge>
                          )}
                          {isExpired && (
                            <Badge variant="outline" className="text-red-600 border-red-300">
                              <AlertTriangle className="mr-1 h-3 w-3" /> Expired
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground capitalize">{key.provider}</p>
                        <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
                          {key.last_used_at && <span>Last used: {formatDate(key.last_used_at)}</span>}
                          {expiresAtDate && <span>Expires: {formatDate(expiresAtDate)}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleTest(key.id)} disabled={testingId === key.id || testConnection.isPending}>
                          {testingId === key.id ? (
                            <Clock className="mr-1 h-3 w-3 animate-spin" />
                          ) : (
                            <CheckCircle className="mr-1 h-3 w-3" />
                          )}
                          Test
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => toggleVisibility(key.id)}>
                          {visibleKeys.has(key.id) ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        {visibleKeys.has(key.id) && decryptedValues[key.id] && (
                          <Button variant="ghost" size="icon" onClick={() => { navigator.clipboard.writeText(decryptedValues[key.id]); toast.success('Copied to clipboard'); }}>
                            <Copy className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => { deleteKey.mutate({ id: key.id }); toast.success('API key deleted'); }}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    {visibleKeys.has(key.id) && decryptedValues[key.id] && (
                      <div className="mt-2 rounded bg-muted px-3 py-2 font-mono text-xs break-all">
                        {decryptedValues[key.id]}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
