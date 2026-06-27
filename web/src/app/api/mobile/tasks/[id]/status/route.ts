import { NextRequest, NextResponse } from 'next/server';
import { verifyMobileToken } from '@/lib/mobileAuth';
import prisma from '@/lib/prisma';

/**
 * PATCH /api/mobile/tasks/[id]/status — Coordinator updates task status from mobile.
 * Validates ownership, logs to TaskUpdate, and emits socket event for admin dashboard.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = verifyMobileToken(req);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: taskId } = await params;

  try {
    const { status, note } = await req.json();

    const validStatuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'NEEDS_HELP'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
    }

    // Ownership check — coordinator can only update their own tasks
    const existing = await prisma.coordinatorTask.findFirst({
      where: { id: taskId, assignedToId: auth.staffId },
    });
    if (!existing) {
      return NextResponse.json(
        { error: 'Task not found or not assigned to you' },
        { status: 404 }
      );
    }

    // Update task + create audit log in a transaction
    const [task] = await prisma.$transaction([
      prisma.coordinatorTask.update({
        where: { id: taskId },
        data: {
          status,
          completedAt: status === 'COMPLETED' ? new Date() : null,
        },
        include: {
          event: { select: { id: true, name: true } },
          assignedTo: { select: { id: true, name: true } },
        },
      }),
      prisma.taskUpdate.create({
        data: {
          taskId,
          staffId: auth.staffId,
          status,
          note: note || `Status updated to ${status} via mobile`,
        },
      }),
    ]);

    // Notify socket server so admin dashboard updates in real-time
    try {
      const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
      const secret = process.env.COORDINATOR_INTERNAL_SECRET;
      if (secret) {
        await fetch(`${socketUrl}/api/v1/internal/tasks/emit-status`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-coordinator-internal-secret': secret,
          },
          body: JSON.stringify({
            taskId: task.id,
            status: task.status,
            updatedBy: task.assignedTo,
            eventId: task.event.id,
            completedAt: task.completedAt,
          }),
        });
      }
    } catch (socketErr) {
      // Non-fatal: log but don't fail the request
      console.warn('[PATCH /api/mobile/tasks/[id]/status] socket notify failed', socketErr);
    }

    return NextResponse.json(task);
  } catch (err) {
    console.error('[PATCH /api/mobile/tasks/[id]/status]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
