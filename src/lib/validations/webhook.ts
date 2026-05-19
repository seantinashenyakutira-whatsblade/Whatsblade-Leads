import { z } from 'zod';
import { EVENT_TYPES } from '@/lib/constants';

export const webhookSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  url: z.string().url('A valid URL is required'),
  events: z
    .array(z.enum(EVENT_TYPES as unknown as [string, ...string[]]))
    .min(1, 'At least one event must be selected'),
});

export type WebhookInput = z.infer<typeof webhookSchema>;
