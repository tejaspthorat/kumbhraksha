// web/src/app/api/reports/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  const days = searchParams.get('days') || '7';
  
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
  
  try {
    let url = `${backendUrl}/api/reports/daily`;
    if (date) {
      url += `?date=${date}`;
    } else {
      url += `?days=${days}`;
    }
    
    const res = await fetch(url, {
      next: { revalidate: 0 }
    });
    
    if (!res.ok) {
      console.warn('Backend fetch failed');
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch reports from backend' 
      }, { status: 500 });
    }
    
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Reports fetch error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Network error' 
    }, { status: 500 });
  }
}