import { NextRequest, NextResponse } from 'next/server';
import { triageSighting } from '@/lib/missing/data';

/** Triage a sighting from the dashboard queue: match / dismiss / new case. */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const action = body.action as 'match' | 'dismiss' | 'new' | undefined;
  if (!action) return NextResponse.json({ error: 'action is required' }, { status: 400 });
  const sighting = await triageSighting(id, action, body.missingReportId);
  if (!sighting) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(sighting);
}
