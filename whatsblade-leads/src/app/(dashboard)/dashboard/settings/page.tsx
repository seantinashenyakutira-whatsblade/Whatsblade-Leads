'use client';

import { useState } from 'react';
import { BusinessProfileForm } from '@/components/outreach/business-profile-form';
import { useBusinessProfile } from '@/hooks/use-outreach';
import { usePreferences, useUpdatePreferences, useUpdateTheme } from '@/hooks/use-settings';
import { COUNTRIES } from '@/lib/countries';
import { INDUSTRIES } from '@/lib/industries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils';
import { Building2, Settings2, Palette, X, Plus, Check, Moon, Sun, Monitor } from 'lucide-react';
import { toast } from 'sonner';

const CURRENCIES = [
  { code: 'ZMW', symbol: 'K', name: 'Zambian Kwacha' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling' },
  { code: 'GHS', symbol: 'GH₵', name: 'Ghanaian Cedi' },
  { code: 'BWP', symbol: 'P', name: 'Botswana Pula' },
  { code: 'MZN', symbol: 'MT', name: 'Mozambican Metical' },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your business profile, preferences, and appearance</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="inline-flex h-10 rounded-lg bg-muted p-1">
          <TabsTrigger value="profile" className={cn('px-4 py-2 text-sm font-medium rounded-md transition-all', activeTab === 'profile' ? 'bg-background shadow-sm' : 'text-muted-foreground')}>
            <Building2 className="mr-2 h-4 w-4" /> Business Profile
          </TabsTrigger>
          <TabsTrigger value="preferences" className={cn('px-4 py-2 text-sm font-medium rounded-md transition-all', activeTab === 'preferences' ? 'bg-background shadow-sm' : 'text-muted-foreground')}>
            <Settings2 className="mr-2 h-4 w-4" /> Preferences
          </TabsTrigger>
          <TabsTrigger value="appearance" className={cn('px-4 py-2 text-sm font-medium rounded-md transition-all', activeTab === 'appearance' ? 'bg-background shadow-sm' : 'text-muted-foreground')}>
            <Palette className="mr-2 h-4 w-4" /> Appearance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <BusinessProfileTab />
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6">
          <PreferencesTab />
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          <AppearanceTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function BusinessProfileTab() {
  const { profile, isLoading, update } = useBusinessProfile();

  const handleSave = async (data: {
    businessName: string;
    services: string[];
    pricingInfo?: string;
    offerText?: string;
    location?: string;
    baseCurrency: string;
  }) => {
    try {
      await update.mutateAsync(data);
      toast.success('Business profile saved successfully.');
    } catch {
      toast.error('Failed to save business profile.');
    }
  };

  if (isLoading) {
    return <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>;
  }

  return (
    <Card>
      <CardHeader><CardTitle>My Business Profile</CardTitle></CardHeader>
      <CardContent>
        <BusinessProfileForm profile={profile || null} onSave={handleSave} />
      </CardContent>
    </Card>
  );
}

function PreferencesTab() {
  const { data: preferences, isLoading } = usePreferences();
  const updatePreferences = useUpdatePreferences();

  const [defaultCountry, setDefaultCountry] = useState(preferences?.default_country || '');
  const [defaultCurrency, setDefaultCurrency] = useState(preferences?.default_currency || 'ZMW');
  const [favouriteIndustries, setFavouriteIndustries] = useState<string[]>(preferences?.favourite_industries || []);
  const [notificationEmail, setNotificationEmail] = useState(preferences?.notification_email ?? true);
  const [notificationInapp, setNotificationInapp] = useState(preferences?.notification_inapp ?? true);
  const [notificationSlack, setNotificationSlack] = useState(preferences?.notification_slack ?? false);
  const [notificationWebhook, setNotificationWebhook] = useState(preferences?.notification_webhook ?? false);
  const [showIndustryDropdown, setShowIndustryDropdown] = useState(false);
  const [industrySearch, setIndustrySearch] = useState('');

  const filteredIndustries = INDUSTRIES.filter((ind) =>
    ind.toLowerCase().includes(industrySearch.toLowerCase())
  ).filter((ind) => !favouriteIndustries.includes(ind));

  const handleSave = async () => {
    try {
      await updatePreferences.mutateAsync({
        defaultCountry: defaultCountry || null,
        defaultCurrency,
        favouriteIndustries,
        notificationEmail,
        notificationInapp,
        notificationSlack,
        notificationWebhook,
        theme: (preferences?.theme as 'dark' | 'light' | 'system') || 'system',
      });
      toast.success('Preferences saved successfully.');
    } catch {
      toast.error('Failed to save preferences.');
    }
  };

  const toggleIndustry = (industry: string) => {
    if (favouriteIndustries.includes(industry)) {
      setFavouriteIndustries(favouriteIndustries.filter((i) => i !== industry));
    } else {
      setFavouriteIndustries([...favouriteIndustries, industry]);
    }
  };

  if (isLoading) {
    return <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Default Location & Currency</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="defaultCountry">Default Country</Label>
              <select
                id="defaultCountry"
                value={defaultCountry}
                onChange={(e) => setDefaultCountry(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Select country...</option>
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="defaultCurrency">Default Currency</Label>
              <select
                id="defaultCurrency"
                value={defaultCurrency}
                onChange={(e) => setDefaultCurrency(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.symbol} {c.name} ({c.code})</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Favourite Industries</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {favouriteIndustries.map((industry) => (
              <Badge key={industry} variant="secondary" className="gap-1">
                {industry}
                <button onClick={() => toggleIndustry(industry)} className="ml-1 hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowIndustryDropdown(!showIndustryDropdown)}
              className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
            >
              <span className="text-muted-foreground">Add industry...</span>
              <Plus className="h-4 w-4" />
            </button>

            {showIndustryDropdown && (
              <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
                <div className="p-2">
                  <Input
                    placeholder="Search industries..."
                    value={industrySearch}
                    onChange={(e) => setIndustrySearch(e.target.value)}
                    className="mb-2"
                  />
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {filteredIndustries.slice(0, 20).map((industry) => (
                      <button
                        key={industry}
                        type="button"
                        onClick={() => { toggleIndustry(industry); setIndustrySearch(''); }}
                        className="flex w-full items-center justify-between rounded px-2 py-1.5 text-sm hover:bg-accent"
                      >
                        {industry}
                        <Plus className="h-3 w-3" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Notification Preferences</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {[
            { label: 'Email Notifications', desc: 'Receive notifications via email', checked: notificationEmail, onChange: setNotificationEmail },
            { label: 'In-App Notifications', desc: 'Show notifications in the app', checked: notificationInapp, onChange: setNotificationInapp },
            { label: 'Slack Notifications', desc: 'Send notifications to Slack', checked: notificationSlack, onChange: setNotificationSlack },
            { label: 'Webhook Notifications', desc: 'Send notifications to custom webhook', checked: notificationWebhook, onChange: setNotificationWebhook },
          ].map(({ label, desc, checked, onChange }) => (
            <div key={label} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={checked}
                onClick={() => onChange(!checked)}
                className={cn(
                  'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
                  checked ? 'bg-primary' : 'bg-muted'
                )}
              >
                <span className={cn(
                  'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform',
                  checked ? 'translate-x-5' : 'translate-x-0'
                )} />
              </button>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={updatePreferences.isPending}>
          <Check className="mr-2 h-4 w-4" /> Save Preferences
        </Button>
      </div>
    </div>
  );
}

function AppearanceTab() {
  const { data: preferences, isLoading } = usePreferences();
  const updateTheme = useUpdateTheme();
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>(
    (preferences?.theme as 'dark' | 'light' | 'system') || 'system'
  );

  const handleThemeChange = async (newTheme: 'dark' | 'light' | 'system') => {
    setTheme(newTheme);
    try {
      await updateTheme.mutateAsync({ theme: newTheme });
      toast.success(`Theme set to ${newTheme}`);
    } catch {
      toast.error('Failed to update theme.');
    }
  };

  const themes = [
    { value: 'light' as const, label: 'Light', icon: Sun, desc: 'Clean and bright interface' },
    { value: 'dark' as const, label: 'Dark', icon: Moon, desc: 'Easy on the eyes' },
    { value: 'system' as const, label: 'System', icon: Monitor, desc: 'Follows your OS preference' },
  ];

  if (isLoading) {
    return <Skeleton className="h-40 w-full" />;
  }

  return (
    <Card>
      <CardHeader><CardTitle>Theme</CardTitle></CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          {themes.map(({ value, label, icon: Icon, desc }) => (
            <button
              key={value}
              type="button"
              onClick={() => handleThemeChange(value)}
              className={cn(
                'flex flex-col items-center gap-3 rounded-lg border p-6 text-center transition-all',
                theme === value
                  ? 'border-primary bg-primary/5 ring-1 ring-primary'
                  : 'hover:bg-accent'
              )}
            >
              <div className={cn(
                'flex h-12 w-12 items-center justify-center rounded-full',
                theme === value ? 'bg-primary text-primary-foreground' : 'bg-muted'
              )}>
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
              {theme === value && (
                <Badge variant="success">Active</Badge>
              )}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
