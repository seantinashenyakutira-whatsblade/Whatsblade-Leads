import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { router, protectedProcedure } from '@/lib/trpc/init';
import { preferencesSchema } from '@/lib/validations/settings';
import { logActivity } from '@/lib/audit';

export const settingsRouter = router({
  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabaseAdmin
      .from('user_preferences')
      .select('*')
      .eq('user_id', ctx.user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
    }
    return data;
  }),

  updatePreferences: protectedProcedure
    .input(preferencesSchema)
    .mutation(async ({ ctx, input }) => {
      const { data: existing } = await ctx.supabaseAdmin
        .from('user_preferences')
        .select('id')
        .eq('user_id', ctx.user.id)
        .single();

      const payload = {
        user_id: ctx.user.id,
        default_country: input.defaultCountry ?? null,
        default_currency: input.defaultCurrency,
        favourite_industries: input.favouriteIndustries,
        notification_email: input.notificationEmail,
        notification_inapp: input.notificationInapp,
        notification_slack: input.notificationSlack,
        notification_webhook: input.notificationWebhook,
        theme: input.theme,
      };

      let result;
      if (existing) {
        result = await ctx.supabaseAdmin
          .from('user_preferences')
          .update(payload)
          .eq('id', existing.id)
          .select()
          .single();
      } else {
        result = await ctx.supabaseAdmin
          .from('user_preferences')
          .insert(payload)
          .select()
          .single();
      }

      if (result.error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: result.error.message });

      await logActivity({
        userId: ctx.user.id,
        action: 'preferences.updated',
        entityType: 'user_preferences',
        entityId: result.data.id,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      });

      return result.data;
    }),

  updateTheme: protectedProcedure
    .input(z.object({ theme: z.enum(['dark', 'light', 'system']) }))
    .mutation(async ({ ctx, input }) => {
      const { data: existing } = await ctx.supabaseAdmin
        .from('user_preferences')
        .select('id')
        .eq('user_id', ctx.user.id)
        .single();

      let result;
      if (existing) {
        result = await ctx.supabaseAdmin
          .from('user_preferences')
          .update({ theme: input.theme })
          .eq('id', existing.id)
          .select()
          .single();
      } else {
        result = await ctx.supabaseAdmin
          .from('user_preferences')
          .insert({ user_id: ctx.user.id, theme: input.theme })
          .select()
          .single();
      }

      if (result.error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: result.error.message });
      return result.data;
    }),

  getNotifications: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('user_id', ctx.user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
    return data ?? [];
  }),

  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    const { count, error } = await ctx.supabaseAdmin
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', ctx.user.id)
      .eq('is_read', false);

    if (error) return 0;
    return count ?? 0;
  }),

  markNotificationRead: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabaseAdmin
        .from('notifications')
        .update({ is_read: true })
        .eq('id', input.id)
        .eq('user_id', ctx.user.id);

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      return { success: true };
    }),

  markAllNotificationsRead: protectedProcedure.mutation(async ({ ctx }) => {
    const { error } = await ctx.supabaseAdmin
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', ctx.user.id)
      .eq('is_read', false);

    if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
    return { success: true };
  }),

  getStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;
    const isAdmin = ctx.user.role === 'admin';
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const leadQuery = ctx.supabaseAdmin.from('leads').select('*', { count: 'exact', head: true });
    const contactedQuery = ctx.supabaseAdmin.from('leads').select('*', { count: 'exact', head: true })
      .gte('last_contacted_at', todayStart);
    const meetingsQuery = ctx.supabaseAdmin.from('leads').select('*', { count: 'exact', head: true })
      .eq('status', 'meeting_booked')
      .gte('created_at', weekStart);
    const wonQuery = ctx.supabaseAdmin.from('leads').select('*', { count: 'exact', head: true })
      .eq('status', 'converted')
      .gte('updated_at', monthStart);
    const revenueQuery = ctx.supabaseAdmin.from('leads').select('deal_value')
      .neq('status', 'lost');
    const topLeadsQuery = ctx.supabaseAdmin.from('leads').select('id, company, first_name, last_name, lead_score, status, industry')
      .order('lead_score', { ascending: false })
      .limit(5);
    const campaignQuery = ctx.supabaseAdmin.from('campaigns').select('*', { count: 'exact', head: true });
    const messageQuery = ctx.supabaseAdmin.from('messages').select('*', { count: 'exact', head: true });
    const campaignsQuery = ctx.supabaseAdmin.from('campaigns').select('id, name, status, created_at');

    if (!isAdmin) {
      leadQuery.or(`assigned_to.eq.${userId},created_by.eq.${userId}`);
      contactedQuery.or(`assigned_to.eq.${userId},created_by.eq.${userId}`);
      meetingsQuery.or(`assigned_to.eq.${userId},created_by.eq.${userId}`);
      wonQuery.or(`assigned_to.eq.${userId},created_by.eq.${userId}`);
      revenueQuery.or(`assigned_to.eq.${userId},created_by.eq.${userId}`);
      topLeadsQuery.or(`assigned_to.eq.${userId},created_by.eq.${userId}`);
      campaignQuery.eq('created_by', userId);
      messageQuery.eq('sent_by', userId);
      campaignsQuery.eq('created_by', userId);
    }

    const [
      { count: totalLeads },
      { count: contactedToday },
      { count: meetingsThisWeek },
      { count: closedWonThisMonth },
      { data: revenueData },
      { data: topLeads },
      { count: totalCampaigns },
      { count: totalMessages },
      { data: campaigns },
    ] = await Promise.all([
      leadQuery,
      contactedQuery,
      meetingsQuery,
      wonQuery,
      revenueQuery,
      topLeadsQuery,
      campaignQuery,
      messageQuery,
      campaignsQuery,
    ]);

    const revenuePipeline = (revenueData ?? []).reduce((sum, l) => sum + (Number(l.deal_value) || 0), 0);

    const campaignPerformance = (campaigns ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      status: c.status,
    }));

    return {
      totalLeads: totalLeads ?? 0,
      contactedToday: contactedToday ?? 0,
      meetingsThisWeek: meetingsThisWeek ?? 0,
      closedWonThisMonth: closedWonThisMonth ?? 0,
      revenuePipeline,
      totalCampaigns: totalCampaigns ?? 0,
      totalMessages: totalMessages ?? 0,
      topLeads: topLeads ?? [],
      campaignPerformance,
    };
  }),
});
