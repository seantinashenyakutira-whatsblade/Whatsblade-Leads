import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';
export const maxDuration = 300;

const ALLOWED_SECRET = process.env.CRON_SECRET || '';

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');

  if (authHeader !== `Bearer ${ALLOWED_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: leads, error } = await supabase
    .from('leads')
    .select('id, google_place_id, facebook_page_id, website, email, phone, company, last_enriched_at')
    .eq('last_enriched_at', null)
    .or('last_enriched_at.lt.now()')
    .limit(50)
    .order('created_at', { ascending: true });

  if (error || !leads?.length) {
    return NextResponse.json({ processed: 0, message: 'No leads to enrich' });
  }

  let processed = 0;
  let failed = 0;

  for (const lead of leads) {
    try {
      await supabase
        .from('lead_enrichment_log')
        .insert({
          lead_id: lead.id,
          stage: 'background_enrichment',
          status: 'started',
          details: { triggered_by: 'cron' },
        });

      processed++;
    } catch (error) {
      failed++;
      console.error(`[CRON] Enrichment failed for lead ${lead.id}:`, error);
    }
  }

  return NextResponse.json({
    processed,
    failed,
    total: leads.length,
    timestamp: new Date().toISOString(),
  });
}
