import { getSupabaseAdmin } from '@/lib/db/client';
import { logActivity } from '@/lib/audit';
import { enrichGoogle } from './google';
import { enrichSocial } from './social';
import { enrichWebsite } from './website';
import { enrichAI } from './ai';

interface EnrichmentStageResult {
  stage: string;
  status: 'success' | 'failed' | 'skipped';
  details: Record<string, unknown>;
  durationMs: number;
  updates: Record<string, unknown>;
}

interface EnrichmentResult {
  success: boolean;
  stages: EnrichmentStageResult[];
  totalDurationMs: number;
}

export async function runEnrichment(
  leadId: string,
  userId: string
): Promise<EnrichmentResult> {
  const supabaseAdmin = getSupabaseAdmin();
  const startTime = Date.now();

  const { data: lead } = await supabaseAdmin
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .single();

  if (!lead) {
    throw new Error('Lead not found');
  }

  const stages: EnrichmentStageResult[] = [];

  // Stage 1: Google Enrichment
  const googleResult = await runStage('google', async () => {
    if (!lead.google_place_id) {
      return { status: 'skipped' as const, details: { reason: 'No google_place_id' }, updates: {} };
    }
    return await enrichGoogle(lead);
  });
  stages.push(googleResult);

  // Stage 2: Social Media Detection
  const socialResult = await runStage('social', async () => {
    return await enrichSocial(lead);
  });
  stages.push(socialResult);

  // Stage 3: Website Analysis
  const websiteResult = await runStage('website', async () => {
    if (!lead.website) {
      return { status: 'skipped' as const, details: { reason: 'No website URL' }, updates: { website_status: 'none' } };
    }
    return await enrichWebsite(lead);
  });
  stages.push(websiteResult);

  // Merge all updates from stages 1-3 before AI
  const mergedUpdates: Record<string, unknown> = {};
  for (const stage of stages) {
    Object.assign(mergedUpdates, stage.updates);
  }

  // Update lead with merged data before AI stage
  if (Object.keys(mergedUpdates).length > 0) {
    await supabaseAdmin
      .from('leads')
      .update(mergedUpdates)
      .eq('id', leadId);

    // Refresh lead data for AI stage
    const { data: updatedLead } = await supabaseAdmin
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single();

    if (updatedLead) {
      Object.assign(lead, updatedLead);
    }
  }

  // Stage 4: AI Summary
  const aiResult = await runStage('ai', async () => {
    return await enrichAI(lead);
  });
  stages.push(aiResult);

  // Merge AI updates
  Object.assign(mergedUpdates, aiResult.updates);

  // Final update with all enrichment data
  mergedUpdates.last_enriched_at = new Date().toISOString();

  const { error: updateError } = await supabaseAdmin
    .from('leads')
    .update(mergedUpdates)
    .eq('id', leadId);

  if (updateError) {
    console.error('[ENRICHMENT] Failed to update lead:', updateError.message);
  }

  // Log activity
  await logActivity({
    userId,
    action: 'lead.enriched',
    entityType: 'lead',
    entityId: leadId,
    metadata: {
      stages: stages.map((s) => ({ stage: s.stage, status: s.status })),
      totalDurationMs: Date.now() - startTime,
    },
  });

  const totalDurationMs = Date.now() - startTime;

  return {
    success: !updateError,
    stages,
    totalDurationMs,
  };
}

async function runStage(
  stage: string,
  fn: () => Promise<{ status: 'success' | 'skipped' | 'failed'; details: Record<string, unknown>; updates: Record<string, unknown> }>
): Promise<EnrichmentStageResult> {
  const supabaseAdmin = getSupabaseAdmin();
  const start = Date.now();

  try {
    const result = await fn();
    const durationMs = Date.now() - start;

    // Log to enrichment log table
    await supabaseAdmin.from('lead_enrichment_log').insert({
      stage,
      status: result.status,
      details: result.details,
      duration_ms: durationMs,
    });

    return {
      stage,
      status: result.status,
      details: result.details,
      durationMs,
      updates: result.updates,
    };
  } catch (error: unknown) {
    const durationMs = Date.now() - start;
    const message = error instanceof Error ? error.message : 'Unknown error';

    console.error(`[ENRICHMENT] Stage ${stage} failed:`, message);

    await supabaseAdmin.from('lead_enrichment_log').insert({
      stage,
      status: 'failed',
      details: { error: message },
      duration_ms: durationMs,
    });

    return {
      stage,
      status: 'failed',
      details: { error: message },
      durationMs,
      updates: {},
    };
  }
}

export async function runEnrichmentInBackground(leadId: string, userId: string) {
  // Fire-and-forget: don't await, let it run in background
  runEnrichment(leadId, userId).catch((error) => {
    console.error(`[ENRICHMENT] Background enrichment failed for lead ${leadId}:`, error);
  });
}
