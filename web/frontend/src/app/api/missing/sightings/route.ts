import { NextRequest, NextResponse } from 'next/server';
import { getSightings, createSighting } from '@/lib/missing/data';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const onlyPending = searchParams.get('status') === 'pending';
  const sightings = await getSightings(onlyPending);
  return NextResponse.json(sightings);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (typeof body.lat !== 'number' || typeof body.lng !== 'number') {
      return NextResponse.json({ error: 'lat and lng are required' }, { status: 400 });
    }
    const sighting = await createSighting({
      missingReportId: body.missingReportId || undefined,
      spotterName: body.spotterName,
      photoUrl: body.photoUrl,
      lat: body.lat,
      lng: body.lng,
      description: body.description,
    });
    return NextResponse.json(sighting, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
