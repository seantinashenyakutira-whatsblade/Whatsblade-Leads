import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { router, protectedProcedure, rateLimitedProcedure } from '@/lib/trpc/init';
import {
  generateMessageSchema,
  businessProfileSchema,
  messageTemplateSchema,
  saveOutreachSchema,
  updateMessageStatusSchema,
  bulkGenerateSchema,
} from '@/lib/validations/outreach';
import { generateOutreachMessage, generateLeadAnalysis } from '@/lib/ai/message-generator';
import { logActivity } from '@/lib/audit';

function mapLeadToContext(lead: Record<string, unknown>) {
  return {
    name: (lead.company as string) || `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Unknown',
    industry: (lead.industry as string) || null,
    city: (lead.city as string) || null,
    country: (lead.country as string) || null,
    phone: (lead.phone as string) || null,
    email: (lead.email as string) || null,
    website: (lead.website as string) || null,
    googleRating: (lead.google_rating as number) || null,
    googleReviewCount: (lead.google_review_count as number) || null,
    socialMedia: (lead.social_media as Record<string, string>) || {},
    leadScore: (lead.lead_score as number) || 0,
    source: (lead.source_platform as string) || 'manual',
    notes: (lead.notes as string) || null,
  };
}

function mapProfileToContext(profile: Record<string, unknown> | null) {
  if (!profile) {
    return {
      businessName: 'Your Business',
      services: ['Digital services'],
      pricingInfo: null,
      offerText: null,
      location: null,
      baseCurrency: 'ZMW',
    };
  }
  return {
    businessName: (profile.business_name as string) || 'Your Business',
    services: (profile.services as string[]) || ['Digital services'],
    pricingInfo: (profile.pricing_info as string) || null,
    offerText: (profile.offer_text as string) || null,
    location: (profile.location as string) || null,
    baseCurrency: (profile.base_currency as string) || 'ZMW',
  };
}

export const outreachRouter = router({
  getBusinessProfile: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabaseAdmin
      .from('business_profiles')
      .select('*')
      .eq('user_id', ctx.user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
    }
    return data;
  }),

  updateBusinessProfile: rateLimitedProcedure
    .input(businessProfileSchema)
    .mutation(async ({ ctx, input }) => {
      const { data: existing } = await ctx.supabaseAdmin
        .from('business_profiles')
        .select('id')
        .eq('user_id', ctx.user.id)
        .single();

      const payload = {
        user_id: ctx.user.id,
        business_name: input.businessName,
        services: input.services,
        pricing_info: input.pricingInfo || null,
        offer_text: input.offerText || null,
        location: input.location || null,
        base_currency: input.baseCurrency,
      };

      let result;
      if (existing) {
        result = await ctx.supabaseAdmin
          .from('business_profiles')
          .update(payload)
          .eq('id', existing.id)
          .select()
          .single();
      } else {
        result = await ctx.supabaseAdmin
          .from('business_profiles')
          .insert(payload)
          .select()
          .single();
      }

      if (result.error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: result.error.message });

      await logActivity({
        userId: ctx.user.id,
        action: 'business_profile.updated',
        entityType: 'business_profile',
        entityId: result.data.id,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      });

      return result.data;
    }),

  generateMessage: rateLimitedProcedure
    .input(generateMessageSchema)
    .mutation(async ({ ctx, input }) => {
      const { data: lead } = await ctx.supabaseAdmin
        .from('leads')
        .select('*')
        .eq('id', input.leadId)
        .single();

      if (!lead) throw new TRPCError({ code: 'NOT_FOUND', message: 'Lead not found' });

      if (ctx.user.role !== 'admin' && lead.assigned_to !== ctx.user.id && lead.created_by !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'You do not have access to this lead' });
      }

      const { data: profile } = await ctx.supabaseAdmin
        .from('business_profiles')
        .select('*')
        .eq('user_id', ctx.user.id)
        .single();

      const leadContext = mapLeadToContext(lead);
      const businessContext = mapProfileToContext(profile);

      const result = await generateOutreachMessage(
        leadContext,
        businessContext,
        input.platform,
        input.tone,
        input.language,
        input.length
      );

      return result;
    }),

  regenerateMessage: rateLimitedProcedure
    .input(generateMessageSchema)
    .mutation(async ({ ctx, input }) => {
      const { data: lead } = await ctx.supabaseAdmin
        .from('leads')
        .select('*')
        .eq('id', input.leadId)
        .single();

      if (!lead) throw new TRPCError({ code: 'NOT_FOUND', message: 'Lead not found' });

      const { data: profile } = await ctx.supabaseAdmin
        .from('business_profiles')
        .select('*')
        .eq('user_id', ctx.user.id)
        .single();

      const leadContext = mapLeadToContext(lead);
      const businessContext = mapProfileToContext(profile);

      return await generateOutreachMessage(
        leadContext,
        businessContext,
        input.platform,
        input.tone,
        input.language,
        input.length
      );
    }),

  saveOutreach: rateLimitedProcedure
    .input(saveOutreachSchema)
    .mutation(async ({ ctx, input }) => {
      const { data: lead } = await ctx.supabaseAdmin
        .from('leads')
        .select('*')
        .eq('id', input.leadId)
        .single();

      if (!lead) throw new TRPCError({ code: 'NOT_FOUND', message: 'Lead not found' });

      const { data, error } = await ctx.supabaseAdmin
        .from('messages')
        .insert({
          lead_id: input.leadId,
          campaign_id: input.campaignId || null,
          sent_by: ctx.user.id,
          channel: input.platform,
          platform: input.platform,
          subject: input.subject || null,
          body: input.body,
          status: 'pending',
          ai_generated: input.aiGenerated,
          character_count: input.body.length,
          template_id: input.templateId || null,
        })
        .select()
        .single();

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

      await logActivity({
        userId: ctx.user.id,
        action: 'outreach.saved',
        entityType: 'message',
        entityId: data.id,
        metadata: { leadId: input.leadId, platform: input.platform, aiGenerated: input.aiGenerated },
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      });

      return data;
    }),

  getLeadHistory: protectedProcedure
    .input(z.object({ leadId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { data: lead } = await ctx.supabaseAdmin
        .from('leads')
        .select('id, assigned_to, created_by')
        .eq('id', input.leadId)
        .single();

      if (!lead) throw new TRPCError({ code: 'NOT_FOUND', message: 'Lead not found' });

      if (ctx.user.role !== 'admin' && lead.assigned_to !== ctx.user.id && lead.created_by !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'You do not have access to this lead' });
      }

      const { data: messages, error } = await ctx.supabaseAdmin
        .from('messages')
        .select('*')
        .eq('lead_id', input.leadId)
        .order('created_at', { ascending: false });

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

      const lastContact = messages?.length ? messages[0].created_at : null;
      const daysSinceLastContact = lastContact
        ? Math.floor((Date.now() - new Date(lastContact).getTime()) / (1000 * 60 * 60 * 24))
        : null;

      return {
        messages: messages ?? [],
        lastContact,
        daysSinceLastContact,
      };
    }),

  updateMessageStatus: rateLimitedProcedure
    .input(updateMessageStatusSchema)
    .mutation(async ({ ctx, input }) => {
      const { data: message } = await ctx.supabaseAdmin
        .from('messages')
        .select('lead_id')
        .eq('id', input.messageId)
        .single();

      if (!message) throw new TRPCError({ code: 'NOT_FOUND', message: 'Message not found' });

      const { data: lead } = await ctx.supabaseAdmin
        .from('leads')
        .select('assigned_to, created_by')
        .eq('id', message.lead_id)
        .single();

      if (ctx.user.role !== 'admin' && lead?.assigned_to !== ctx.user.id && lead?.created_by !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'You do not have access to this message' });
      }

      const updates: Record<string, unknown> = {};

      if (input.status === 'sent') {
        updates.status = 'sent';
        updates.sent_at = new Date().toISOString();
      } else if (input.status === 'replied') {
        updates.status = 'delivered';
        updates.replied_at = new Date().toISOString();
      } else if (input.status === 'no_response') {
        updates.status = 'delivered';
      }

      const { data, error } = await ctx.supabaseAdmin
        .from('messages')
        .update(updates)
        .eq('id', input.messageId)
        .select()
        .single();

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

      await logActivity({
        userId: ctx.user.id,
        action: `message.status.${input.status}`,
        entityType: 'message',
        entityId: input.messageId,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      });

      return data;
    }),

  generateBulkMessages: rateLimitedProcedure
    .input(bulkGenerateSchema)
    .mutation(async ({ ctx, input }) => {
      const { data: profile } = await ctx.supabaseAdmin
        .from('business_profiles')
        .select('*')
        .eq('user_id', ctx.user.id)
        .single();

      const businessContext = mapProfileToContext(profile);

      const results: Array<{
        leadId: string;
        leadName: string;
        message: string;
        subject?: string;
        characterCount: number;
        error?: string;
      }> = [];

      for (const leadId of input.leadIds) {
        const { data: lead } = await ctx.supabaseAdmin
          .from('leads')
          .select('*')
          .eq('id', leadId)
          .single();

        if (!lead) {
          results.push({ leadId, leadName: 'Unknown', message: '', characterCount: 0, error: 'Lead not found' });
          continue;
        }

        const leadContext = mapLeadToContext(lead);
        const leadName = leadContext.name;

        try {
          const generated = await generateOutreachMessage(
            leadContext,
            businessContext,
            input.platform,
            input.tone,
            input.language,
            input.length
          );
          results.push({
            leadId,
            leadName,
            message: generated.message,
            subject: generated.subject,
            characterCount: generated.characterCount,
          });
        } catch (err: unknown) {
          results.push({
            leadId,
            leadName,
            message: '',
            characterCount: 0,
            error: err instanceof Error ? err.message : 'Generation failed',
          });
        }
      }

      return results;
    }),

  getCampaignStats: protectedProcedure
    .input(z.object({ campaignId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { data: campaign } = await ctx.supabaseAdmin
        .from('campaigns')
        .select('created_by')
        .eq('id', input.campaignId)
        .single();

      if (!campaign) throw new TRPCError({ code: 'NOT_FOUND', message: 'Campaign not found' });

      if (ctx.user.role !== 'admin' && campaign.created_by !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'You do not have access to this campaign' });
      }

      const { data: messages } = await ctx.supabaseAdmin
        .from('messages')
        .select('status, replied_at')
        .eq('campaign_id', input.campaignId);

      const total = messages?.length || 0;
      const sent = messages?.filter((m) => m.status === 'sent').length || 0;
      const replied = messages?.filter((m) => m.status === 'delivered' && m.replied_at).length || 0;

      return {
        total,
        sent,
        replied,
        noResponse: total - sent - replied,
        replyRate: total > 0 ? ((replied / total) * 100).toFixed(1) : '0',
      };
    }),

  listTemplates: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabaseAdmin
      .from('message_templates')
      .select('*')
      .eq('user_id', ctx.user.id)
      .order('created_at', { ascending: false });

    if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
    return data ?? [];
  }),

  createTemplate: rateLimitedProcedure
    .input(messageTemplateSchema)
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabaseAdmin
        .from('message_templates')
        .insert({
          user_id: ctx.user.id,
          name: input.name,
          platform: input.platform,
          tone: input.tone,
          language: input.language,
          body: input.body,
          variables: input.variables,
        })
        .select()
        .single();

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

      await logActivity({
        userId: ctx.user.id,
        action: 'template.created',
        entityType: 'message_template',
        entityId: data.id,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      });

      return data;
    }),

  deleteTemplate: rateLimitedProcedure
    .input(z.object({ templateId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { data: template } = await ctx.supabaseAdmin
        .from('message_templates')
        .select('user_id')
        .eq('id', input.templateId)
        .single();

      if (!template) throw new TRPCError({ code: 'NOT_FOUND', message: 'Template not found' });

      if (template.user_id !== ctx.user.id && ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'You do not own this template' });
      }

      const { error } = await ctx.supabaseAdmin
        .from('message_templates')
        .delete()
        .eq('id', input.templateId);

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

      return { success: true };
    }),

  applyTemplate: rateLimitedProcedure
    .input(z.object({
      templateId: z.string().uuid(),
      leadId: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { data: template } = await ctx.supabaseAdmin
        .from('message_templates')
        .select('*')
        .eq('id', input.templateId)
        .single();

      if (!template) throw new TRPCError({ code: 'NOT_FOUND', message: 'Template not found' });

      const { data: lead } = await ctx.supabaseAdmin
        .from('leads')
        .select('*')
        .eq('id', input.leadId)
        .single();

      if (!lead) throw new TRPCError({ code: 'NOT_FOUND', message: 'Lead not found' });

      let body = template.body as string;
      const leadContext = mapLeadToContext(lead);

      const replacements: Record<string, string> = {
        '{{businessName}}': leadContext.name,
        '{{industry}}': leadContext.industry || 'your industry',
        '{{city}}': leadContext.city || 'your city',
        '{{country}}': leadContext.country || 'your country',
        '{{name}}': leadContext.name,
      };

      for (const [key, value] of Object.entries(replacements)) {
        body = body.replace(new RegExp(key, 'g'), value);
      }

      return {
        body,
        platform: template.platform,
        subject: template.tone === 'email' ? undefined : undefined,
      };
    }),

  analyzeLead: rateLimitedProcedure
    .input(z.object({ leadId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { data: lead } = await ctx.supabaseAdmin
        .from('leads')
        .select('*')
        .eq('id', input.leadId)
        .single();

      if (!lead) throw new TRPCError({ code: 'NOT_FOUND', message: 'Lead not found' });

      if (ctx.user.role !== 'admin' && lead.assigned_to !== ctx.user.id && lead.created_by !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'You do not have access to this lead' });
      }

      const leadContext = mapLeadToContext(lead);
      const analysis = await generateLeadAnalysis(leadContext);

      const { data: existing } = await ctx.supabaseAdmin
        .from('lead_analysis')
        .select('id')
        .eq('lead_id', input.leadId)
        .single();

      let result;
      if (existing) {
        result = await ctx.supabaseAdmin
          .from('lead_analysis')
          .update({
            summary: analysis.summary,
            opportunity_tags: analysis.opportunityTags,
            recommended_platform: analysis.recommendedPlatform,
            recommended_tone: analysis.recommendedTone,
          })
          .eq('lead_id', input.leadId)
          .select()
          .single();
      } else {
        result = await ctx.supabaseAdmin
          .from('lead_analysis')
          .insert({
            lead_id: input.leadId,
            summary: analysis.summary,
            opportunity_tags: analysis.opportunityTags,
            recommended_platform: analysis.recommendedPlatform,
            recommended_tone: analysis.recommendedTone,
          })
          .select()
          .single();
      }

      if (result.error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: result.error.message });

      await logActivity({
        userId: ctx.user.id,
        action: 'lead.analyzed',
        entityType: 'lead',
        entityId: input.leadId,
        metadata: { tags: analysis.opportunityTags },
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      });

      return result.data;
    }),

  getLeadAnalysis: protectedProcedure
    .input(z.object({ leadId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { data: lead } = await ctx.supabaseAdmin
        .from('leads')
        .select('assigned_to, created_by')
        .eq('id', input.leadId)
        .single();

      if (!lead) throw new TRPCError({ code: 'NOT_FOUND', message: 'Lead not found' });

      if (ctx.user.role !== 'admin' && lead.assigned_to !== ctx.user.id && lead.created_by !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'You do not have access to this lead' });
      }

      const { data, error } = await ctx.supabaseAdmin
        .from('lead_analysis')
        .select('*')
        .eq('lead_id', input.leadId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      }

      return data;
    }),
});
