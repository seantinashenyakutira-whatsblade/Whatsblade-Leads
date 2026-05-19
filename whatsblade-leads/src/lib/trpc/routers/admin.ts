import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { router, adminProcedure } from '@/lib/trpc/init';
import { logActivity } from '@/lib/audit';

export const adminRouter = router({
  getStats: adminProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [
      { count: totalUsers },
      { count: activeUsers },
      { count: totalLeads },
      { count: totalCampaigns },
      { count: totalMessages },
      { count: newUsersThisMonth },
      { count: leadsThisWeek },
      { data: revenueData },
    ] = await Promise.all([
      ctx.supabaseAdmin.from('users').select('*', { count: 'exact', head: true }),
      ctx.supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).eq('is_active', true),
      ctx.supabaseAdmin.from('leads').select('*', { count: 'exact', head: true }),
      ctx.supabaseAdmin.from('campaigns').select('*', { count: 'exact', head: true }),
      ctx.supabaseAdmin.from('messages').select('*', { count: 'exact', head: true }),
      ctx.supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).gte('created_at', monthStart),
      ctx.supabaseAdmin.from('leads').select('*', { count: 'exact', head: true }).gte('created_at', weekStart),
      ctx.supabaseAdmin.from('leads').select('deal_value').neq('status', 'lost'),
    ]);

    const totalRevenue = (revenueData ?? []).reduce((sum, l) => sum + (Number(l.deal_value) || 0), 0);

    return {
      totalUsers: totalUsers ?? 0,
      activeUsers: activeUsers ?? 0,
      totalLeads: totalLeads ?? 0,
      totalCampaigns: totalCampaigns ?? 0,
      totalMessages: totalMessages ?? 0,
      totalRevenue,
      newUsersThisMonth: newUsersThisMonth ?? 0,
      leadsThisWeek: leadsThisWeek ?? 0,
    };
  }),

  getAgentPerformance: adminProcedure.query(async ({ ctx }) => {
    const { data: users, error: usersError } = await ctx.supabaseAdmin
      .from('users')
      .select('id, full_name, email, role, is_active');

    if (usersError) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: usersError.message });

    const agents = users ?? [];

    const results = await Promise.all(
      agents.map(async (user) => {
        const [
          { count: leadsAdded },
          { count: messagesSent },
          { count: meetingsBooked },
          { count: dealsClosed },
          { data: revenueData },
        ] = await Promise.all([
          ctx.supabaseAdmin.from('leads').select('*', { count: 'exact', head: true })
            .eq('created_by', user.id),
          ctx.supabaseAdmin.from('messages').select('*', { count: 'exact', head: true })
            .eq('sent_by', user.id),
          ctx.supabaseAdmin.from('leads').select('*', { count: 'exact', head: true })
            .eq('assigned_to', user.id).eq('status', 'meeting_booked'),
          ctx.supabaseAdmin.from('leads').select('*', { count: 'exact', head: true })
            .eq('assigned_to', user.id).eq('status', 'converted'),
          ctx.supabaseAdmin.from('leads').select('deal_value')
            .eq('assigned_to', user.id).eq('status', 'converted'),
        ]);

        const totalRevenue = (revenueData ?? []).reduce((sum, l) => sum + (Number(l.deal_value) || 0), 0);

        return {
          user_id: user.id,
          full_name: user.full_name,
          email: user.email,
          role: user.role,
          is_active: user.is_active,
          leads_added: leadsAdded ?? 0,
          messages_sent: messagesSent ?? 0,
          meetings_booked: meetingsBooked ?? 0,
          deals_closed: dealsClosed ?? 0,
          total_revenue: totalRevenue,
        };
      })
    );

    return results;
  }),

  getApiUsage: adminProcedure
    .input(z.object({
      days: z.coerce.number().int().min(1).max(90).default(30),
      provider: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const dateFrom = new Date(Date.now() - input.days * 24 * 60 * 60 * 1000).toISOString();

      let query = ctx.supabaseAdmin
        .from('api_usage_log')
        .select('*')
        .gte('created_at', dateFrom)
        .order('created_at', { ascending: false });

      if (input.provider) {
        query = query.eq('provider', input.provider);
      }

      const { data, error } = await query;
      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

      const dailyMap = new Map<string, Map<string, { total: number; success: number; failed: number; totalTime: number }>>();

      for (const log of data ?? []) {
        const date = new Date(log.created_at).toISOString().split('T')[0];
        const provider = log.provider;

        if (!dailyMap.has(date)) {
          dailyMap.set(date, new Map());
        }
        const dayProviders = dailyMap.get(date)!;
        if (!dayProviders.has(provider)) {
          dayProviders.set(provider, { total: 0, success: 0, failed: 0, totalTime: 0 });
        }
        const entry = dayProviders.get(provider)!;
        entry.total++;
        if (log.success) entry.success++;
        else entry.failed++;
        entry.totalTime += log.response_time_ms ?? 0;
      }

      const result: Array<{ date: string; provider: string; total_calls: number; successful_calls: number; failed_calls: number; avg_response_time_ms: number }> = [];

      for (const dateEntry of Array.from(dailyMap.entries())) {
        const [date, providers] = dateEntry;
        for (const providerEntry of Array.from(providers.entries())) {
          const [provider, stats] = providerEntry;
          result.push({
            date,
            provider,
            total_calls: stats.total,
            successful_calls: stats.success,
            failed_calls: stats.failed,
            avg_response_time_ms: stats.total > 0 ? Math.round(stats.totalTime / stats.total) : 0,
          });
        }
      }

      return result.sort((a, b) => b.date.localeCompare(a.date));
    }),

  getLeadSourceBreakdown: adminProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabaseAdmin
      .from('leads')
      .select('source_platform');

    if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

    const total = (data ?? []).length;
    const counts = new Map<string, number>();

    for (const lead of data ?? []) {
      const source = (lead.source_platform as string) || 'manual';
      counts.set(source, (counts.get(source) || 0) + 1);
    }

    return Array.from(counts.entries()).map(([source, count]) => ({
      source,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    })).sort((a, b) => b.count - a.count);
  }),

  getSystemHealth: adminProcedure.query(async ({ ctx }) => {
    const startTime = Date.now();
    let dbHealthy = true;
    let dbLatency = 0;

    try {
      const { error } = await ctx.supabaseAdmin.from('users').select('id').limit(1);
      dbLatency = Date.now() - startTime;
      dbHealthy = !error;
    } catch {
      dbHealthy = false;
      dbLatency = Date.now() - startTime;
    }

    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const [
      { count: totalApiKeys },
      { count: expiringSoon },
      { count: expired },
      { count: totalWebhooks },
      { count: activeWebhooks },
    ] = await Promise.all([
      ctx.supabaseAdmin.from('api_keys').select('*', { count: 'exact', head: true }),
      ctx.supabaseAdmin.from('api_keys').select('*', { count: 'exact', head: true })
        .not('expires_at', 'is', null)
        .lte('expires_at', sevenDaysFromNow)
        .gt('expires_at', now.toISOString()),
      ctx.supabaseAdmin.from('api_keys').select('*', { count: 'exact', head: true })
        .not('expires_at', 'is', null)
        .lte('expires_at', now.toISOString()),
      ctx.supabaseAdmin.from('webhooks').select('*', { count: 'exact', head: true }),
      ctx.supabaseAdmin.from('webhooks').select('*', { count: 'exact', head: true }).eq('is_active', true),
    ]);

    return {
      database: {
        status: dbHealthy ? 'healthy' as const : 'down' as const,
        latency_ms: dbLatency,
      },
      api_keys: {
        total: totalApiKeys ?? 0,
        expiring_soon: expiringSoon ?? 0,
        expired: expired ?? 0,
      },
      webhooks: {
        total: totalWebhooks ?? 0,
        active: activeWebhooks ?? 0,
        failing: (totalWebhooks ?? 0) - (activeWebhooks ?? 0),
      },
      queue_depth: 0,
      last_backup: null,
    };
  }),

  inviteUser: adminProcedure
    .input(z.object({
      email: z.string().email(),
      fullName: z.string().min(1),
      role: z.enum(['admin', 'agent']).default('agent'),
    }))
    .mutation(async ({ ctx, input }) => {
      const { data: existingUsers } = await ctx.supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', input.email);

      if (existingUsers && existingUsers.length > 0) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'User with this email already exists' });
      }

      await logActivity({
        userId: ctx.user.id,
        action: 'user.invited',
        entityType: 'user',
        metadata: { email: input.email, fullName: input.fullName, role: input.role },
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      });

      return {
        success: true,
        message: `Invitation sent to ${input.email}. They will be created as ${input.role} upon signup.`,
      };
    }),

  deactivateUser: adminProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      if (input.userId === ctx.user.id) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'You cannot deactivate your own account' });
      }

      const { data, error } = await ctx.supabaseAdmin
        .from('users')
        .update({ is_active: false })
        .eq('id', input.userId)
        .select()
        .single();

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

      await logActivity({
        userId: ctx.user.id,
        action: 'user.deactivated',
        entityType: 'user',
        entityId: input.userId,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      });

      return data;
    }),

  reactivateUser: adminProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabaseAdmin
        .from('users')
        .update({ is_active: true })
        .eq('id', input.userId)
        .select()
        .single();

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

      await logActivity({
        userId: ctx.user.id,
        action: 'user.reactivated',
        entityType: 'user',
        entityId: input.userId,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      });

      return data;
    }),
});
