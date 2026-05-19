import { z } from 'zod';

export const preferencesSchema = z.object({
  defaultCountry: z.string().nullable().optional(),
  defaultCurrency: z.string().default('ZMW'),
  favouriteIndustries: z.array(z.string()).default([]),
  notificationEmail: z.boolean().default(true),
  notificationInapp: z.boolean().default(true),
  notificationSlack: z.boolean().default(false),
  notificationWebhook: z.boolean().default(false),
  theme: z.enum(['dark', 'light', 'system']).default('system'),
});

export const integrationSchema = z.object({
  type: z.string().min(1),
  name: z.string().min(1).max(100),
  config: z.record(z.unknown()).default({}),
});

export type PreferencesInput = z.infer<typeof preferencesSchema>;
export type IntegrationInput = z.infer<typeof integrationSchema>;
