import { z } from 'zod';

export const apiKeySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  provider: z.string().min(1, 'Provider is required').max(50),
  keyValue: z.string().min(1, 'API key value is required'),
  expiresAt: z.string().datetime().optional().nullable(),
});

export type ApiKeyInput = z.infer<typeof apiKeySchema>;
