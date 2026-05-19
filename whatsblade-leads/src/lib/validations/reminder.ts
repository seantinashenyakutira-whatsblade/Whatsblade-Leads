import { z } from 'zod';

export const reminderSchema = z.object({
  leadId: z.string().uuid(),
  action: z.string().min(1).max(500),
  remindAt: z.string().datetime(),
});

export type ReminderInput = z.infer<typeof reminderSchema>;
