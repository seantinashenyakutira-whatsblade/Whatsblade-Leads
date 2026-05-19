import { NextRequest, NextResponse } from 'next/server';
import { facebookPageSearch, mapFacebookToDiscovered } from '@/lib/facebook-graph';
import { calculateLeadScore } from '@/lib/scoring';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, center, radiusKm } = body;

    if (!query || !center) {
      return NextResponse.json({ error: 'Query and center are required' }, { status: 400 });
    }

    const results = await facebookPageSearch(query, center, radiusKm);

    const mapped = results.map((page) => {
      const d = mapFacebookToDiscovered(page);
      const { _hasWebsite, _hasPhone, _hasEmail, _hasSocialMedia, ...rest } = d;
      return {
        ...rest,
        leadScore: calculateLeadScore({
          hasWebsite: _hasWebsite,
          hasPhone: _hasPhone,
          hasEmail: _hasEmail,
          hasSocialMedia: _hasSocialMedia,
          googleRating: null,
        }),
      };
    });

    return NextResponse.json({ items: mapped, total: mapped.length });
  } catch (err) {
    console.error('[API] Facebook search error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
