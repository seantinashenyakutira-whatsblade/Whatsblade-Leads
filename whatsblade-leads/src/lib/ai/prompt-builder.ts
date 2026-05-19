interface LeadContext {
  name: string;
  industry: string | null;
  city: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  googleRating: number | null;
  googleReviewCount: number | null;
  socialMedia: Record<string, string>;
  leadScore: number;
  source: string;
  notes: string | null;
}

interface BusinessProfileContext {
  businessName: string;
  services: string[];
  pricingInfo: string | null;
  offerText: string | null;
  location: string | null;
  baseCurrency: string;
}

const LENGTH_MAP: Record<string, string> = {
  short: 'Keep it brief (50-100 words). Get straight to the point.',
  medium: 'Write a moderate length message (100-200 words). Include key details.',
  long: 'Write a detailed message (200-350 words). Be thorough and comprehensive.',
};

export function buildOutreachPrompt(
  lead: LeadContext,
  business: BusinessProfileContext,
  platform: string,
  tone: string,
  language: string,
  length: string
): string {
  const socialLinks = Object.entries(lead.socialMedia)
    .map(([key, url]) => `${key}: ${url}`)
    .join(', ');

  const websiteStatus = lead.website ? `Has website: ${lead.website}` : 'No website (high opportunity)';

  return `You are a sales outreach assistant for ${business.businessName}.

## Your Business
- Services: ${business.services.join(', ')}
- Pricing: ${business.pricingInfo || 'Contact for pricing'}
- Offer: ${business.offerText || 'Free consultation'}
- Location: ${business.location || 'Remote'}
- Currency: ${business.baseCurrency}

## Lead Intelligence
- Business: ${lead.name}
- Industry: ${lead.industry || 'Unknown'}
- Location: ${lead.city || ''}${lead.city && lead.country ? ', ' : ''}${lead.country || ''}
- Phone: ${lead.phone || 'Not available'}
- Email: ${lead.email || 'Not available'}
- ${websiteStatus}
- Google Rating: ${lead.googleRating || 'N/A'}${lead.googleReviewCount ? ` (${lead.googleReviewCount} reviews)` : ''}
- Social Media: ${socialLinks || 'None'}
- Lead Score: ${lead.leadScore}/100 (${lead.leadScore >= 80 ? 'Hot' : lead.leadScore >= 60 ? 'Warm' : lead.leadScore >= 40 ? 'Moderate' : 'Cold'})
- Source: ${lead.source}
- Notes: ${lead.notes || 'None'}

## Task
Generate a personalized outreach message for this lead.

## Requirements
- Platform: ${platform} (adapt tone and format for this platform)
- Tone: ${tone}
- Language: ${language}
- Length: ${LENGTH_MAP[length] || LENGTH_MAP.medium}
- Reference the lead's business name, industry, and location naturally
- Highlight how your services can help their specific business
- Include your offer: ${business.offerText || 'Free consultation/demo'}
- End with a clear call to action
- Do NOT use placeholders like [Name] or [Company] - use the actual lead data
- For WhatsApp/SMS: Keep it conversational and concise
- For Email: Include a subject line suggestion
- For social platforms: Keep it friendly and engaging

## Output Format
Return ONLY the message text. No explanations, no markdown formatting.

For email, format as:
Subject: [subject line]
[message body]`;
}

export function buildAnalysisPrompt(lead: LeadContext): string {
  const socialLinks = Object.entries(lead.socialMedia)
    .map(([key, url]) => `${key}: ${url}`)
    .join(', ');

  return `Analyze this business lead and provide insights for sales outreach.

## Lead Data
- Business: ${lead.name}
- Industry: ${lead.industry || 'Unknown'}
- Location: ${lead.city || ''}${lead.city && lead.country ? ', ' : ''}${lead.country || ''}
- Phone: ${lead.phone || 'Not available'}
- Email: ${lead.email || 'Not available'}
- Website: ${lead.website || 'None'}
- Google Rating: ${lead.googleRating || 'N/A'}${lead.googleReviewCount ? ` (${lead.googleReviewCount} reviews)` : ''}
- Social Media: ${socialLinks || 'None'}
- Lead Score: ${lead.leadScore}/100

## Task
Provide:
1. A brief summary (2-3 sentences) of this business and their likely needs
2. 3-5 opportunity tags (short phrases like "needs website", "poor online presence", "high growth potential")
3. Recommended outreach platform (whatsapp, instagram, facebook, email, sms, linkedin)
4. Recommended tone (friendly, professional, bold, consultative)

## Output Format
Return ONLY a JSON object with this exact structure:
{
  "summary": "string",
  "opportunityTags": ["tag1", "tag2", "tag3"],
  "recommendedPlatform": "platform",
  "recommendedTone": "tone"
}`;
}

export function buildBulkPrompt(
  lead: LeadContext,
  business: BusinessProfileContext,
  platform: string,
  tone: string,
  language: string,
  length: string
): string {
  return buildOutreachPrompt(lead, business, platform, tone, language, length);
}
