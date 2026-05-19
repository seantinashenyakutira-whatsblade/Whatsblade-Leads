import { generateWithRetry } from './client';
import { buildOutreachPrompt, buildAnalysisPrompt } from './prompt-builder';

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

export interface GeneratedMessage {
  message: string;
  subject?: string;
  characterCount: number;
}

export interface LeadAnalysisResult {
  summary: string;
  opportunityTags: string[];
  recommendedPlatform: string;
  recommendedTone: string;
}

export async function generateOutreachMessage(
  lead: LeadContext,
  business: BusinessProfileContext,
  platform: string,
  tone: string,
  language: string,
  length: string
): Promise<GeneratedMessage> {
  const prompt = buildOutreachPrompt(lead, business, platform, tone, language, length);
  const raw = await generateWithRetry(prompt);

  const isEmail = platform === 'email';
  let message = raw.trim();
  let subject: string | undefined;

  if (isEmail && message.startsWith('Subject:')) {
    const lines = message.split('\n');
    subject = lines[0].replace('Subject:', '').trim();
    message = lines.slice(1).join('\n').trim();
  }

  return {
    message,
    subject,
    characterCount: message.length,
  };
}

export async function generateLeadAnalysis(
  lead: LeadContext
): Promise<LeadAnalysisResult> {
  const prompt = buildAnalysisPrompt(lead);
  const raw = await generateWithRetry(prompt);

  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        summary: parsed.summary || '',
        opportunityTags: Array.isArray(parsed.opportunityTags) ? parsed.opportunityTags : [],
        recommendedPlatform: parsed.recommendedPlatform || 'email',
        recommendedTone: parsed.recommendedTone || 'professional',
      };
    }
  } catch {
    // Fall through to default
  }

  return {
    summary: raw.trim().substring(0, 500),
    opportunityTags: ['needs_analysis'],
    recommendedPlatform: 'email',
    recommendedTone: 'professional',
  };
}
