interface LeadRecord {
  website: string | null;
  [key: string]: unknown;
}

const BOOKING_KEYWORDS = [
  'calendly', 'squareup', 'booksy', 'fresha', 'acuity', 'setmore',
  'simplybook', 'booking.com', 'reservio', 'timely', 'mindbody',
  'fareharbor', 'peek', 'bookeo', 'appointy', '10to8', 'youcanbookme',
  'scheduleonce', 'chili piper', 'hubspot meetings',
];

const PARKED_INDICATORS = [
  'this domain is parked', 'this domain is registered', 'buy this domain',
  'parked page', 'domain for sale', 'premium domain', 'sedo.com',
  'godaddy.com/domain', 'namecheap.com', 'parkingcrew', 'bodis.com',
  'dan.com', 'afternic.com', 'flippa.com',
];

const TECHNOLOGY_PATTERNS: Record<string, RegExp> = {
  WordPress: /wp-content|wp-includes|wordpress/i,
  Shopify: /shopify|myshopify\.com/i,
  WooCommerce: /woocommerce/i,
  Wix: /wix\.com|wixsite\.com/i,
  Squarespace: /squarespace\.com/i,
  Webflow: /webflow\.io|webflow\.com/i,
  Joomla: /joomla/i,
  Drupal: /drupal/i,
  Magento: /magento|\.magento\.cloud/i,
  PrestaShop: /prestashop/i,
  'Google Analytics': /google-analytics\.com|gtag/i,
  'Google Tag Manager': /googletagmanager\.com/i,
  'Facebook Pixel': /facebook\.com\/tr|fbq\(/i,
  HubSpot: /hubspot\.com|hs-scripts\.com/i,
  Salesforce: /salesforce\.com|force\.com/i,
  Stripe: /js\.stripe\.com/i,
  PayPal: /paypal\.com\/sdk/i,
  Cloudflare: /cloudflare\.com|cloudflare-static/i,
  'Amazon AWS': /amazonaws\.com/i,
  'Microsoft Azure': /azureedge\.net|azurewebsites\.net/i,
  React: /react|reactjs/i,
  Vue: /vue\.js|vuejs/i,
  Angular: /angular/i,
  jQuery: /jquery/i,
  Bootstrap: /bootstrap/i,
  Tailwind: /tailwindcss/i,
};

export async function enrichWebsite(lead: LeadRecord) {
  if (!lead.website) {
    return { status: 'skipped' as const, details: { reason: 'No website URL' }, updates: {} };
  }

  const url = normalizeUrl(lead.website);
  if (!url) {
    return { status: 'failed' as const, details: { reason: 'Invalid URL' }, updates: {} };
  }

  const result = await analyzeWebsite(url);

  const updates: Record<string, unknown> = {
    website_status: result.status,
    has_booking_system: result.hasBookingSystem,
    is_mobile_responsive: result.isMobileResponsive,
    website_quality_score: result.qualityScore,
    technographics: result.technologies,
  };

  return {
    status: 'success' as const,
    details: {
      status: result.status,
      hasBookingSystem: result.hasBookingSystem,
      isMobileResponsive: result.isMobileResponsive,
      qualityScore: result.qualityScore,
      technologiesDetected: Object.keys(result.technologies).length,
    },
    updates,
  };
}

function normalizeUrl(url: string): string | null {
  try {
    let normalized = url.trim();
    if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
      normalized = 'https://' + normalized;
    }
    new URL(normalized);
    return normalized;
  } catch {
    return null;
  }
}

async function analyzeWebsite(url: string) {
  let status: 'live' | 'parked' | 'down' = 'down';
  let html = '';
  let statusCode = 0;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Whatsblade/1.0; +https://whatsblade.com)',
        'Accept': 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
      signal: controller.signal,
    });

    clearTimeout(timeout);
    statusCode = response.status;
    html = await response.text();

    if (response.ok) {
      const lowerHtml = html.toLowerCase();
      const isParked = PARKED_INDICATORS.some((indicator) => lowerHtml.includes(indicator));

      if (isParked) {
        status = 'parked';
      } else if (html.length > 500) {
        status = 'live';
      } else {
        status = 'down';
      }
    } else if (statusCode >= 500) {
      status = 'down';
    } else if (statusCode >= 400) {
      status = 'down';
    }
  } catch {
    status = 'down';
  }

  const lowerHtml = html.toLowerCase();

  const hasBookingSystem = BOOKING_KEYWORDS.some((keyword) =>
    lowerHtml.includes(keyword)
  );

  const hasViewport = /<meta[^>]+name=["']viewport["']/i.test(html);
  const hasMediaQueries = /@media\s*\(/i.test(html);
  const isMobileResponsive = hasViewport || hasMediaQueries;

  const technologies: Record<string, string> = {};
  for (const [name, pattern] of Object.entries(TECHNOLOGY_PATTERNS)) {
    if (pattern.test(html)) {
      technologies[name] = 'detected';
    }
  }

  let qualityScore = 50;

  if (url.startsWith('https://')) {
    qualityScore += 20;
  }

  if (isMobileResponsive) {
    qualityScore += 15;
  }

  if (html.length > 1000) {
    qualityScore += 10;
  }

  if (hasBookingSystem) {
    qualityScore += 10;
  }

  if (/<form[^>]+(action|method)/i.test(html) || /mailto:/i.test(html)) {
    qualityScore += 10;
  }

  if (/(facebook\.com|twitter\.com|instagram\.com|linkedin\.com)/i.test(html)) {
    qualityScore += 5;
  }

  if (Object.keys(technologies).length > 3) {
    qualityScore += 5;
  }

  if (status === 'parked') {
    qualityScore -= 20;
  }
  if (status === 'down') {
    qualityScore -= 30;
  }

  qualityScore = Math.max(0, Math.min(100, qualityScore));

  return {
    status,
    hasBookingSystem,
    isMobileResponsive,
    qualityScore,
    technologies,
  };
}
