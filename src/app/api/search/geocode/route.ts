import { NextRequest, NextResponse } from 'next/server';
import { geocodeWithFallback } from '@/lib/google-places';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address } = body;

    if (!address) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 });
    }

    const result = await geocodeWithFallback(address);

    if (!result) {
      return NextResponse.json({ error: 'Could not geocode address' }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error('[API] Geocode error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
