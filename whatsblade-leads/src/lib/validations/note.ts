import { z } from 'zod';

export const noteSchema = z.object({
  leadId: z.string().uuid(),
  content: z.string().min(1).max(10000),
  attachments: z.array(z.object({
    name: z.string(),
    url: z.string(),
    size: z.number(),
    type: z.string(),
  })).optional().default([]),
});

export type NoteInput = z.infer<typeof noteSchema>;
