import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { router, rateLimitedProcedure } from '@/lib/trpc/init';
import { discoverFilterSchema, saveDiscoveredLeadSchema } from '@/lib/validations/discover';
import { logActivity } from '@/lib/audit';

export const discoverRouter = router({
  search: rateLimitedProcedure
    .input(discoverFilterSchema)
    .query(async ({ input }) => {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

      const response = await fetch(`${appUrl}/api/search/combined`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          industry: input.industry,
          country: input.country,
          city: input.city,
          radius: input.radius,
          filters: {
            noWebsiteOnly: input.noWebsiteOnly,
            hasPhone: input.hasPhone,
            hasEmail: input.hasEmail,
            hasSocialMedia: input.hasSocialMedia,
            minRating: input.minRating,
          },
          maxResults: input.maxResults,
          page: input.page,
          sortBy: input.sortBy,
          sortOrder: input.sortOrder,
        }),
      });

      if (!response.ok) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Search failed' });
      }

      return response.json();
    }),

  saveToLeads: rateLimitedProcedure
    .input(z.object({
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
    }))
    .mutation(async ({ ctx, input }) => {
      const inserts = input.leads.map((lead) => ({
        company: lead.name,
        first_name: null,
        last_name: null,
        email: lead.email || null,
        phone: lead.phone || null,
        website: lead.website || null,
        address: lead.address || null,
        city: lead.city || null,
        country: lead.country || null,
        latitude: lead.latitude,
        longitude: lead.longitude,
        google_rating: lead.googleRating,
        google_review_count: lead.googleReviewCount,
        social_media: lead.socialMedia,
        lead_score: lead.leadScore,
        source_platform: lead.source,
        industry: lead.industry || null,
        photos: lead.photos,
        opening_hours: lead.openingHours,
        price_level: lead.priceLevel,
        google_place_id: lead.googlePlaceId,
        facebook_page_id: lead.facebookPageId,
        status: 'new' as const,
        source: 'discovered',
        notes: `Discovered via ${lead.source} search. Lead score: ${lead.leadScore}`,
        created_by: ctx.user.id,
      }));

      const { data, error } = await ctx.supabaseAdmin
        .from('leads')
        .insert(inserts)
        .select('id');

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

      await logActivity({
        userId: ctx.user.id,
        action: 'lead.discovered',
        entityType: 'lead',
        entityId: data?.[0]?.id || null,
        metadata: { count: inserts.length, source: input.leads[0]?.source },
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      });

      return { saved: data?.length || 0 };
    }),

  bulkSave: rateLimitedProcedure
    .input(saveDiscoveredLeadSchema)
    .mutation(async ({ ctx, input }) => {
      const inserts = input.leads.map((lead) => ({
        company: lead.name,
        first_name: null,
        last_name: null,
        email: lead.email || null,
        phone: lead.phone || null,
        website: lead.website || null,
        address: lead.address || null,
        city: lead.city || null,
        country: lead.country || null,
        latitude: lead.latitude,
        longitude: lead.longitude,
        google_rating: lead.googleRating,
        google_review_count: lead.googleReviewCount,
        social_media: lead.socialMedia,
        lead_score: lead.leadScore,
        source_platform: lead.source,
        industry: lead.industry || null,
        photos: lead.photos,
        opening_hours: lead.openingHours,
        price_level: lead.priceLevel,
        google_place_id: lead.googlePlaceId,
        facebook_page_id: lead.facebookPageId,
        status: 'new' as const,
        source: 'discovered',
        notes: `Discovered via ${lead.source} search. Lead score: ${lead.leadScore}`,
        created_by: ctx.user.id,
      }));

      const { data, error } = await ctx.supabaseAdmin
        .from('leads')
        .insert(inserts)
        .select('id');

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

      let addedToCampaign = 0;
      if (input.campaignId && data?.length) {
        const campaignLeads = data.map((lead: { id: string }) => ({
          campaign_id: input.campaignId,
          lead_id: lead.id,
        }));
        const { error: campaignError } = await ctx.supabaseAdmin
          .from('campaign_leads')
          .insert(campaignLeads);
        if (!campaignError) addedToCampaign = campaignLeads.length;
      }

      await logActivity({
        userId: ctx.user.id,
        action: 'lead.bulk_discovered',
        entityType: 'lead',
        entityId: data?.[0]?.id || null,
        metadata: { count: inserts.length, campaignId: input.campaignId },
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      });

      return { saved: data?.length || 0, addedToCampaign };
    }),
});
