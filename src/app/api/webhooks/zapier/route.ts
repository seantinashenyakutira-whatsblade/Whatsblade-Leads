import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const userId = url.searchParams.get('user_id');
  const secret = url.searchParams.get('secret');

  if (!userId || !secret) {
    return NextResponse.json({ error: 'Missing user_id or secret' }, { status: 400 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: integration } = await supabase
    .from('integrations')
    .select('config')
    .eq('user_id', userId)
    .eq('type', 'zapier')
    .eq('is_active', true)
    .single();

  if (!integration) {
    return NextResponse.json({ error: 'No active Zapier integration found' }, { status: 404 });
  }

  const webhookUrl = (integration.config as Record<string, unknown>).webhookUrl as string;

  if (!webhookUrl) {
    return NextResponse.json({ error: 'Webhook URL not configured' }, { status: 400 });
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...body,
        _meta: {
          source: 'whatsblade-leads',
          user_id: userId,
          timestamp: new Date().toISOString(),
        },
      }),
      signal: AbortSignal.timeout(10000),
    });

    await supabase
      .from('integrations')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('type', 'zapier');

    if (!response.ok) {
      return NextResponse.json(
        { error: `Webhook returned ${response.status}`, received: body },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, received: body });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: 'Failed to forward to Zapier', details: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Zapier webhook endpoint for Whatsblade Leads',
    method: 'POST',
    description: 'Send lead data as JSON to this endpoint to forward to your Zapier webhook URL',
  });
}
