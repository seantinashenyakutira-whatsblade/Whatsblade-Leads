import { NextRequest, NextResponse } from 'next/server';
import { googleTextSearch, googlePlaceDetails, extractIndustryFromTypes } from '@/lib/google-places';
import { calculateLeadScore } from '@/lib/scoring';
import { getCachedPlaces, cachePlaces } from '@/lib/redis/client';
import { parseAddress, formatOpeningHours, resolvePhotoUrl } from '@/lib/address-utils';
import { env } from '@/lib/env';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, radiusKm, location } = body;

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const lat = location?.lat ?? 0;
    const lng = location?.lng ?? 0;
    const radius = radiusKm ?? 50;

    const cached = await getCachedPlaces(query, lat, lng, radius);
    if (cached) {
      return NextResponse.json(cached);
    }

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

    const responseData = { items: detailed, total: detailed.length };

    await cachePlaces(query, lat, lng, radius, responseData);

    return NextResponse.json(responseData);
  } catch (err) {
    console.error('[API] Google search error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
