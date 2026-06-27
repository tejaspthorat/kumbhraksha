import type { Prisma, TaskAuditActorType } from "@prisma/client";
import prisma from "@/lib/prisma";

export async function logCoordinatorTaskAudit(params: {
  taskId: string;
  action: string;
  actorType: TaskAuditActorType;
  actorStaffId?: number | null;
  actorProfileId?: string | null;
  metadata?: Prisma.InputJsonValue;
  ipHash?: string | null;
  userAgent?: string | null;
}): Promise<void> {
  await prisma.coordinatorTaskAuditLog.create({
    data: {
      taskId: params.taskId,
      action: params.action,
      actorType: params.actorType,
      actorStaffId: params.actorStaffId ?? undefined,
      actorProfileId: params.actorProfileId ?? undefined,
      metadata: params.metadata,
      ipHash: params.ipHash ?? undefined,
      userAgent: params.userAgent ?? undefined,
    },
  });
}
