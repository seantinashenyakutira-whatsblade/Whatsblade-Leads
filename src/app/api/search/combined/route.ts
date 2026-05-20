import { NextRequest, NextResponse } from 'next/server';
import { googleTextSearch, googlePlaceDetails, extractIndustryFromTypes, geocodeWithFallback } from '@/lib/google-places';
import { facebookPageSearch, mapFacebookToDiscovered } from '@/lib/facebook-graph';
import { calculateLeadScore } from '@/lib/scoring';
import { getCachedPlaces, cachePlaces } from '@/lib/redis/client';
import { parseAddress, formatOpeningHours, resolvePhotoUrl } from '@/lib/address-utils';
import { env } from '@/lib/env';

const combinedCache = new Map<string, { data: unknown; expiresAt: number }>();
const CACHE_TTL = 5 * 60 * 1000;

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
}

interface DiscoveredItem {
  id: string;
  name: string;
  address?: string | null;
  website?: string | null;
  phone?: string | null;
  email?: string | null;
  socialMedia?: Record<string, string>;
  googleRating?: number | null;
  country?: string | null;
  city?: string | null;
  leadScore?: number;
  source?: string;
  [key: string]: unknown;
}

function isDuplicate(newItem: DiscoveredItem, existing: DiscoveredItem[]): boolean {
  const normalizedName = normalizeName(newItem.name);
  return existing.some((item) => {
    const normalizedName2 = normalizeName(item.name);
    if (normalizedName === normalizedName2) return true;
    if (newItem.address && item.address) {
      const normAddr1 = normalizeName(newItem.address);
      const normAddr2 = normalizeName(item.address);
      if (normalizedName === normalizedName2 && normAddr1 === normAddr2) return true;
    }
    return false;
  });
}

async function searchGoogle(query: string, radiusKm: number, location: { lat: number; lng: number } | null) {
  const lat = location?.lat ?? 0;
  const lng = location?.lng ?? 0;
  const radius = radiusKm ?? 50;

  const cached = await getCachedPlaces(query, lat, lng, radius);
  if (cached) return cached.items || [];

  const results = await googleTextSearch(query, radiusKm, location);
  const apiKey = env.GOOGLE_PLACES_API_KEY;

  const detailed = await Promise.all(
    results.slice(0, 30).map(async (place) => {
      const details = await googlePlaceDetails(place.id);
      const p = details || place;

      const website = p.websiteUri || '';
      const phone = p.internationalPhoneNumber || '';
      const emails = (p as unknown as Record<string, unknown>).emailAddresses as string[] | undefined;
      const email = emails?.[0] || null;
      const socialMedia = p.googleMapsUri ? { google_maps: p.googleMapsUri } : {};
      const hasSocialMedia = Object.keys(socialMedia).length > 0;
      const industry = extractIndustryFromTypes(p.types);
      const parsedAddress = parseAddress(p.formattedAddress || '');

      const leadScore = calculateLeadScore({
        hasWebsite: !!website,
        hasPhone: !!phone,
        hasEmail: !!email,
        hasSocialMedia,
        googleRating: p.rating ?? null,
      });

      const photoUrls = (p.photos || [])
        .slice(0, 5)
        .map((photo: { name: string }) => resolvePhotoUrl(photo.name, apiKey || ''))
        .filter((url: string) => url);

      return {
        id: `google:${p.id}`,
        name: p.displayName?.text || '',
        industry,
        address: p.formattedAddress || null,
        city: parsedAddress.city,
        country: parsedAddress.country,
        countryCode: parsedAddress.countryCode,
        latitude: p.location?.latitude || null,
        longitude: p.location?.longitude || null,
        phone: phone || null,
        email: email || null,
        emailAddresses: emails || [],
        website: website || null,
        googleRating: p.rating ?? null,
        googleReviewCount: p.userRatingCount ?? null,
        socialMedia,
        leadScore,
        source: 'google' as const,
        photos: photoUrls,
        openingHours: p.regularOpeningHours || {},
        openingHoursFormatted: formatOpeningHours(p.regularOpeningHours || {}),
        priceLevel: p.priceLevel ? parseInt(p.priceLevel) : null,
        googlePlaceId: p.id,
        facebookPageId: null,
      };
    })
  );

  await cachePlaces(query, lat, lng, radius, { items: detailed, total: detailed.length });

  return detailed;
}

async function searchFacebook(query: string, center: { lat: number; lng: number }, radiusKm: number) {
  const results = await facebookPageSearch(query, center, radiusKm);

  return results.map((page) => {
    const d = mapFacebookToDiscovered(page);
    const { _hasWebsite, _hasPhone, _hasEmail, _hasSocialMedia, ...rest } = d;
    return {
      ...rest,
      leadScore: calculateLeadScore({
        hasWebsite: _hasWebsite,
        hasPhone: _hasPhone,
        hasEmail: _hasEmail,
        hasSocialMedia: _hasSocialMedia,
        googleRating: null,
      }),
    };
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { industry, country, city, radius, filters, maxResults } = body;

    const cacheKey = JSON.stringify({ industry, country, city, radius, filters, maxResults });
    const cached = combinedCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return NextResponse.json(cached.data);
    }

    let location: { lat: number; lng: number } | null = null;

    if (city) {
      const searchAddress = country ? `${city}, ${country}` : city;
      location = await geocodeWithFallback(searchAddress);
    }

    const searchQuery = industry || city || 'business';
    const radiusNum = parseInt(radius) || 25;
    const limit = parseInt(maxResults) || 25;

    const [googleItems, facebookItems] = await Promise.allSettled([
      searchGoogle(searchQuery + (city ? ` in ${city}` : ''), radiusNum, location),
      location ? searchFacebook(searchQuery, location, radiusNum) : Promise.resolve([]),
    ]);

    const allItems: DiscoveredItem[] = [];

    if (googleItems.status === 'fulfilled') {
      allItems.push(...googleItems.value);
    }

    if (facebookItems.status === 'fulfilled') {
      allItems.push(...facebookItems.value);
    }

    let deduplicated = allItems.filter(
      (item, index, self) => index === self.findIndex((t) => t.id === item.id)
    );

    deduplicated = deduplicated.filter((item, idx, self) => {
      const prevItems = self.slice(0, idx);
      return !isDuplicate(item, prevItems);
    });

    if (filters?.noWebsiteOnly) {
      deduplicated = deduplicated.filter((item) => !item.website);
    }
    if (filters?.hasPhone) {
      deduplicated = deduplicated.filter((item) => item.phone);
    }
    if (filters?.hasEmail) {
      deduplicated = deduplicated.filter((item) => item.email);
    }
    if (filters?.hasSocialMedia) {
      deduplicated = deduplicated.filter((item) => Object.keys(item.socialMedia || {}).length > 0);
    }
    if (filters?.minRating) {
      deduplicated = deduplicated.filter((item) => item.googleRating && item.googleRating >= filters.minRating);
    }

    if (country) {
      deduplicated = deduplicated.filter((item) => item.country?.toUpperCase() === country.toUpperCase());
    }

    const sortBy = body.sortBy || 'leadScore';
    const sortOrder = body.sortOrder || 'desc';
    deduplicated.sort((a, b) => {
      let aVal: string | number = (a as Record<string, unknown>)[sortBy] as string | number;
      let bVal: string | number = (b as Record<string, unknown>)[sortBy] as string | number;
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      if (aVal == null) aVal = sortOrder === 'desc' ? -Infinity : Infinity;
      if (bVal == null) bVal = sortOrder === 'desc' ? -Infinity : Infinity;
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    const page = body.page || 1;
    const pageSize = limit;
    const total = deduplicated.length;
    const paginated = deduplicated.slice((page - 1) * pageSize, page * pageSize);

    const sourceCounts = deduplicated.reduce(
      (acc, item) => {
        const source = item.source || 'unknown';
        acc[source] = (acc[source] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const responseData = {
      items: paginated,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      sources: sourceCounts,
    };

    combinedCache.set(cacheKey, { data: responseData, expiresAt: Date.now() + CACHE_TTL });

    return NextResponse.json(responseData);
  } catch (err) {
    console.error('[API] Combined search error:', err);
    return NextResponse.json({ 
      error: err instanceof Error ? err.message : 'Internal server error',
      items: [],
      total: 0,
      page: 1,
      pageSize: 25,
      totalPages: 0,
      sources: {},
    }, { status: 200 });
  }
}
