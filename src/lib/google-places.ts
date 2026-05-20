import { env } from '@/lib/env';

const BASE_URL = 'https://places.googleapis.com/v1';

interface GooglePlaceResult {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  location?: { latitude: number; longitude: number };
  internationalPhoneNumber?: string;
  websiteUri?: string;
  rating?: number;
  userRatingCount?: number;
  types?: string[];
  photos?: { name: string }[];
  regularOpeningHours?: { weekdayDescriptions: string[] };
  priceLevel?: string;
  googleMapsUri?: string;
}

interface GooglePlaceDetailsResult {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  location?: { latitude: number; longitude: number };
  internationalPhoneNumber?: string;
  websiteUri?: string;
  rating?: number;
  userRatingCount?: number;
  types?: string[];
  photos?: { name: string; widthPx: number; heightPx: number }[];
  regularOpeningHours?: { weekdayDescriptions: string[] };
  priceLevel?: string;
  googleMapsUri?: string;
  emailAddresses?: string[];
}

export async function googleTextSearch(
  query: string,
  radiusKm: number,
  location?: { lat: number; lng: number }
): Promise<GooglePlaceResult[]> {
  const apiKey = env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return [];

  const radiusMeters = radiusKm * 1000;

  const body: Record<string, unknown> = {
    textQuery: query,
    maxResultCount: 60,
    includedType: 'business',
  };

  if (location) {
    body.locationBias = {
      circle: {
        center: { latitude: location.lat, longitude: location.lng },
        radius: radiusMeters,
      },
    };
  }

  const response = await fetch(`${BASE_URL}/places:searchText`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.internationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.types,places.photos.name,places.regularOpeningHours.weekdayDescriptions,places.priceLevel,places.googleMapsUri',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    console.error('[GOOGLE] Text search failed:', response.status, await response.text());
    return [];
  }

  const data = await response.json();
  return data.places || [];
}

export async function googlePlaceDetails(placeId: string): Promise<GooglePlaceDetailsResult | null> {
  const apiKey = env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return null;

  const response = await fetch(`${BASE_URL}/places/${placeId}`, {
    headers: {
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'id,displayName,formattedAddress,location,internationalPhoneNumber,websiteUri,rating,userRatingCount,types,photos.name,photos.widthPx,photos.heightPx,regularOpeningHours.weekdayDescriptions,priceLevel,googleMapsUri,emailAddresses',
    },
  });

  if (!response.ok) {
    console.error('[GOOGLE] Place details failed:', response.status);
    return null;
  }

  return response.json();
}

export async function googleGeocode(address: string): Promise<{ lat: number; lng: number } | null> {
  const apiKey = env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
    );

    if (!response.ok) return null;

    const data = await response.json();
    if (data.status !== 'OK' || !data.results?.length) return null;

    const { lat, lng } = data.results[0].geometry.location;
    return { lat, lng };
  } catch {
    return null;
  }
}

export async function openStreetMapGeocode(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
      {
        headers: {
          'User-Agent': 'Whatsblade/1.0 (Lead Discovery Platform)',
        },
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    if (!data.length) return null;

    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
    };
  } catch {
    return null;
  }
}

export async function geocodeWithFallback(address: string): Promise<{ lat: number; lng: number } | null> {
  const googleResult = await googleGeocode(address);
  if (googleResult) return googleResult;

  return await openStreetMapGeocode(address);
}

export function extractIndustryFromTypes(types: string[] = []): string | null {
  const typeMap: Record<string, string> = {
    restaurant: 'Restaurants & Cafes',
    cafe: 'Restaurants & Cafes',
    bakery: 'Restaurants & Cafes',
    bar: 'Restaurants & Cafes',
    hotel: 'Hospitality & Hotels',
    lodging: 'Hospitality & Hotels',
    dentist: 'Dental Services',
    doctor: 'Healthcare & Medical',
    hospital: 'Healthcare & Medical',
    pharmacy: 'Pharmaceuticals',
    lawyer: 'Law & Legal Services',
    accountant: 'Accounting & Tax Services',
    real_estate_agency: 'Real Estate',
    gym: 'Fitness & Gyms',
    beauty_salon: 'Salons & Spas',
    hair_care: 'Salons & Spas',
    car_repair: 'Automotive Repair & Service',
    veterinary_care: 'Pet Services & Veterinary',
    grocery_or_supermarket: 'Grocery & Supermarkets',
    clothing_store: 'Fashion & Apparel',
    electronics_store: 'Electronics & Technology',
    furniture_store: 'Furniture & Home Decor',
    marketing_agency: 'Advertising & Marketing',
    software_company: 'Software Development',
    it_consultant: 'IT Services & Support',
    school: 'Education & Tutoring',
    university: 'Education & Tutoring',
    construction_company: 'Construction & Contracting',
    electrician: 'Electronics & Technology',
    plumber: 'Plumbing Services',
    painter: 'Painting & Decorating',
    moving_company: 'Moving & Relocation',
    insurance_agency: 'Insurance',
    bank: 'Banking & Financial Services',
    travel_agency: 'Travel & Tourism',
    laundry: 'Laundry & Dry Cleaning',
    florist: 'Fashion & Apparel',
    jewelry_store: 'Jewelry & Accessories',
    bookstore: 'Retail & E-Commerce',
    supermarket: 'Grocery & Supermarkets',
    convenience_store: 'Grocery & Supermarkets',
    meal_delivery: 'Restaurants & Cafes',
    meal_takeaway: 'Restaurants & Cafes',
    night_club: 'Entertainment & Events',
    movie_theater: 'Entertainment & Events',
    amusement_park: 'Entertainment & Events',
    museum: 'Entertainment & Events',
    art_gallery: 'Entertainment & Events',
    church: 'Non-Profit & Charity',
    funeral_home: 'Funeral Services',
    post_office: 'Logistics & Shipping',
    storage: 'Logistics & Shipping',
    trucking_company: 'Logistics & Shipping',
    taxi_stand: 'Transportation & Taxi',
    bus_station: 'Transportation & Taxi',
    train_station: 'Transportation & Taxi',
    airport: 'Transportation & Taxi',
    gas_station: 'Automotive Repair & Service',
    parking: 'Automotive Repair & Service',
    car_dealer: 'Automotive Repair & Service',
    car_wash: 'Automotive Repair & Service',
    spa: 'Salons & Spas',
    nail_care: 'Salons & Spas',
    physiotherapist: 'Healthcare & Medical',
    chiropractor: 'Healthcare & Medical',
    optician: 'Optometry & Eyewear',
    optometrist: 'Optometry & Eyewear',
    dental_clinic: 'Dental Services',
    food: 'Restaurants & Cafes',
    store: 'Retail & E-Commerce',
    point_of_interest: '',
    establishment: '',
  };

  for (const type of types) {
    if (typeMap[type]) return typeMap[type];
  }
  return null;
}
