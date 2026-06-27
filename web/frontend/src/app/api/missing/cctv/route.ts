import { NextResponse } from 'next/server';
import { getCctv } from '@/lib/missing/data';

export async function GET() {
  const cctv = await getCctv();
  return NextResponse.json(cctv);
}
