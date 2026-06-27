import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import type { InternalTaskPriority, InternalTaskStatus } from "@prisma/client";

// ── Constants ────────────────────────────────────────────────────────────────

const PRIORITIES: InternalTaskPriority[] = ["LOW", "MEDIUM", "HIGH"];
const STATUSES: InternalTaskStatus[] = ["OPEN", "IN_PROGRESS", "COMPLETED"];

// ── Helpers ──────────────────────────────────────────────────────────────────

function errorResponse(
  message: string,
  code: string,
  status: number,
  details?: Record<string, string>
) {
  return NextResponse.json({ error: message, code, ...(details ? { details } : {}) }, { status });
}

function formatTask(task: Record<string, unknown>) {
  const assignees =
    (task.assignees as Array<{ id: string; name?: string | null; email?: string }>) ?? [];
  return {
    ...task,
    assignees: assignees.map((a) => ({
      id: a.id,
      name: a.name ?? null,
      email: a.email,
    })),
  };
}

// ── Route params type ────────────────────────────────────────────────────────

type RouteParams = { params: Promise<{ taskId: string }> };

// ── GET /api/tasks/:taskId ──────────────────────────────────────────────────

export async function GET(_req: NextRequest, context: RouteParams) {
  const { userId } = await auth();
  if (!userId) {
    return errorResponse("Authentication required", "UNAUTHORIZED", 401);
  }

  const { taskId } = await context.params;

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      assignees: { select: { id: true, name: true, email: true } },
      creator: { select: { id: true, name: true, email: true } },
    },
  });

  if (!task) {
    return errorResponse("Task not found", "NOT_FOUND", 404);
  }

  // Authorization: user must be the creator or an assignee
  const isCreator = task.creatorId === userId;
  const isAssignee = task.assignees.some((a) => a.id === userId);
  if (!isCreator && !isAssignee) {
    return errorResponse("You do not have permission to view this task", "FORBIDDEN", 403);
  }

  return NextResponse.json({ task: formatTask(task as unknown as Record<string, unknown>) });
}

// ── PATCH /api/tasks/:taskId ────────────────────────────────────────────────

export async function PATCH(req: NextRequest, context: RouteParams) {
  const { userId } = await auth();
  if (!userId) {
    return errorResponse("Authentication required", "UNAUTHORIZED", 401);
  }

  const { taskId } = await context.params;

  // 1. Check existing task
  const existing = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      assignees: { select: { id: true } },
    },
  });

  if (!existing) {
    return errorResponse("Task not found", "NOT_FOUND", 404);
  }

  // Authorization: only creator or assignees can update
  const isCreator = existing.creatorId === userId;
  const isAssignee = existing.assignees.some((a) => a.id === userId);
  if (!isCreator && !isAssignee) {
    return errorResponse("You do not have permission to update this task", "FORBIDDEN", 403);
  }

  // 2. Parse body
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return errorResponse("Invalid JSON body", "INVALID_JSON", 400);
  }

  // 3. Build update data
  const updateData: Record<string, unknown> = {};

  // title
  if (body.title !== undefined) {
    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title) {
      return errorResponse("title must be a non-empty string", "VALIDATION_ERROR", 400);
    }
    if (title.length > 500) {
      return errorResponse("title must be 500 characters or fewer", "VALIDATION_ERROR", 400);
    }
    updateData.title = title;
  }

  // description
  if (body.description !== undefined) {
    updateData.description =
      body.description === null
        ? null
        : typeof body.description === "string"
          ? body.description.trim().slice(0, 5000)
          : null;
  }

  // dueDate
  if (body.dueDate !== undefined) {
    if (body.dueDate === null) {
      updateData.dueDate = null;
    } else if (typeof body.dueDate === "string") {
      const parsed = new Date(body.dueDate);
      if (isNaN(parsed.getTime())) {
        return errorResponse(
          "dueDate is not a valid ISO 8601 date-time",
          "VALIDATION_ERROR",
          422
        );
      }
      updateData.dueDate = parsed;
    } else {
      return errorResponse(
        "dueDate must be an ISO 8601 date-time string or null",
        "VALIDATION_ERROR",
        400
      );
    }
  }

  // priority
  if (body.priority !== undefined) {
    const priorityRaw =
      typeof body.priority === "string" ? body.priority.toUpperCase() : "";
    if (!PRIORITIES.includes(priorityRaw as InternalTaskPriority)) {
      return errorResponse(
        `priority must be one of: ${PRIORITIES.join(", ").toLowerCase()}`,
        "VALIDATION_ERROR",
        400
      );
    }
    updateData.priority = priorityRaw as InternalTaskPriority;
  }

  // status
  if (body.status !== undefined) {
    const statusRaw =
      typeof body.status === "string" ? body.status.toUpperCase() : "";
    if (!STATUSES.includes(statusRaw as InternalTaskStatus)) {
      return errorResponse(
        `status must be one of: ${STATUSES.join(", ").toLowerCase()}`,
        "VALIDATION_ERROR",
        400
      );
    }
    updateData.status = statusRaw as InternalTaskStatus;
  }

  // assignees — full replacement strategy
  let assigneeConnect: { id: string }[] | undefined;
  if (body.assignees !== undefined) {
    if (body.assignees === null) {
      // Remove all assignees
      assigneeConnect = [];
    } else if (Array.isArray(body.assignees)) {
      for (const id of body.assignees) {
        if (typeof id !== "string" || !id.trim()) {
          return errorResponse(
            "Each assignee must be a non-empty string user ID",
            "VALIDATION_ERROR",
            400
          );
        }
      }
      const dedupedIds = [...new Set(body.assignees as string[])];

      // Verify each user exists
      if (dedupedIds.length > 0) {
        const existingProfiles = await prisma.profile.findMany({
          where: { id: { in: dedupedIds } },
          select: { id: true },
        });
        const existingIds = new Set(existingProfiles.map((p) => p.id));
        const missing = dedupedIds.filter((id) => !existingIds.has(id));
        if (missing.length > 0) {
          return errorResponse(
            `The following user IDs do not exist: ${missing.join(", ")}`,
            "INVALID_ASSIGNEES",
            400,
            { nonExistentIds: missing.join(", ") }
          );
        }
      }
      assigneeConnect = dedupedIds.map((id) => ({ id }));
    } else {
      return errorResponse("assignees must be an array of user IDs or null", "VALIDATION_ERROR", 400);
    }
  }

  // 4. Nothing to update
  if (Object.keys(updateData).length === 0 && assigneeConnect === undefined) {
    return errorResponse("No valid fields provided for update", "VALIDATION_ERROR", 400);
  }

  // 5. Update the task
  const updated = await prisma.task.update({
    where: { id: taskId },
    data: {
      ...updateData,
      ...(assigneeConnect !== undefined
        ? { assignees: { set: assigneeConnect } }
        : {}),
    },
    include: {
      assignees: { select: { id: true, name: true, email: true } },
      creator: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json({ task: formatTask(updated as unknown as Record<string, unknown>) });
}

// ── DELETE /api/tasks/:taskId ───────────────────────────────────────────────

export async function DELETE(_req: NextRequest, context: RouteParams) {
  const { userId } = await auth();
  if (!userId) {
    return errorResponse("Authentication required", "UNAUTHORIZED", 401);
  }

  const { taskId } = await context.params;

  const existing = await prisma.task.findUnique({
    where: { id: taskId },
    select: { creatorId: true },
  });

  if (!existing) {
    return errorResponse("Task not found", "NOT_FOUND", 404);
  }

  // Only the creator can delete a task
  if (existing.creatorId !== userId) {
    return errorResponse("Only the task creator can delete this task", "FORBIDDEN", 403);
  }

  await prisma.task.delete({ where: { id: taskId } });

  return NextResponse.json({ message: "Task deleted successfully" }, { status: 200 });
}
