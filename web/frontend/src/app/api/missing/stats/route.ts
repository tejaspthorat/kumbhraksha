import { NextResponse } from 'next/server';
import { getReports, getSightings, getCctv } from '@/lib/missing/data';
import { withLiveCascade } from '@/lib/missing/store';

/** Summary metrics for the Live Operations dashboard. */
export async function GET() {
  const [reports, sightings, cctv] = await Promise.all([
    getReports(),
    getSightings(),
    getCctv(),
  ]);
  const live = reports.map(withLiveCascade);
  const active = live.filter((r) => r.status !== 'REUNITED');

  return NextResponse.json({
    activeCases: active.length,
    children: active.filter((r) => (r.person.age ?? 99) < 12).length,
    reunited: live.filter((r) => r.status === 'REUNITED').length,
    pendingSightings: sightings.filter((s) => s.status === 'PENDING').length,
    usersNotified: active.reduce((sum, r) => sum + (r.usersNotified ?? 0), 0),
    cctvCount: cctv.length,
    escalated: active.filter((r) => r.cascadeLevel >= 3).length,
  });
}
