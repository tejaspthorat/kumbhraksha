import { Router, Response } from 'express';
import { AuthenticatedRequest, requireAdminAuth } from '../middleware/auth';
import prisma from '../lib/prisma';

const router = Router();

router.get('/', requireAdminAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const events = await prisma.event.findMany({
      where: { profileId: userId },
      select: {
        id: true,
        name: true,
        description: true,
        location: true,
        startDate: true,
        endDate: true,
        allowPublicTasks: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return res.json(events);
  } catch (err) {
    console.error('[GET /api/events]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
