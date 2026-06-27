import { NextRequest, NextResponse } from 'next/server';
import { getReports, networkCenter } from '@/lib/missing/data';
import { withLiveCascade } from '@/lib/missing/store';
import { distanceMeters } from '@/lib/geo';

/**
 * Citizen alert feed: active cases sorted by proximity to the user's location.
 * Closest alerts first (see main_plan.md → Citizen App / Home).
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get('lat') ?? '') || networkCenter.lat;
  const lng = parseFloat(searchParams.get('lng') ?? '') || networkCenter.lng;
  const me = { lat, lng };

  const reports = (await getReports())
    .map(withLiveCascade)
    .filter((r) => r.status !== 'REUNITED')
    .map((r) => ({
      ...r,
      distanceMeters: distanceMeters(me, { lat: r.lastSeenLat, lng: r.lastSeenLng }),
    }))
    .sort((a, b) => a.distanceMeters - b.distanceMeters);

  return NextResponse.json({ center: me, items: reports });
}
