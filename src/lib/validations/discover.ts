import { z } from 'zod';

export const discoverFilterSchema = z.object({
  industry: z.string().optional(),
  country: z.string().length(2).optional(),
  city: z.string().optional(),
  radius: z.enum(['5', '10', '25', '50', '100']).default('25'),
  noWebsiteOnly: z.boolean().default(false),
  hasPhone: z.boolean().default(false),
  hasEmail: z.boolean().default(false),
  hasSocialMedia: z.boolean().default(false),
  minRating: z.number().min(0).max(5).optional(),
  maxResults: z.enum(['25', '50', '100']).default('25'),
  page: z.coerce.number().int().min(1).default(1),
  sortBy: z.enum(['leadScore', 'name', 'rating', 'city']).default('leadScore'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const saveDiscoveredLeadSchema = z.object({
  leads: z.array(z.object({
    id: z.string(),
    name: z.string(),
    industry: z.string().nullable(),
    address: z.string().nullable(),
    city: z.string().nullable(),
    country: z.string().nullable(),
    latitude: z.number().nullable(),
    longitude: z.number().nullable(),
    phone: z.string().nullable(),
    email: z.string().nullable(),
    website: z.string().nullable(),
    googleRating: z.number().nullable(),
    googleReviewCount: z.number().nullable(),
    socialMedia: z.record(z.string()),
    leadScore: z.number(),
    source: z.enum(['google', 'facebook', 'manual']),
    photos: z.array(z.string()),
    openingHours: z.record(z.unknown()),
    priceLevel: z.number().nullable(),
    googlePlaceId: z.string().nullable(),
    facebookPageId: z.string().nullable(),
  })),
  campaignId: z.string().uuid().optional().nullable(),
});

export type DiscoverFilterInput = z.infer<typeof discoverFilterSchema>;
export type SaveDiscoveredLeadInput = z.infer<typeof saveDiscoveredLeadSchema>;
