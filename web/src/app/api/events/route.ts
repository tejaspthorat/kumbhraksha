import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/events — List events for the authenticated user's profile.
 * Used by the CreateTaskForm dropdown.
 */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
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

    return NextResponse.json(events);
  } catch (err) {
    console.error('[GET /api/events]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
