import { z } from 'zod';

export const generateMessageSchema = z.object({
  leadId: z.string().uuid(),
  platform: z.enum(['whatsapp', 'instagram', 'facebook', 'email', 'sms', 'linkedin']),
  tone: z.enum(['friendly', 'professional', 'bold', 'consultative']),
  language: z.string().default('English'),
  length: z.enum(['short', 'medium', 'long']).default('medium'),
});

export const businessProfileSchema = z.object({
  businessName: z.string().min(1, 'Business name is required'),
  services: z.array(z.string()).min(1, 'At least one service is required'),
  pricingInfo: z.string().optional(),
  offerText: z.string().optional(),
  location: z.string().optional(),
  baseCurrency: z.string().default('ZMW'),
});

export const messageTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  platform: z.enum(['whatsapp', 'instagram', 'facebook', 'email', 'sms', 'linkedin']),
  tone: z.string(),
  language: z.string(),
  body: z.string().min(1, 'Message body is required'),
  variables: z.array(z.string()).default([]),
});

export const saveOutreachSchema = z.object({
  leadId: z.string().uuid(),
  platform: z.enum(['whatsapp', 'instagram', 'facebook', 'email', 'sms', 'linkedin']),
  body: z.string().min(1, 'Message body is required'),
  subject: z.string().optional(),
  campaignId: z.string().uuid().optional().nullable(),
  aiGenerated: z.boolean().default(false),
  templateId: z.string().uuid().optional().nullable(),
});

export const updateMessageStatusSchema = z.object({
  messageId: z.string().uuid(),
  status: z.enum(['sent', 'replied', 'no_response']),
});

export const bulkGenerateSchema = z.object({
  leadIds: z.array(z.string().uuid()).min(1, 'At least one lead is required'),
  platform: z.enum(['whatsapp', 'instagram', 'facebook', 'email', 'sms', 'linkedin']),
  tone: z.enum(['friendly', 'professional', 'bold', 'consultative']),
  language: z.string().default('English'),
  length: z.enum(['short', 'medium', 'long']).default('medium'),
  campaignId: z.string().uuid().optional(),
});

export type GenerateMessageInput = z.infer<typeof generateMessageSchema>;
export type BusinessProfileInput = z.infer<typeof businessProfileSchema>;
export type MessageTemplateInput = z.infer<typeof messageTemplateSchema>;
export type SaveOutreachInput = z.infer<typeof saveOutreachSchema>;
export type UpdateMessageStatusInput = z.infer<typeof updateMessageStatusSchema>;
export type BulkGenerateInput = z.infer<typeof bulkGenerateSchema>;
