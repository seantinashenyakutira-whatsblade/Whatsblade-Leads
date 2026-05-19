import { env } from '@/lib/env';

interface LeadRecord {
  facebook_page_id: string | null;
  company: string | null;
  city: string | null;
  country: string | null;
  phone: string | null;
  website: string | null;
  social_media: Record<string, string> | null;
  [key: string]: unknown;
}

const WHATSAPP_COUNTRIES = new Set([
  'US', 'GB', 'CA', 'AU', 'DE', 'FR', 'IT', 'ES', 'BR', 'MX', 'AR', 'CO',
  'CL', 'PE', 'VE', 'ZA', 'NG', 'KE', 'GH', 'EG', 'MA', 'IN', 'PK', 'BD',
  'ID', 'MY', 'PH', 'TH', 'VN', 'SG', 'JP', 'KR', 'CN', 'RU', 'UA', 'PL',
  'NL', 'BE', 'SE', 'NO', 'DK', 'FI', 'PT', 'IE', 'AT', 'CH', 'CZ', 'RO',
  'HU', 'GR', 'TR', 'SA', 'AE', 'IL', 'ZM', 'ZW', 'BW', 'MZ', 'TZ', 'UG',
  'RW', 'ET', 'CM', 'CI', 'SN', 'ML', 'BF', 'NE', 'TD', 'CF', 'GA', 'CG',
  'CD', 'AO', 'NA', 'LS', 'SZ', 'MW', 'MG', 'MU', 'SC', 'RE', 'YT',
]);

export async function enrichSocial(lead: LeadRecord) {
  const updates: Record<string, unknown> = {};
  const details: Record<string, unknown> = {};

  // Facebook enrichment
  if (lead.facebook_page_id) {
    const fbData = await fetchFacebookPageData(lead.facebook_page_id);
    if (fbData) {
      if (fbData.fan_count !== undefined) {
        updates.facebook_followers = fbData.fan_count;
        details.facebookFollowers = fbData.fan_count;
      }
      if (fbData.posts?.data?.[0]?.created_time) {
        updates.facebook_last_post_date = fbData.posts.data[0].created_time;
        details.facebookLastPost = fbData.posts.data[0].created_time;
      }
    }
  } else if (lead.company && lead.city) {
    // Search for Facebook page by name + city
    const matchedPage = await searchFacebookPage(lead.company, lead.city);
    if (matchedPage) {
      updates.facebook_page_id = matchedPage.id;
      if (matchedPage.fan_count) {
        updates.facebook_followers = matchedPage.fan_count;
        details.facebookFollowers = matchedPage.fan_count;
      }
      const existingSocial = lead.social_media || {};
      updates.social_media = { ...existingSocial, facebook: matchedPage.link || `https://facebook.com/${matchedPage.id}` };
    }
  }

  // Instagram detection from website meta tags
  if (lead.website) {
    const instagramUrl = await detectInstagramFromWebsite(lead.website);
    if (instagramUrl) {
      updates.instagram_url = instagramUrl;
      details.instagramFound = true;
      details.instagramUrl = instagramUrl;
    } else {
      details.instagramFound = false;
    }
  }

  // WhatsApp availability check
  if (lead.phone) {
    const isAvailable = checkWhatsAppAvailability(lead.phone, lead.country);
    updates.whatsapp_available = isAvailable;
    details.whatsappAvailable = isAvailable;
  }

  return {
    status: 'success' as const,
    details,
    updates,
  };
}

async function fetchFacebookPageData(pageId: string) {
  const token = env.FACEBOOK_ACCESS_TOKEN;
  if (!token) return null;

  try {
    const params = new URLSearchParams({
      fields: 'fan_count,engagement,posts.limit(1){created_time}',
      access_token: token,
    });

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${pageId}?${params.toString()}`
    );

    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

async function searchFacebookPage(name: string, city: string) {
  const token = env.FACEBOOK_ACCESS_TOKEN;
  if (!token) return null;

  try {
    const query = `${name} ${city}`;
    const params = new URLSearchParams({
      q: query,
      type: 'page',
      limit: '5',
      fields: 'id,name,link,fan_count,category',
      access_token: token,
    });

    const response = await fetch(
      `https://graph.facebook.com/v18.0/search?${params.toString()}`
    );

    if (!response.ok) return null;
    const data = await response.json();

    if (!data.data?.length) return null;

    // Find best match by name similarity
    const normalizedName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const page of data.data) {
      const normalizedPageName = page.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (normalizedPageName.includes(normalizedName) || normalizedName.includes(normalizedPageName)) {
        return page;
      }
    }

    return data.data[0];
  } catch {
    return null;
  }
}

async function detectInstagramFromWebsite(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Whatsblade/1.0; +https://whatsblade.com)',
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) return null;

    const html = await response.text();

    // Check meta tags for Instagram
    const metaPatterns = [
      /<meta[^>]+property=["']og:url["'][^>]+content=["']([^"']*instagram\.com\/[^"']+)["']/i,
      /<meta[^>]+name=["']twitter:site["'][^>]+content=["']@?([^"']+)["']/i,
      /<link[^>]+rel=["']me["'][^>]+href=["']([^"']*instagram\.com\/[^"']+)["']/i,
    ];

    for (const pattern of metaPatterns) {
      const match = html.match(pattern);
      if (match) {
        let instagramUrl = match[1];
        if (!instagramUrl.startsWith('http')) {
          instagramUrl = `https://instagram.com/${instagramUrl.replace('@', '')}`;
        }
        return instagramUrl;
      }
    }

    // Check anchor tags for Instagram links
    const anchorPattern = /<a[^>]+href=["']([^"']*instagram\.com\/([^"']+)?)["'][^>]*>/gi;
    let anchorMatch;
    while ((anchorMatch = anchorPattern.exec(html)) !== null) {
      const handle = anchorMatch[2];
      if (handle && !handle.includes('/') && !handle.includes('?')) {
        return `https://instagram.com/${handle}`;
      }
    }

    return null;
  } catch {
    return null;
  }
}

function checkWhatsAppAvailability(phone: string, country: string | null): boolean {
  // Check if country supports WhatsApp
  if (country && !WHATSAPP_COUNTRIES.has(country.toUpperCase())) {
    return false;
  }

  // Check if phone number is in valid international format (E.164)
  const cleanPhone = phone.replace(/[^0-9+]/g, '');
  const e164Pattern = /^\+[1-9]\d{6,14}$/;

  return e164Pattern.test(cleanPhone);
}
