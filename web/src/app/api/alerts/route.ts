import { NextResponse } from 'next/server';
import { allAlerts } from '@/lib/mockData';

export async function GET() {
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
  try {
    const res = await fetch(`${backendUrl}/api/alerts`, {
      next: { revalidate: 0 } // Disable caching to always try backend first
    });
    
    if (!res.ok) {
      console.warn('Backend fetch failed, using mock data');
      return NextResponse.json(allAlerts);
    }
    
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.warn('Alert fetch error, using mock data:', error);
    return NextResponse.json(allAlerts);
  }
}
