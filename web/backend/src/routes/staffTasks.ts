import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { AuthenticatedRequest, requireAdminAuth } from '../middleware/auth';

const router = Router();

router.use(requireAdminAuth);

/**
 * POST /api/staff-tasks — Assign a task to a staff member.
 * Creates the StaffTask, increments the staff member's task count, and raises an
 * informational alert in their zone (mirrors the former Next.js server action).
 */
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { text, assignee, staffId, priority, time } = req.body;
    const profileId = req.user!.id;

    if (!text || !assignee || !staffId) {
      return res.status(400).json({ error: 'text, assignee and staffId are required' });
    }

    const staff = await prisma.staff.findUnique({
      where: { id: Number(staffId) },
      select: { zoneId: true },
    });
    if (!staff) {
      return res.status(404).json({ error: 'Staff not found' });
    }

    const result = await prisma.$transaction([
      prisma.staffTask.create({
        data: {
          text,
          assignee,
          priority: priority || 'medium',
          time: time || 'Now',
          staffId: Number(staffId),
          profileId,
        },
      }),
      prisma.staff.update({
        where: { id: Number(staffId) },
        data: { tasks: { increment: 1 } },
      }),
      prisma.alert.create({
        data: {
          type: 'task_assignment',
          level: 'info',
          title: 'New Task Assigned',
          description: `${assignee}: ${text}`,
          time: new Date().toISOString(),
          zoneId: staff.zoneId,
        },
      }),
    ]);

    return res.status(201).json({ success: true, data: result[0] });
  } catch (err: any) {
    console.error('[POST /api/staff-tasks]', err);
    return res.status(500).json({ error: err.message || 'Failed to assign task' });
  }
});

/**
 * DELETE /api/staff-tasks/:id — Delete a task and decrement the assignee's count.
 */
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = Number(req.params.id);

    const task = await prisma.staffTask.delete({ where: { id } });

    if (task.assignee) {
      await prisma.staff.updateMany({
        where: { name: task.assignee },
        data: { tasks: { decrement: 1 } },
      });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/staff-tasks/:id]', err);
    return res.status(500).json({ error: 'Failed to delete task' });
  }
});

export default router;
