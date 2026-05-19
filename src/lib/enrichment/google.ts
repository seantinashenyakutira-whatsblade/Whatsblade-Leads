import { googlePlaceDetails } from '@/lib/google-places';

interface LeadRecord {
  google_place_id: string | null;
  [key: string]: unknown;
}

export async function enrichGoogle(lead: LeadRecord) {
  if (!lead.google_place_id) {
    return { status: 'skipped' as const, details: { reason: 'No google_place_id' }, updates: {} };
  }

  const details = await googlePlaceDetails(lead.google_place_id);

  if (!details) {
    return { status: 'failed' as const, details: { reason: 'Google Places API returned null' }, updates: {} };
  }

  const updates: Record<string, unknown> = {};

  // Update photos
  if (details.photos && details.photos.length > 0) {
    updates.photos = details.photos.map((p) => ({
      name: p.name,
      width: p.widthPx,
      height: p.heightPx,
    }));
  }

  // Update opening hours
  if (details.regularOpeningHours) {
    updates.opening_hours = details.regularOpeningHours;
  }

  // Update rating and review count
  if (details.rating !== undefined) {
    updates.google_rating = details.rating;
  }
  if (details.userRatingCount !== undefined) {
    updates.google_review_count = details.userRatingCount;
  }

  // Update address components
  if (details.formattedAddress) {
    updates.address = details.formattedAddress;
    const parts = details.formattedAddress.split(',').map((s) => s.trim());
    if (parts.length >= 2) {
      updates.city = parts[parts.length - 2];
      updates.country = parts[parts.length - 1];
    }
  }

  // Update location
  if (details.location) {
    updates.latitude = details.location.latitude;
    updates.longitude = details.location.longitude;
  }

  // Update phone
  if (details.internationalPhoneNumber) {
    updates.phone = details.internationalPhoneNumber;
  }

  // Update website
  if (details.websiteUri) {
    updates.website = details.websiteUri;
  }

  // Update Google Maps URI in social media
  if (details.googleMapsUri) {
    const existingSocial = (lead.social_media as Record<string, string>) || {};
    updates.social_media = { ...existingSocial, google_maps: details.googleMapsUri };
  }

  // Update price level
  if (details.priceLevel) {
    updates.price_level = parseInt(details.priceLevel, 10);
  }

  return {
    status: 'success' as const,
    details: {
      photosCount: details.photos?.length || 0,
      hasOpeningHours: !!details.regularOpeningHours,
      rating: details.rating,
      reviewCount: details.userRatingCount,
    },
    updates,
  };
}
