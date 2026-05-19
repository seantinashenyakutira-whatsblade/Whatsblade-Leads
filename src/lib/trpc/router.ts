import { router } from '@/lib/trpc/init';
import { authRouter } from '@/lib/trpc/routers/auth';
import { leadsRouter } from '@/lib/trpc/routers/leads';
import { campaignsRouter } from '@/lib/trpc/routers/campaigns';
import { messagesRouter } from '@/lib/trpc/routers/messages';
import { activityRouter } from '@/lib/trpc/routers/activity';
import { apiKeysRouter } from '@/lib/trpc/routers/api-keys';
import { webhooksRouter } from '@/lib/trpc/routers/webhooks';
import { exportRouter } from '@/lib/trpc/routers/export';
import { settingsRouter } from '@/lib/trpc/routers/settings';
import { discoverRouter } from '@/lib/trpc/routers/discover';
import { outreachRouter } from '@/lib/trpc/routers/outreach';
import { enrichmentRouter } from '@/lib/trpc/routers/enrichment';
import { notesRouter } from '@/lib/trpc/routers/notes';
import { remindersRouter } from '@/lib/trpc/routers/reminders';
import { filtersRouter } from '@/lib/trpc/routers/filters';
import { adminRouter } from '@/lib/trpc/routers/admin';
import { integrationsRouter } from '@/lib/trpc/routers/integrations';

export const appRouter = router({
  auth: authRouter,
  leads: leadsRouter,
  campaigns: campaignsRouter,
  messages: messagesRouter,
  activity: activityRouter,
  apiKeys: apiKeysRouter,
  webhooks: webhooksRouter,
  export: exportRouter,
  settings: settingsRouter,
  discover: discoverRouter,
  outreach: outreachRouter,
  enrichment: enrichmentRouter,
  notes: notesRouter,
  reminders: remindersRouter,
  filters: filtersRouter,
  admin: adminRouter,
  integrations: integrationsRouter,
});

export type AppRouter = typeof appRouter;
