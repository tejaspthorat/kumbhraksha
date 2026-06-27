import { NextRequest, NextResponse } from 'next/server';
import { getReports, createReport } from '@/lib/missing/data';
import { withLiveCascade } from '@/lib/missing/store';

export async function GET() {
  const reports = (await getReports()).map(withLiveCascade);
  return NextResponse.json(reports);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body?.person?.name) {
      return NextResponse.json({ error: 'person.name is required' }, { status: 400 });
    }
    if (typeof body.lastSeenLat !== 'number' || typeof body.lastSeenLng !== 'number') {
      return NextResponse.json(
        { error: 'lastSeenLat and lastSeenLng are required' },
        { status: 400 }
      );
    }
    const report = await createReport({
      person: {
        name: body.person.name,
        age: body.person.age ?? null,
        gender: body.person.gender ?? 'UNKNOWN',
        description: body.person.description ?? null,
        clothing: body.person.clothing ?? null,
        medicalNotes: body.person.medicalNotes ?? null,
        photoUrl: body.person.photoUrl ?? null,
      },
      reporterName: body.reporterName,
      reporterPhone: body.reporterPhone,
      relationship: body.relationship,
      lastSeenLat: body.lastSeenLat,
      lastSeenLng: body.lastSeenLng,
      lastSeenLabel: body.lastSeenLabel,
      lastSeenTime: body.lastSeenTime,
    });
    return NextResponse.json(report, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
