import { z } from 'zod';

export const campaignSchema = z.object({
  name: z.string().min(1, 'Campaign name is required').max(200),
  description: z.string().max(5000).optional().or(z.literal('')),
  scheduledAt: z.string().datetime().optional().nullable(),
  leadIds: z.array(z.string().uuid()).optional(),
});

export const campaignFilterSchema = z.object({
  search: z.string().optional(),
  status: z.enum(['draft', 'active', 'paused', 'completed']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const campaignActionSchema = z.object({
  id: z.string().uuid(),
  leadIds: z.array(z.string().uuid()).optional(),
});

export type CampaignInput = z.infer<typeof campaignSchema>;
export type CampaignFilterInput = z.infer<typeof campaignFilterSchema>;
export type CampaignActionInput = z.infer<typeof campaignActionSchema>;
