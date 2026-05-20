import { COUNTRIES, getCountryByCode } from '@/lib/countries';

const COUNTRY_NAMES_TO_CODE: Record<string, string> = {};

COUNTRIES.forEach((c) => {
  COUNTRY_NAMES_TO_CODE[c.name.toLowerCase()] = c.code;
  COUNTRY_NAMES_TO_CODE[c.name.toLowerCase().replace(' of ', ' ')] = c.code;
});

export interface ParsedAddress {
  city: string | null;
  country: string | null;
  countryCode: string | null;
  state: string | null;
  street: string | null;
  postalCode: string | null;
}

export function parseAddress(formattedAddress: string): ParsedAddress {
  if (!formattedAddress) {
    return { city: null, country: null, countryCode: null, state: null, street: null, postalCode: null };
  }

  const parts = formattedAddress.split(',').map((p) => p.trim());
  
  const result: ParsedAddress = {
    city: null,
    country: null,
    countryCode: null,
    state: null,
    street: null,
    postalCode: null,
  };

  if (parts.length === 0) return result;

  const lastPart = parts[parts.length - 1];
  const lastPartUpper = lastPart.toUpperCase();

  const countryMatch = COUNTRIES.find(
    (c) => c.name.toUpperCase() === lastPartUpper || c.code.toUpperCase() === lastPartUpper
  );

  if (countryMatch) {
    result.country = countryMatch.name;
    result.countryCode = countryMatch.code;
    
    if (parts.length >= 2) {
      const secondLast = parts[parts.length - 2];
      const postalCodeMatch = secondLast.match(/^(\d{4,6})$/);
      if (postalCodeMatch) {
        result.postalCode = secondLast;
        if (parts.length >= 3) {
          result.city = parts[parts.length - 3];
          if (parts.length >= 4) {
            result.state = parts[parts.length - 4];
          }
        } else {
          result.city = parts[parts.length - 3] || null;
        }
      } else {
        result.city = secondLast;
        if (parts.length >= 3) {
          const stateCandidate = parts[parts.length - 3];
          const isState = !stateCandidate.match(/^\d+$/) && stateCandidate.length > 2;
          if (isState) {
            result.state = stateCandidate;
          } else {
            result.city = stateCandidate;
          }
        }
      }
    }
  } else {
    const postalCodeMatch = lastPart.match(/^([A-Z0-9\s-]{3,10})$/);
    if (postalCodeMatch && parts.length >= 2) {
      result.postalCode = lastPart;
      result.city = parts[parts.length - 2];
      result.country = parts[parts.length - 3] || null;
      
      const countryFromName = COUNTRY_NAMES_TO_CODE[result.country?.toLowerCase() || ''];
      if (countryFromName) {
        result.countryCode = countryFromName;
      }
    } else {
      result.city = lastPart;
      if (parts.length >= 2) {
        result.state = parts[parts.length - 2];
        if (parts.length >= 3) {
          result.country = parts[parts.length - 3];
          const countryFromName = COUNTRY_NAMES_TO_CODE[result.country.toLowerCase()];
          if (countryFromName) {
            result.countryCode = countryFromName;
          }
        }
      }
    }
  }

  result.street = parts.slice(0, Math.max(0, parts.length - (result.postalCode ? 3 : 2))).join(', ') || null;

  return result;
}

export function formatOpeningHours(openingHours: Record<string, unknown>): string {
  if (!openingHours || Object.keys(openingHours).length === 0) {
    return 'Hours not available';
  }

  const weekdayDescriptions = (openingHours.weekdayDescriptions as string[]) || [];
  
  if (weekdayDescriptions.length === 0) {
    return 'Hours not available';
  }

  return weekdayDescriptions.join('\n');
}

export function resolvePhotoUrl(photoName: string, apiKey: string): string {
  if (!photoName || !apiKey) return '';
  
  const photoRef = photoName.split('/').pop() || photoName;
  return `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=400&maxWidthPx=400&key=${apiKey}`;
}

export function extractEmailFromWebsite(url: string): string | null {
  if (!url) return null;
  
  const commonPatterns = ['info', 'contact', 'hello', 'support', 'sales', 'admin', 'office'];
  
  try {
    const domain = new URL(url).hostname.replace('www.', '');
    for (const pattern of commonPatterns) {
      return `${pattern}@${domain}`;
    }
  } catch {
    return null;
  }
  
  return null;
}
