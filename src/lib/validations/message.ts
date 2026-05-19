import { z } from 'zod';

export const sendMessageSchema = z.object({
  leadId: z.string().uuid('Valid lead ID is required'),
  campaignId: z.string().uuid().optional().nullable(),
  channel: z.enum(['email', 'sms', 'whatsapp', 'linkedin']),
  subject: z.string().max(500).optional().or(z.literal('')),
  body: z.string().min(1, 'Message body is required').max(50000),
});

export const messageFilterSchema = z.object({
  leadId: z.string().uuid().optional(),
  campaignId: z.string().uuid().optional(),
  sentBy: z.string().uuid().optional(),
  channel: z.enum(['email', 'sms', 'whatsapp', 'linkedin']).optional(),
  status: z.enum(['pending', 'sent', 'delivered', 'failed', 'bounced']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const trackMessageSchema = z.object({
  messageId: z.string().uuid(),
  status: z.enum(['sent', 'delivered', 'failed', 'bounced']),
  metadata: z.record(z.unknown()).optional(),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type MessageFilterInput = z.infer<typeof messageFilterSchema>;
export type TrackMessageInput = z.infer<typeof trackMessageSchema>;
