import { NextRequest, NextResponse } from 'next/server';
import { verifyMobileToken } from '@/lib/mobileAuth';
import prisma from '@/lib/prisma';

/**
 * GET /api/mobile/tasks — Fetch tasks assigned to the authenticated coordinator.
 * Protected by JWT. Returns tasks sorted by priority (CRITICAL first), then deadline.
 */
export async function GET(req: NextRequest) {
  const auth = verifyMobileToken(req);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const tasks = await prisma.coordinatorTask.findMany({
      where: { assignedToId: auth.staffId },
      include: {
        event: { select: { id: true, name: true } },
        updates: {
          orderBy: { timestamp: 'desc' },
          take: 5,
          include: { staff: { select: { id: true, name: true } } },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { deadline: 'asc' },
      ],
    });

    return NextResponse.json(tasks);
  } catch (err) {
    console.error('[GET /api/mobile/tasks]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
