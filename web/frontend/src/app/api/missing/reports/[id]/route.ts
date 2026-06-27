import { NextRequest, NextResponse } from 'next/server';
import { getReport, setReportStatus } from '@/lib/missing/data';
import { withLiveCascade } from '@/lib/missing/store';
import type { MissingReportStatus } from '@/lib/missing/types';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const report = await getReport(id);
  if (!report) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(withLiveCascade(report));
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const status = body.status as MissingReportStatus | undefined;
  if (!status) return NextResponse.json({ error: 'status is required' }, { status: 400 });
  const report = await setReportStatus(id, status);
  if (!report) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(report);
}
