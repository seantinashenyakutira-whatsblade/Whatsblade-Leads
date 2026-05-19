'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { INDUSTRIES } from '@/lib/industries';
import { COUNTRIES } from '@/lib/countries';
import { Search, Filter, MapPin } from 'lucide-react';

interface SearchFiltersProps {
  filters: {
    industry: string;
    country: string;
    city: string;
    radius: string;
    noWebsiteOnly: boolean;
    hasPhone: boolean;
    hasEmail: boolean;
    hasSocialMedia: boolean;
    minRating: number | undefined;
    maxResults: string;
    page?: number;
    sortBy?: string;
    sortOrder?: string;
  };
  onChange: (filters: SearchFiltersProps['filters']) => void;
  onSearch: () => void;
  isSearching: boolean;
}

export function SearchFilters({ filters, onChange, onSearch, isSearching }: SearchFiltersProps) {
  const [industryOpen, setIndustryOpen] = useState(false);
  const [countryOpen, setCountryOpen] = useState(false);
  const [industrySearch, setIndustrySearch] = useState('');
  const [countrySearch, setCountrySearch] = useState('');

  const filteredIndustries = INDUSTRIES.filter((i) =>
    i.toLowerCase().includes(industrySearch.toLowerCase())
  );

  const filteredCountries = COUNTRIES.filter((c) =>
    c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
    c.code.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const selectedCountry = COUNTRIES.find((c) => c.code === filters.country);
  const selectedIndustry = filters.industry;

  const update = (partial: Partial<SearchFiltersProps['filters']>) => {
    onChange({ ...filters, ...partial });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[200px]">
          <Label className="text-xs text-muted-foreground mb-1 block">Industry</Label>
          <Popover open={industryOpen} onOpenChange={setIndustryOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal h-9">
                {selectedIndustry || 'Select industry...'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-2" align="start">
              <Input
                placeholder="Search industries..."
                value={industrySearch}
                onChange={(e) => setIndustrySearch(e.target.value)}
                className="mb-2 h-8"
              />
              <div className="max-h-[250px] overflow-y-auto">
                {filteredIndustries.map((industry) => (
                  <button
                    key={industry}
                    className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-accent"
                    onClick={() => {
                      update({ industry });
                      setIndustryOpen(false);
                      setIndustrySearch('');
                    }}
                  >
                    {industry}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="w-[200px]">
          <Label className="text-xs text-muted-foreground mb-1 block">Country</Label>
          <Popover open={countryOpen} onOpenChange={setCountryOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal h-9">
                {selectedCountry ? `${selectedCountry.flag} ${selectedCountry.name}` : 'Select country...'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-2" align="start">
              <Input
                placeholder="Search countries..."
                value={countrySearch}
                onChange={(e) => setCountrySearch(e.target.value)}
                className="mb-2 h-8"
              />
              <div className="max-h-[250px] overflow-y-auto">
                {filteredCountries.map((country) => (
                  <button
                    key={country.code}
                    className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-accent flex items-center gap-2"
                    onClick={() => {
                      update({ country: country.code });
                      setCountryOpen(false);
                      setCountrySearch('');
                    }}
                  >
                    <span>{country.flag}</span>
                    <span>{country.name}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{country.code}</span>
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex-1 min-w-[150px]">
          <Label className="text-xs text-muted-foreground mb-1 block">City / Region</Label>
          <div className="relative">
            <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="e.g. New York, London"
              value={filters.city}
              onChange={(e) => update({ city: e.target.value })}
              className="pl-8 h-9"
            />
          </div>
        </div>

        <div className="w-[140px]">
          <Label className="text-xs text-muted-foreground mb-1 block">Radius</Label>
          <Select value={filters.radius} onChange={(e) => update({ radius: e.target.value })} className="h-9">
            <option value="5">5 km</option>
            <option value="10">10 km</option>
            <option value="25">25 km</option>
            <option value="50">50 km</option>
            <option value="100">100 km</option>
          </Select>
        </div>

        <Button onClick={onSearch} disabled={isSearching} className="h-9 px-6">
          <Search className="mr-2 h-4 w-4" />
          {isSearching ? 'Searching...' : 'Search'}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 border-t">
        <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
          <Filter className="h-3 w-3" /> Filters:
        </span>

        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <Checkbox
            checked={filters.noWebsiteOnly}
            onCheckedChange={(v) => update({ noWebsiteOnly: !!v })}
          />
          No website only
        </label>

        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <Checkbox
            checked={filters.hasPhone}
            onCheckedChange={(v) => update({ hasPhone: !!v })}
          />
          Has phone
        </label>

        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <Checkbox
            checked={filters.hasEmail}
            onCheckedChange={(v) => update({ hasEmail: !!v })}
          />
          Has email
        </label>

        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <Checkbox
            checked={filters.hasSocialMedia}
            onCheckedChange={(v) => update({ hasSocialMedia: !!v })}
          />
          Has social media
        </label>

        <div className="flex items-center gap-2">
          <span className="text-sm">Min rating:</span>
          <Select value={filters.minRating?.toString() || ''} onChange={(e) => update({ minRating: e.target.value ? parseFloat(e.target.value) : undefined })}>
            <option value="">Any</option>
            <option value="1">1+</option>
            <option value="2">2+</option>
            <option value="3">3+</option>
            <option value="4">4+</option>
          </Select>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <span className="text-sm">Max results:</span>
          <Select value={filters.maxResults} onChange={(e) => update({ maxResults: e.target.value })}>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </Select>
        </div>
      </div>
    </div>
  );
}
