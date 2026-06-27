'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { auth } from '@clerk/nextjs/server';

export async function assignTask(data: {
  text: string;
  assignee: string;
  staffId: number;
  priority: 'low' | 'medium' | 'high';
  time: string;
}) {
  try {
    const { text, assignee, staffId, priority, time } = data;

    // Get staff record to find zoneId
    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
      select: { zoneId: true }
    });

    if (!staff) throw new Error('Staff not found');

    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    // userId maps directly to Profile.id in the schema
    const result = await prisma.$transaction([
      // 1. Create the task
      prisma.staffTask.create({
        data: {
          text,
          assignee,
          priority,
          time,
          staffId,
          profileId: userId,
        }
      }),
      // 2. Increment staff task count
      prisma.staff.update({
        where: { id: staffId },
        data: { tasks: { increment: 1 } }
      }),
      // 3. Create an alert for the task assignment
      prisma.alert.create({
        data: {
          type: 'task_assignment',
          level: 'info',
          title: 'New Task Assigned',
          description: `${assignee}: ${text}`,
          time: new Date().toISOString(),
          zoneId: staff.zoneId
        }
      })
    ]);

    revalidatePath('/dashboard/staff');
    return { success: true, data: result[0] };
  } catch (error: any) {
    console.error('Task assignment error:', error);
    throw new Error(error.message || 'Failed to assign task');
  }
}

export async function deleteTask(id: number) {
  try {
    const task = await prisma.staffTask.delete({
      where: { id }
    });

    // Decrement staff task count
    if (task.assignee) {
      await prisma.staff.updateMany({
        where: { name: task.assignee },
        data: { tasks: { decrement: 1 } }
      });
    }

    revalidatePath('/dashboard/staff');
    return { success: true };
  } catch (error: any) {
    console.error('Delete task error:', error);
    throw new Error('Failed to delete task');
  }
}
