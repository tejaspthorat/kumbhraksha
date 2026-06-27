//web/src/app/api/camera/route.ts
import { NextResponse } from 'next/server';
import { cameras as mockCameras } from '@/lib/mockData';

export async function GET() {
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
  try {
    const res = await fetch(`${backendUrl}/api/cameras`, {
      next: { revalidate: 0 }
    });
    
    if (!res.ok) {
      console.warn('Backend fetch failed, using mock data');
      return NextResponse.json(mockCameras);
    }
    
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.warn('Camera fetch error, using mock data:', error);
    return NextResponse.json(mockCameras);
  }
}

export async function POST(req: Request) {
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
  try {
    const body = await req.json();
    const res = await fetch(`${backendUrl}/api/cameras`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('Camera creation error:', error);
    return NextResponse.json({ error: 'Failed to create camera on backend' }, { status: 500 });
  }
}
