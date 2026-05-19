import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSupabaseAdmin } from '@/lib/db/client';

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('x-whatsblade-signature');
    const eventType = request.headers.get('x-whatsblade-event');
    const body = await request.text();

    if (!signature || !eventType) {
      return NextResponse.json({ error: 'Missing headers' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data: webhooks, error } = await supabaseAdmin
      .from('webhooks')
      .select('*')
      .contains('events', [eventType])
      .eq('is_active', true);

    if (error || !webhooks?.length) {
      return NextResponse.json({ received: true, matched: 0 });
    }

    const payload = JSON.stringify({
      event: eventType,
      data: body ? JSON.parse(body) : {},
      timestamp: new Date().toISOString(),
    });

    const deliveryPromises = webhooks.map(async (webhook) => {
      const expectedSig = crypto
        .createHmac('sha256', webhook.secret)
        .update(payload)
        .digest('hex');

      if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
        console.warn(`[WEBHOOK] Invalid signature for ${webhook.id}`);
        return;
      }

      try {
        const response = await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Whatsblade-Signature': signature,
            'X-Whatsblade-Event': eventType,
          },
          body: payload,
        });

        await supabaseAdmin
          .from('webhooks')
          .update({ last_triggered_at: new Date().toISOString() })
          .eq('id', webhook.id);

        if (!response.ok) {
          console.error(`[WEBHOOK] Delivery failed for ${webhook.id}: HTTP ${response.status}`);
        }
      } catch (err) {
        console.error(`[WEBHOOK] Delivery error for ${webhook.id}:`, err);
      }
    });

    await Promise.allSettled(deliveryPromises);

    return NextResponse.json({ received: true, matched: webhooks.length });
  } catch (err) {
    console.error('[WEBHOOK] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
