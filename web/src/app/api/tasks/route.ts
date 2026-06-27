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

/** Shape the task for API responses — includes assignee IDs + optional names. */
function formatTask(task: Record<string, unknown>) {
  const assignees = (task.assignees as Array<{ id: string; name?: string | null; email?: string }>) ?? [];
  return {
    ...task,
    assignees: assignees.map((a) => ({
      id: a.id,
      name: a.name ?? null,
      email: a.email,
    })),
  };
}

// ── POST /api/tasks ─────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // 1. Authenticate
  const { userId } = await auth();
  if (!userId) {
    return errorResponse("Authentication required", "UNAUTHORIZED", 401);
  }

  // 2. Parse body
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return errorResponse("Invalid JSON body", "INVALID_JSON", 400);
  }

  // 3. Validate title (required)
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) {
    return errorResponse("title is required and must be a non-empty string", "VALIDATION_ERROR", 400);
  }
  if (title.length > 500) {
    return errorResponse("title must be 500 characters or fewer", "VALIDATION_ERROR", 400);
  }

  // 4. Validate description (optional)
  const description =
    typeof body.description === "string" ? body.description.trim().slice(0, 5000) : null;

  // 5. Validate dueDate (optional, ISO 8601)
  let dueDate: Date | null = null;
  if (body.dueDate !== undefined && body.dueDate !== null) {
    if (typeof body.dueDate !== "string") {
      return errorResponse("dueDate must be an ISO 8601 date-time string", "VALIDATION_ERROR", 400);
    }
    const parsed = new Date(body.dueDate);
    if (isNaN(parsed.getTime())) {
      return errorResponse("dueDate is not a valid ISO 8601 date-time", "VALIDATION_ERROR", 422);
    }
    dueDate = parsed;
  }

  // 6. Validate priority (optional, defaults to MEDIUM)
  const priorityRaw = typeof body.priority === "string" ? body.priority.toUpperCase() : "MEDIUM";
  if (!PRIORITIES.includes(priorityRaw as InternalTaskPriority)) {
    return errorResponse(
      `priority must be one of: ${PRIORITIES.join(", ").toLowerCase()}`,
      "VALIDATION_ERROR",
      400
    );
  }
  const priority = priorityRaw as InternalTaskPriority;

  // 7. Validate status (optional, defaults to OPEN)
  const statusRaw = typeof body.status === "string" ? body.status.toUpperCase() : "OPEN";
  if (!STATUSES.includes(statusRaw as InternalTaskStatus)) {
    return errorResponse(
      `status must be one of: ${STATUSES.join(", ").toLowerCase()}`,
      "VALIDATION_ERROR",
      400
    );
  }
  const status = statusRaw as InternalTaskStatus;

  // 8. Validate assignees (optional, array of profile IDs)
  let assigneeIds: string[] = [];
  if (body.assignees !== undefined && body.assignees !== null) {
    if (!Array.isArray(body.assignees)) {
      return errorResponse("assignees must be an array of user IDs", "VALIDATION_ERROR", 400);
    }
    // Ensure all items are strings
    for (const id of body.assignees) {
      if (typeof id !== "string" || !id.trim()) {
        return errorResponse(
          "Each assignee must be a non-empty string user ID",
          "VALIDATION_ERROR",
          400
        );
      }
    }
    // Deduplicate
    assigneeIds = [...new Set(body.assignees as string[])];

    // Verify each user ID exists in Profile table
    if (assigneeIds.length > 0) {
      const existingProfiles = await prisma.profile.findMany({
        where: { id: { in: assigneeIds } },
        select: { id: true },
      });
      const existingIds = new Set(existingProfiles.map((p) => p.id));
      const missing = assigneeIds.filter((id) => !existingIds.has(id));
      if (missing.length > 0) {
        return errorResponse(
          `The following user IDs do not exist: ${missing.join(", ")}`,
          "INVALID_ASSIGNEES",
          400,
          { nonExistentIds: missing.join(", ") }
        );
      }
    }
  }

  // 9. Verify the creator profile exists (Clerk userId maps to Profile.id)
  const creatorProfile = await prisma.profile.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  if (!creatorProfile) {
    return errorResponse(
      "Your user profile was not found. Please complete onboarding first.",
      "PROFILE_NOT_FOUND",
      403
    );
  }

  // 10. Create the task with assignees
  const task = await prisma.task.create({
    data: {
      title,
      description,
      dueDate,
      priority,
      status,
      creatorId: userId,
      ...(assigneeIds.length > 0
        ? { assignees: { connect: assigneeIds.map((id) => ({ id })) } }
        : {}),
    },
    include: {
      assignees: { select: { id: true, name: true, email: true } },
      creator: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json({ task: formatTask(task as unknown as Record<string, unknown>) }, { status: 201 });
}

// ── GET /api/tasks ──────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  // 1. Authenticate
  const { userId } = await auth();
  if (!userId) {
    return errorResponse("Authentication required", "UNAUTHORIZED", 401);
  }

  const url = new URL(req.url);

  // Query parameters for filtering
  const statusFilter = url.searchParams.get("status")?.toUpperCase() as InternalTaskStatus | undefined;
  const priorityFilter = url.searchParams.get("priority")?.toUpperCase() as InternalTaskPriority | undefined;
  const role = url.searchParams.get("role"); // "creator" | "assignee" | default: both

  // Pagination
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "20", 10)));
  const skip = (page - 1) * limit;

  // Build where clause — user sees tasks they created OR are assigned to
  type TaskWhere = {
    status?: InternalTaskStatus;
    priority?: InternalTaskPriority;
    creatorId?: string;
    assignees?: { some: { id: string } };
    OR?: Array<{ creatorId?: string; assignees?: { some: { id: string } } }>;
  };

  const where: TaskWhere = {};

  if (statusFilter && STATUSES.includes(statusFilter)) {
    where.status = statusFilter;
  }
  if (priorityFilter && PRIORITIES.includes(priorityFilter)) {
    where.priority = priorityFilter;
  }

  if (role === "creator") {
    where.creatorId = userId;
  } else if (role === "assignee") {
    where.assignees = { some: { id: userId } };
  } else {
    // Default: tasks user created OR is assigned to
    where.OR = [{ creatorId: userId }, { assignees: { some: { id: userId } } }];
  }

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      include: {
        assignees: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.task.count({ where }),
  ]);

  return NextResponse.json({
    tasks: tasks.map((t) => formatTask(t as unknown as Record<string, unknown>)),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
