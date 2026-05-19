import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { router, rateLimitedProcedure } from '@/lib/trpc/init';
import { exportToCSV, exportToExcel } from '@/lib/export';

const exportFilterSchema = z.object({
  leadIds: z.array(z.string().uuid()).optional(),
  status: z.enum(['new', 'contacted', 'replied', 'meeting_booked', 'proposal_sent', 'converted', 'lost']).optional(),
  industry: z.string().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  minLeadScore: z.number().int().min(0).max(100).optional(),
  maxLeadScore: z.number().int().min(0).max(100).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  hasPhone: z.boolean().optional(),
  hasEmail: z.boolean().optional(),
  hasSocial: z.boolean().optional(),
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyFilters(query: any, input: z.infer<typeof exportFilterSchema>, userId: string, isAdmin: boolean) {
  let q = query;

  if (!isAdmin) {
    q = q.or(`assigned_to.eq.${userId},created_by.eq.${userId}`);
  }

  if (input.leadIds && input.leadIds.length > 0) {
    q = q.in('id', input.leadIds);
  }
  if (input.status) q = q.eq('status', input.status);
  if (input.industry) q = q.eq('industry', input.industry);
  if (input.country) q = q.eq('country', input.country);
  if (input.city) q = q.eq('city', input.city);
  if (input.minLeadScore !== undefined) q = q.gte('lead_score', input.minLeadScore);
  if (input.maxLeadScore !== undefined) q = q.lte('lead_score', input.maxLeadScore);
  if (input.dateFrom) q = q.gte('created_at', input.dateFrom);
  if (input.dateTo) q = q.lte('created_at', input.dateTo);
  if (input.hasPhone === true) q = q.neq('phone', null).neq('phone', '');
  if (input.hasEmail === true) q = q.neq('email', null).neq('email', '');
  if (input.hasSocial === true) q = q.neq('social_media', '{}');

  return q;
}

export const exportRouter = router({
  leadsCSV: rateLimitedProcedure
    .input(exportFilterSchema)
    .query(async ({ ctx, input }) => {
      let query = ctx.supabaseAdmin.from('leads').select('*');
      query = applyFilters(query, input, ctx.user.id, ctx.user.role === 'admin');

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

      const csv = exportToCSV(data ?? []);
      return { csv, filename: `leads-export-${Date.now()}.csv` };
    }),

  leadsExcel: rateLimitedProcedure
    .input(exportFilterSchema)
    .query(async ({ ctx, input }) => {
      let query = ctx.supabaseAdmin.from('leads').select('*');
      query = applyFilters(query, input, ctx.user.id, ctx.user.role === 'admin');

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

      const buffer = exportToExcel(data ?? []);
      return { excel: Buffer.from(buffer).toString('base64'), filename: `leads-export-${Date.now()}.xlsx` };
    }),
});
