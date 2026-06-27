import { Router, Response } from 'express';
import { AuthenticatedRequest, requireAdminAuth } from '../middleware/auth';
import prisma from '../lib/prisma';
import { fullMockData } from '../lib/mockData';

const router = Router();

router.get('/', requireAdminAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Test database connection first
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (dbError) {
      console.warn('Database connection failed, using mock data:', dbError);
      return res.json(fullMockData);
    }

    // 1. Ensure Profile exists (Auto-Onboarding)
    let profile = await prisma.profile.findUnique({
      where: { id: userId },
      include: { zones: { take: 1 } }
    });

    if (!profile) {
      console.log(`[Dashboard] Creating new profile for user ${userId}`);
      const email = req.user?.email || '';
      const name = req.user?.name || 'New User';
      
      profile = await prisma.profile.create({
        data: {
          id: userId,
          email,
          name,
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
          { name: 'Ramkund Ghat', profileId: userId, area: 290, density: 0, level: 'success', people: 0 },
          { name: 'Panchavati Annadan Kshetra', profileId: userId, area: 160, density: 0, level: 'success', people: 0 },
          { name: 'Sadhugram Camp', profileId: userId, area: 280, density: 0, level: 'success', people: 0 },
          { name: 'Tapovan Exit', profileId: userId, area: 140, density: 0, level: 'success', people: 0 },
        ]
      });
    }

    // parallel database queries
    const [
      zones, alerts, staff, tasks, 
      crowdData, predictions, cameras, devices
    ] = await Promise.allSettled([
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

    const getValue = (settled: PromiseSettledResult<any>, defaultValue: any[] = []) => {
      return settled.status === 'fulfilled' ? settled.value : defaultValue;
    };

    return res.json({
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
    });
  } catch (error) {
    console.error('[Dashboard API Error]:', error);
    return res.json(fullMockData);
  }
});

export default router;
