import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { emitCoordinatorTaskAssigned } from '@/lib/emitCoordinatorTaskAssigned';
import { logCoordinatorTaskAudit } from '@/lib/coordinatorTaskAudit';

/**
 * POST /api/coordinator-tasks — Admin creates a coordinator task.
 * Uses Clerk auth for admin identity.
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const {
      title,
      description,
      priority,
      assignedToId,
      eventId,
      locationLat,
      locationLng,
      locationLabel,
      deadline,
    } = await req.json();

    if (!title || !assignedToId || !eventId) {
      return NextResponse.json(
        { error: 'title, assignedToId and eventId are required' },
        { status: 400 }
      );
    }

    const task = await prisma.coordinatorTask.create({
      data: {
        title,
        description: description || null,
        priority: priority || 'MEDIUM',
        assignedToId: Number(assignedToId),
        assignedById: userId,
        eventId,
        locationLat: locationLat ? Number(locationLat) : null,
        locationLng: locationLng ? Number(locationLng) : null,
        locationLabel: locationLabel || null,
        deadline: deadline ? new Date(deadline) : null,
        status: 'PENDING',
      },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        event: { select: { id: true, name: true } },
      },
    });

    // Audit log
    await logCoordinatorTaskAudit({
      taskId: task.id,
      action: 'CREATED',
      actorType: 'PROFILE',
      actorProfileId: userId,
      metadata: { title, priority: priority || 'MEDIUM', assignedToId },
    });

    // Real-time push to coordinator's mobile socket room
    await emitCoordinatorTaskAssigned(Number(assignedToId), task);

    return NextResponse.json(task, { status: 201 });
  } catch (err) {
    console.error('[POST /api/coordinator-tasks]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/coordinator-tasks — List coordinator tasks with optional filters.
 * Used by admin dashboard (Kanban board, tables, etc.)
 */
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('eventId');
    const assignedToId = searchParams.get('assignedToId');
    const status = searchParams.get('status');
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));

    const tasks = await prisma.coordinatorTask.findMany({
      where: {
        ...(eventId && { eventId }),
        ...(assignedToId && { assignedToId: Number(assignedToId) }),
        ...(status && { status: status as any }),
      },
      include: {
        assignedTo: { select: { id: true, name: true, email: true, avatar: true } },
        event: { select: { id: true, name: true } },
        updates: {
          orderBy: { timestamp: 'desc' },
          take: 5,
          include: { staff: { select: { id: true, name: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json(tasks);
  } catch (err) {
    console.error('[GET /api/coordinator-tasks]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
