import { NextRequest, NextResponse } from 'next/server';

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
    const searchParts: string[] = [];

    if (city) {
      searchParts.push(city);
      if (country) searchParts.push(country);
      const geoRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/search/geocode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: searchParts.join(', ') }),
      });
      if (geoRes.ok) {
        location = await geoRes.json();
      }
    }

    const searchQuery = industry || city || 'business';
    const radiusNum = parseInt(radius) || 25;
    const limit = parseInt(maxResults) || 25;

    const [googleRes, facebookRes] = await Promise.allSettled([
      fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/search/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery + (city ? ` in ${city}` : ''),
          radiusKm: radiusNum,
          location,
        }),
      }),
      location
        ? fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/search/facebook`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              query: searchQuery,
              center: location,
              radiusKm: radiusNum,
            }),
          })
        : Promise.resolve({ ok: false }),
    ]);

    const allItems: DiscoveredItem[] = [];

    if (googleRes.status === 'fulfilled' && googleRes.value.ok) {
      const googleData = await googleRes.value.json();
      allItems.push(...(googleData.items || []));
    }

    if (facebookRes.status === 'fulfilled' && 'json' in facebookRes.value && facebookRes.value.ok) {
      const facebookData = await facebookRes.value.json();
      allItems.push(...(facebookData.items || []));
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
