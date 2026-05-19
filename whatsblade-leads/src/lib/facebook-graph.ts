import { env } from '@/lib/env';

interface FacebookPageResult {
  id: string;
  name: string;
  about?: string;
  phone?: string;
  website?: string;
  link?: string;
  category?: string;
  location?: {
    city?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
    street?: string;
    zip?: string;
  };
  emails?: string[];
}

export async function facebookPageSearch(
  query: string,
  center: { lat: number; lng: number },
  radiusKm: number
): Promise<FacebookPageResult[]> {
  const token = env.FACEBOOK_ACCESS_TOKEN;
  if (!token) return [];

  const radiusMeters = radiusKm * 1000;

  const params = new URLSearchParams({
    q: query,
    type: 'place',
    center: `${center.lat},${center.lng}`,
    distance: radiusMeters.toString(),
    limit: '50',
    fields: 'id,name,about,phone,website,link,category,location,emails',
    access_token: token,
  });

  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/search?${params.toString()}`
    );

    if (!response.ok) {
      console.error('[FACEBOOK] Page search failed:', response.status);
      return [];
    }

    const data = await response.json();
    return data.data || [];
  } catch (err) {
    console.error('[FACEBOOK] Search error:', err);
    return [];
  }
}

export function mapFacebookToDiscovered(page: FacebookPageResult) {
  return {
    id: `facebook:${page.id}`,
    name: page.name,
    industry: page.category || null,
    address: page.location?.street || null,
    city: page.location?.city || null,
    country: page.location?.country || null,
    latitude: page.location?.latitude || null,
    longitude: page.location?.longitude || null,
    phone: page.phone || null,
    email: page.emails?.[0] || null,
    website: page.website || null,
    googleRating: null as number | null,
    googleReviewCount: null as number | null,
    socialMedia: page.link ? { facebook: page.link } : {},
    leadScore: 0,
    source: 'facebook' as const,
    photos: [] as string[],
    openingHours: {} as Record<string, unknown>,
    priceLevel: null as number | null,
    googlePlaceId: null as string | null,
    facebookPageId: page.id,
    _hasWebsite: !!page.website,
    _hasPhone: !!page.phone,
    _hasEmail: !!(page.emails?.length),
    _hasSocialMedia: !!(page.link || page.id),
  };
}
