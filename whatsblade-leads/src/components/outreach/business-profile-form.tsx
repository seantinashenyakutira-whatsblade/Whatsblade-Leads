'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Save } from 'lucide-react';
import type { BusinessProfile } from '@/types';

interface BusinessProfileFormProps {
  profile: BusinessProfile | null;
  onSave: (data: {
    businessName: string;
    services: string[];
    pricingInfo?: string;
    offerText?: string;
    location?: string;
    baseCurrency: string;
  }) => Promise<void>;
}

const CURRENCIES = [
  { code: 'ZMW', symbol: 'K', name: 'Zambian Kwacha' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling' },
  { code: 'GHS', symbol: 'GH₵', name: 'Ghanaian Cedi' },
];

export function BusinessProfileForm({ profile, onSave }: BusinessProfileFormProps) {
  const businessName = profile?.business_name || '';
  const services = profile?.services || [];
  const pricingInfo = profile?.pricing_info || '';
  const offerText = profile?.offer_text || '';
  const location = profile?.location || '';
  const baseCurrency = profile?.base_currency || 'ZMW';

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const servicesStr = formData.get('services') as string;
    const servicesList = servicesStr.split(',').map((s) => s.trim()).filter(Boolean);

    await onSave({
      businessName: formData.get('businessName') as string,
      services: servicesList,
      pricingInfo: (formData.get('pricingInfo') as string) || undefined,
      offerText: (formData.get('offerText') as string) || undefined,
      location: (formData.get('location') as string) || undefined,
      baseCurrency: formData.get('baseCurrency') as string,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-2">
        <Building2 className="h-5 w-5 text-muted-foreground" />
        <h3 className="text-lg font-semibold">My Business Profile</h3>
      </div>

      <p className="text-sm text-muted-foreground">
        This information is used by AI to generate personalized outreach messages. Keep it updated for best results.
      </p>

      <div className="space-y-4">
        <div>
          <Label htmlFor="businessName">Business Name *</Label>
          <Input
            id="businessName"
            name="businessName"
            defaultValue={businessName}
            placeholder="e.g. Whatsblade Digital"
            required
          />
        </div>

        <div>
          <Label htmlFor="services">Services (comma-separated) *</Label>
          <Input
            id="services"
            name="services"
            defaultValue={services.join(', ')}
            placeholder="e.g. Websites, Booking Systems, Landing Pages, ERP Systems, Mobile Apps"
            required
          />
          <p className="text-xs text-muted-foreground mt-1">Separate each service with a comma</p>
        </div>

        <div>
          <Label htmlFor="pricingInfo">Pricing Info</Label>
          <Input
            id="pricingInfo"
            name="pricingInfo"
            defaultValue={pricingInfo}
            placeholder="e.g. From ZMW 1,000 (or local currency)"
          />
        </div>

        <div>
          <Label htmlFor="offerText">Special Offer</Label>
          <Input
            id="offerText"
            name="offerText"
            defaultValue={offerText}
            placeholder="e.g. Free prototype/demo before any commitment"
          />
        </div>

        <div>
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            name="location"
            defaultValue={location}
            placeholder="e.g. Zambia"
          />
        </div>

        <div>
          <Label htmlFor="baseCurrency">Base Currency</Label>
          <select
            id="baseCurrency"
            name="baseCurrency"
            defaultValue={baseCurrency}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>{c.symbol} {c.name} ({c.code})</option>
            ))}
          </select>
        </div>
      </div>

      <Button type="submit">
        <Save className="mr-2 h-4 w-4" />
        Save Business Profile
      </Button>
    </form>
  );
}
