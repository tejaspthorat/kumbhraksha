// web/src/app/api/dashboard/route.ts
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth, currentUser } from '@clerk/nextjs/server'

export async function GET() {
  try {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Test database connection first
    try {
      await prisma.$queryRaw`SELECT 1`
    } catch (dbError) {
      console.warn('Database connection failed, using mock data:', dbError)
      const { fullMockData } = await import('@/lib/mockData')
      return NextResponse.json(fullMockData)
    }

    // 1. Ensure Profile exists (Auto-Onboarding)
    let profile = await prisma.profile.findUnique({
      where: { id: userId },
      include: { zones: { take: 1 } }
    });

    if (!profile) {
      console.log(`[Dashboard] Creating new profile for user ${userId}`);
      profile = await prisma.profile.create({
        data: {
          id: userId,
          email: user?.emailAddresses[0]?.emailAddress || '',
          name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'New User',
          role: 'ADMIN', // Default new web users as ADMIN of their own dashboard
        },
        include: { zones: { take: 1 } }
      });
    }

    // 2. If no zones exist, seed with defaults so AI Orchestrator doesn't crash
    if (!profile.zones || profile.zones.length === 0) {
      console.log(`[Dashboard] Seeding default zones for user ${userId}`);
      await prisma.zone.createMany({
        data: [
          { name: 'Main Entrance', profileId: userId, area: 120, density: 0, level: 'success', people: 0 },
          { name: 'Food Court', profileId: userId, area: 450, density: 0, level: 'success', people: 0 },
          { name: 'Exhibition Hall', profileId: userId, area: 800, density: 0, level: 'success', people: 0 },
          { name: 'Emergency Exit A', profileId: userId, area: 50, density: 0, level: 'success', people: 0 },
        ]
      });
    }

    // Parallel API Optimization: Group queries into two batches to stay within connection pool limits
    const [
      zones, alerts, staff, tasks, 
      crowdData, predictions, cameras, devices
    ] = await Promise.allSettled([ // Use allSettled to handle individual failures
      prisma.zone.findMany({
        where: { profileId: userId },
        include: {
          cameras: true,
          staff: true,
          alerts: { where: { resolved: false }, orderBy: { createdAt: 'desc' }, take: 5 },
          predictions: { orderBy: { createdAt: 'desc' }, take: 3 },
          zoneDensity: true,
        },
        orderBy: { density: 'desc' },
      }),
      prisma.alert.findMany({
        where: { zone: { profileId: userId } },
        include: { zone: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.staff.findMany({ where: { profileId: userId } }),
      prisma.staffTask.findMany({ where: { profileId: userId } }),
      prisma.crowdData.findMany({ where: { profileId: userId }, orderBy: { createdAt: 'desc' } }),
      prisma.prediction.findMany({ where: { zone: { profileId: userId } } }),
      prisma.camera.findMany({ where: { profileId: userId } }),
      prisma.device.findMany({ where: { profileId: userId } })
    ]);

    const [
      rooms, entries, suggestions, zoneDensity, 
      thresholds, flowData, peakData, zoneRanking, 
      alertSummary, alertLog
    ] = await Promise.allSettled([
      prisma.room.findMany({ where: { profileId: userId } }),
      prisma.entryPoint.findMany({ where: { profileId: userId } }),
      prisma.suggestion.findMany({ where: { profileId: userId } }),
      prisma.zoneDensity.findMany({ where: { zone: { profileId: userId } } }),
      prisma.densityThreshold.findMany({ where: { profileId: userId } }),
      prisma.flowData.findMany({ where: { profileId: userId } }),
      prisma.peakData.findMany({ where: { profileId: userId }, orderBy: { createdAt: 'desc' } }),
      prisma.zoneRanking.findMany({ where: { profileId: userId }, orderBy: { avgDensity: 'desc' } }),
      prisma.alertSummary.findMany({ where: { profileId: userId } }),
      prisma.alertLog.findMany({ 
        where: { zone: { profileId: userId } },
        include: { zone: { select: { id: true, name: true } } }, 
        orderBy: { createdAt: 'desc' }, 
        take: 50 
      })
    ]);

    // Helper to extract value from settled promise
    const getValue = (settled: PromiseSettledResult<any>, defaultValue: any[] = []) => {
      return settled.status === 'fulfilled' ? settled.value : defaultValue
    }

    return NextResponse.json({
      profileId: userId,
      rooms: getValue(rooms),
      entries: getValue(entries),
      suggestions: getValue(suggestions),
      alerts: getValue(alerts),
      cameras: getValue(cameras),
      devices: getValue(devices),
      staff: getValue(staff),
      tasks: getValue(tasks),
      zones: getValue(zones),
      zoneDensity: getValue(zoneDensity),
      thresholds: getValue(thresholds),
      predictions: getValue(predictions),
      flowData: getValue(flowData),
      crowdData: getValue(crowdData),
      peakData: getValue(peakData),
      zoneRanking: getValue(zoneRanking),
      alertSummary: getValue(alertSummary),
      alertLog: getValue(alertLog)
    })
  } catch (error) {
    console.error('[Dashboard API Error]:', error);
    // In dev, we can still fallback to mock data if DB is absolutely failing,
    // but we should log the error clearly.
    try {
      const { fullMockData } = await import('@/lib/mockData')
      return NextResponse.json(fullMockData)
    } catch (mockError) {
      return new NextResponse('Internal Server Error', { status: 500 });
    }
  }
}
