import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { publicTaskRateLimit } from "@/lib/publicTaskRateLimit";
import { getClientIp, hashClientIp } from "@/lib/publicTaskIp";
import { verifyTurnstileToken } from "@/lib/verifyTurnstile";
import { logCoordinatorTaskAudit } from "@/lib/coordinatorTaskAudit";
import { emitCoordinatorTaskAssigned } from "@/lib/emitCoordinatorTaskAssigned";
import { sendPublicTaskConfirmationEmail } from "@/lib/sendPublicTaskEmail";
import type { TaskPriority } from "@prisma/client";

const CREATE_WINDOW_MS = 60 * 60 * 1000;
const MAX_CREATES_PER_HOUR = 120;

const PRIORITIES: TaskPriority[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

type CreateBody = {
  title?: string;
  description?: string;
  priority?: string;
  eventId?: string;
  assignedToId?: number;
  publicCreatorName?: string;
  publicCreatorEmail?: string;
  notifyCreatorOnUpdates?: boolean;
  turnstileToken?: string;
  /** Honeypot — must be empty */
  website?: string;
};

function sanitizePublicTaskResponse(task: Record<string, unknown>) {
  const { creatorEditTokenHash: _h, creatorEditTokenExpiresAt: _e, ...rest } = task;
  return rest;
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const ipHash = hashClientIp(ip);

  if (!publicTaskRateLimit(`public:task:create:${ipHash ?? "unknown"}`, MAX_CREATES_PER_HOUR, CREATE_WINDOW_MS)) {
    console.warn(
      JSON.stringify({ evt: "public_task_create", outcome: "rate_limited", ipHash: ipHash ?? null })
    );
    return NextResponse.json(
      { error: "Too many submissions. Try again later.", code: "RATE_LIMITED" },
      { status: 429 }
    );
  }

  let body: CreateBody;
  try {
    body = (await req.json()) as CreateBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON", code: "VALIDATION_ERROR" }, { status: 400 });
  }

  if (body.website && String(body.website).length > 0) {
    console.warn(JSON.stringify({ evt: "public_task_create", outcome: "honeypot", ipHash }));
    return NextResponse.json({ error: "Invalid request", code: "VALIDATION_ERROR" }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description =
    typeof body.description === "string" ? body.description.slice(0, 2000).trim() : "";
  const priorityRaw = typeof body.priority === "string" ? body.priority : "MEDIUM";
  const eventId = typeof body.eventId === "string" ? body.eventId.trim() : "";
  const assignedToId = typeof body.assignedToId === "number" ? body.assignedToId : NaN;
  const publicCreatorName =
    typeof body.publicCreatorName === "string" ? body.publicCreatorName.trim().slice(0, 120) : "";
  const publicCreatorEmailRaw =
    typeof body.publicCreatorEmail === "string" ? body.publicCreatorEmail.trim().slice(0, 320) : "";
  const notifyCreatorOnUpdates = Boolean(body.notifyCreatorOnUpdates);
  const turnstileToken = typeof body.turnstileToken === "string" ? body.turnstileToken : "";

  if (!title || title.length > 200) {
    return NextResponse.json({ error: "Invalid title", code: "VALIDATION_ERROR" }, { status: 400 });
  }
  if (!eventId) {
    return NextResponse.json({ error: "eventId required", code: "VALIDATION_ERROR" }, { status: 400 });
  }
  if (!Number.isFinite(assignedToId) || assignedToId < 1) {
    return NextResponse.json({ error: "assignedToId required", code: "VALIDATION_ERROR" }, { status: 400 });
  }
  if (!publicCreatorName) {
    return NextResponse.json({ error: "Name required", code: "VALIDATION_ERROR" }, { status: 400 });
  }
  if (!PRIORITIES.includes(priorityRaw as TaskPriority)) {
    return NextResponse.json({ error: "Invalid priority", code: "VALIDATION_ERROR" }, { status: 400 });
  }
  if (!turnstileToken) {
    return NextResponse.json({ error: "CAPTCHA required", code: "CAPTCHA_REQUIRED" }, { status: 400 });
  }

  const captchaOk = await verifyTurnstileToken(turnstileToken, ip);
  if (!captchaOk) {
    console.warn(JSON.stringify({ evt: "public_task_create", outcome: "captcha_failed", ipHash }));
    return NextResponse.json({ error: "CAPTCHA verification failed", code: "CAPTCHA_FAILED" }, { status: 400 });
  }

  let publicCreatorEmail: string | null = null;
  if (publicCreatorEmailRaw) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(publicCreatorEmailRaw)) {
      return NextResponse.json({ error: "Invalid email", code: "VALIDATION_ERROR" }, { status: 400 });
    }
    publicCreatorEmail = publicCreatorEmailRaw;
  }

  const event = await prisma.event.findFirst({
    where: { id: eventId, allowPublicTasks: true },
    select: { id: true, profileId: true, name: true },
  });

  if (!event) {
    return NextResponse.json({ error: "Event not found", code: "NOT_FOUND" }, { status: 404 });
  }

  const coordinator = await prisma.staff.findFirst({
    where: {
      id: assignedToId,
      profileId: event.profileId,
      staffRole: "COORDINATOR",
      status: "active",
    },
    select: { id: true, name: true },
  });

  if (!coordinator) {
    return NextResponse.json(
      { error: "Coordinator not available for this event", code: "INVALID_ASSIGNEE" },
      { status: 400 }
    );
  }

  const editorToken = crypto.randomBytes(32).toString("hex");
  const creatorEditTokenHash = await bcrypt.hash(editorToken, 10);
  const creatorEditTokenExpiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

  const task = await prisma.coordinatorTask.create({
    data: {
      title,
      description: description || null,
      priority: priorityRaw as TaskPriority,
      assignedToId: coordinator.id,
      assignedById: null,
      creationSource: "PUBLIC",
      publicCreatorName,
      publicCreatorEmail,
      notifyCreatorOnUpdates,
      creatorEditTokenHash,
      creatorEditTokenExpiresAt,
      eventId: event.id,
    },
    include: {
      assignedTo: { select: { id: true, name: true, avatar: true } },
      event: { select: { id: true, name: true } },
    },
  });

  await logCoordinatorTaskAudit({
    taskId: task.id,
    action: "TASK_CREATED_PUBLIC",
    actorType: "PUBLIC_TOKEN",
    metadata: {
      eventId: event.id,
      assignedToId: coordinator.id,
      notifyCreatorOnUpdates,
      hasEmail: !!publicCreatorEmail,
    },
    ipHash,
    userAgent: req.headers.get("user-agent"),
  });

  await prisma.notification.create({
    data: {
      staffId: coordinator.id,
      type: "TASK_ASSIGNED",
      title: "New public task request",
      body: `${publicCreatorName}: ${title}`,
      data: { taskId: task.id, priority: task.priority, creationSource: "PUBLIC" },
      taskId: task.id,
    },
  });

  const safePayload = sanitizePublicTaskResponse(task as unknown as Record<string, unknown>);
  await emitCoordinatorTaskAssigned(coordinator.id, safePayload);

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
  const editUrl = `${appUrl}/public/request-coordinator-task?taskId=${encodeURIComponent(task.id)}&token=${encodeURIComponent(editorToken)}`;

  if (publicCreatorEmail) {
    void sendPublicTaskConfirmationEmail({
      to: publicCreatorEmail,
      taskTitle: title,
      taskId: task.id,
      editUrl,
    }).catch((e) =>
      console.error(JSON.stringify({ evt: "public_task_email_failed", taskId: task.id, message: String(e) }))
    );
  }

  console.log(
    JSON.stringify({
      evt: "public_task_create",
      outcome: "ok",
      taskId: task.id,
      eventId: event.id,
      ipHash,
    })
  );

  return NextResponse.json(
    {
      task: safePayload,
      editorToken,
      editUrl,
      message:
        "Task submitted. Save your editor token or link; they are not shown again if you leave this page.",
    },
    { status: 201 }
  );
}
