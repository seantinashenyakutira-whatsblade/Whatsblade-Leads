import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { router, protectedProcedure, rateLimitedProcedure } from '@/lib/trpc/init';
import { runEnrichment } from '@/lib/enrichment/engine';

export const enrichmentRouter = router({
  runEnrichment: rateLimitedProcedure
    .input(z.object({ leadId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { data: lead } = await ctx.supabaseAdmin
        .from('leads')
        .select('assigned_to, created_by')
        .eq('id', input.leadId)
        .single();

      if (!lead) throw new TRPCError({ code: 'NOT_FOUND', message: 'Lead not found' });

      if (ctx.user.role !== 'admin' && lead.assigned_to !== ctx.user.id && lead.created_by !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
      }

      const result = await runEnrichment(input.leadId, ctx.user.id);

      return result;
    }),

  getEnrichmentStatus: protectedProcedure
    .input(z.object({ leadId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { data: lead } = await ctx.supabaseAdmin
        .from('leads')
        .select('last_enriched_at')
        .eq('id', input.leadId)
        .single();

      if (!lead) throw new TRPCError({ code: 'NOT_FOUND', message: 'Lead not found' });

      const lastEnrichedAt = lead.last_enriched_at;
      const daysSince = lastEnrichedAt
        ? Math.floor((Date.now() - new Date(lastEnrichedAt).getTime()) / (1000 * 60 * 60 * 24))
        : null;

      const { data: stages } = await ctx.supabaseAdmin
        .from('lead_enrichment_log')
        .select('stage, status, created_at')
        .eq('lead_id', input.leadId)
        .order('created_at', { ascending: false })
        .limit(4);

      return {
        lastEnrichedAt,
        daysSince,
        isStale: daysSince === null || daysSince >= 7,
        stages: stages || [],
      };
    }),

  getEnrichmentLog: protectedProcedure
    .input(z.object({ leadId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { data: lead } = await ctx.supabaseAdmin
        .from('leads')
        .select('assigned_to, created_by')
        .eq('id', input.leadId)
        .single();

      if (!lead) throw new TRPCError({ code: 'NOT_FOUND', message: 'Lead not found' });

      if (ctx.user.role !== 'admin' && lead.assigned_to !== ctx.user.id && lead.created_by !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
      }

      const { data, error } = await ctx.supabaseAdmin
        .from('lead_enrichment_log')
        .select('*')
        .eq('lead_id', input.leadId)
        .order('created_at', { ascending: false });

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

      return data || [];
    }),

  getLeadIntelligence: protectedProcedure
    .input(z.object({ leadId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { data: lead } = await ctx.supabaseAdmin
        .from('leads')
        .select('*')
        .eq('id', input.leadId)
        .single();

      if (!lead) throw new TRPCError({ code: 'NOT_FOUND', message: 'Lead not found' });

      if (ctx.user.role !== 'admin' && lead.assigned_to !== ctx.user.id && lead.created_by !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
      }

      // Calculate social presence score
      let socialScore = 0;
      if (lead.facebook_followers) socialScore += Math.min(30, lead.facebook_followers / 100);
      if (lead.instagram_url) socialScore += 20;
      if (lead.whatsapp_available) socialScore += 15;
      if (lead.social_media && Object.keys(lead.social_media as Record<string, unknown>).length > 0) socialScore += 15;
      if (lead.google_review_count && lead.google_review_count > 0) socialScore += 10;
      if (lead.website) socialScore += 10;
      socialScore = Math.min(100, Math.round(socialScore));

      // Update social presence score if different
      if (lead.social_presence_score !== socialScore) {
        await ctx.supabaseAdmin
          .from('leads')
          .update({ social_presence_score: socialScore })
          .eq('id', input.leadId);
      }

      return {
        leadId: lead.id,
        lastEnrichedAt: lead.last_enriched_at,
        instagramUrl: lead.instagram_url,
        instagramFollowers: lead.instagram_followers,
        instagramVerified: lead.instagram_verified,
        facebookFollowers: lead.facebook_followers,
        facebookLastPostDate: lead.facebook_last_post_date,
        whatsappAvailable: lead.whatsapp_available,
        websiteStatus: lead.website_status,
        hasBookingSystem: lead.has_booking_system,
        isMobileResponsive: lead.is_mobile_responsive,
        websiteQualityScore: lead.website_quality_score,
        socialPresenceScore: socialScore,
        aiSummary: lead.ai_summary,
        opportunityTags: lead.opportunity_tags || [],
        photos: lead.photos || [],
        openingHours: lead.opening_hours || {},
        googleRating: lead.google_rating,
        googleReviewCount: lead.google_review_count,
      };
    }),
});
