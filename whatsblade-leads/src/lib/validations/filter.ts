import { z } from 'zod';

export const savedFilterSchema = z.object({
  name: z.string().min(1).max(100),
  filterConfig: z.record(z.unknown()),
  isDefault: z.boolean().optional().default(false),
});

export type SavedFilterInput = z.infer<typeof savedFilterSchema>;
