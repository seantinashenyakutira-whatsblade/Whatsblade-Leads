import { generateWithRetry } from '@/lib/ai/client';

interface LeadRecord {
  company: string | null;
  first_name: string | null;
  last_name: string | null;
  industry: string | null;
  city: string | null;
  country: string | null;
  website: string | null;
  website_status: string | null;
  google_rating: number | null;
  google_review_count: number | null;
  facebook_followers: number | null;
  instagram_url: string | null;
  whatsapp_available: boolean | null;
  website_quality_score: number | null;
  has_booking_system: boolean | null;
  is_mobile_responsive: boolean | null;
  lead_score: number | null;
  phone: string | null;
  email: string | null;
  [key: string]: unknown;
}

export async function enrichAI(lead: LeadRecord) {
  const businessName = lead.company || `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Unknown Business';

  const prompt = `Analyze this business lead and generate a 3-sentence intelligence summary.

## Business Data
- Name: ${businessName}
- Industry: ${lead.industry || 'Unknown'}
- Location: ${lead.city || ''}${lead.city && lead.country ? ', ' : ''}${lead.country || ''}
- Website: ${lead.website_status || 'none'} (${lead.website || 'N/A'})
- Google Rating: ${lead.google_rating || 'N/A'}/5 (${lead.google_review_count || 0} reviews)
- Facebook: ${lead.facebook_followers || 0} followers
- Instagram: ${lead.instagram_url || 'Not found'}
- WhatsApp Available: ${lead.whatsapp_available ? 'Yes' : 'No'}
- Website Quality: ${lead.website_quality_score || 0}/100
- Has Booking System: ${lead.has_booking_system ? 'Yes' : 'No'}
- Mobile Responsive: ${lead.is_mobile_responsive ? 'Yes' : 'No'}
- Lead Score: ${lead.lead_score || 0}/100

## Task
Generate exactly 3 sentences:
1. What this business does and their current digital presence
2. Why they need digital services (specific gaps identified from the data above)
3. What to lead with in outreach (best angle based on their situation)

Return ONLY the 3 sentences. No labels, no formatting, no markdown.`;

  const raw = await generateWithRetry(prompt);
  const summary = raw.trim().replace(/\n+/g, ' ').substring(0, 500);

  // Generate opportunity tags from data
  const tags: string[] = [];

  if (!lead.website || lead.website_status === 'none') {
    tags.push('No website');
  }
  if (lead.website_status === 'parked') {
    tags.push('Parked domain');
  }
  if (lead.website_quality_score !== null && lead.website_quality_score < 40) {
    tags.push('Poor website');
  }
  if (!lead.has_booking_system) {
    tags.push('No booking system');
  }
  if (!lead.is_mobile_responsive) {
    tags.push('Not mobile responsive');
  }
  if (lead.google_review_count !== null && lead.google_review_count < 10 && lead.google_rating !== null && lead.google_rating < 4.0) {
    tags.push('Low reviews');
  }
  if (!lead.facebook_followers && !lead.instagram_url) {
    tags.push('No social presence');
  }
  if (!lead.whatsapp_available) {
    tags.push('No WhatsApp');
  }
  if (lead.lead_score !== null && lead.lead_score >= 80) {
    tags.push('High opportunity');
  }

  if (tags.length === 0) {
    tags.push('Well-established online');
  }

  return {
    status: 'success' as const,
    details: {
      summaryLength: summary.length,
      tagsCount: tags.length,
    },
    updates: {
      ai_summary: summary,
      opportunity_tags: tags,
    },
  };
}
