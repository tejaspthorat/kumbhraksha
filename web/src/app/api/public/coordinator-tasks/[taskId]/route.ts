import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { publicTaskRateLimit } from "@/lib/publicTaskRateLimit";
import { getClientIp, hashClientIp } from "@/lib/publicTaskIp";
import { logCoordinatorTaskAudit } from "@/lib/coordinatorTaskAudit";
import { emitCoordinatorTaskAssigned } from "@/lib/emitCoordinatorTaskAssigned";
import type { TaskPriority } from "@prisma/client";

const READ_WINDOW_MS = 60_000;
const MAX_READS = 40;
const PATCH_WINDOW_MS = 60_000;
const MAX_PATCHES = 20;

const PRIORITIES: TaskPriority[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

function sanitizePublicTask(task: Record<string, unknown>) {
  const { creatorEditTokenHash: _h, creatorEditTokenExpiresAt: _e, ...rest } = task;
  return rest;
}

async function resolveEditorToken(req: NextRequest, bodyToken?: string | null) {
  const header = req.headers.get("x-task-editor-token");
  if (header) return header;
  const q = req.nextUrl.searchParams.get("token");
  if (q) return q;
  return typeof bodyToken === "string" ? bodyToken : null;
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await ctx.params;
  const ip = getClientIp(req);
  const ipHash = hashClientIp(ip);
  if (!publicTaskRateLimit(`public:task:read:${ipHash ?? "unknown"}`, MAX_READS, READ_WINDOW_MS)) {
    return NextResponse.json({ error: "Too many requests", code: "RATE_LIMITED" }, { status: 429 });
  }

  const plain = await resolveEditorToken(req, null);
  if (!plain) {
    return NextResponse.json({ error: "Editor token required", code: "TOKEN_REQUIRED" }, { status: 401 });
  }

  const task = await prisma.coordinatorTask.findFirst({
    where: { id: taskId, creationSource: "PUBLIC" },
    include: {
      assignedTo: { select: { id: true, name: true, avatar: true } },
      event: { select: { id: true, name: true } },
    },
  });

  if (!task?.creatorEditTokenHash || !task.creatorEditTokenExpiresAt) {
    return NextResponse.json({ error: "Not found", code: "NOT_FOUND" }, { status: 404 });
  }

  if (task.creatorEditTokenExpiresAt.getTime() < Date.now()) {
    return NextResponse.json({ error: "Edit link expired", code: "TOKEN_EXPIRED" }, { status: 403 });
  }

  const ok = await bcrypt.compare(plain, task.creatorEditTokenHash);
  if (!ok) {
    console.warn(JSON.stringify({ evt: "public_task_token_fail", taskId, ipHash }));
    return NextResponse.json({ error: "Invalid token", code: "TOKEN_INVALID" }, { status: 403 });
  }

  return NextResponse.json({ task: sanitizePublicTask(task as unknown as Record<string, unknown>) });
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await ctx.params;
  const ip = getClientIp(req);
  const ipHash = hashClientIp(ip);
  if (!publicTaskRateLimit(`public:task:patch:${ipHash ?? "unknown"}`, MAX_PATCHES, PATCH_WINDOW_MS)) {
    return NextResponse.json({ error: "Too many requests", code: "RATE_LIMITED" }, { status: 429 });
  }

  let body: { title?: string; description?: string; priority?: string; editorToken?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON", code: "VALIDATION_ERROR" }, { status: 400 });
  }

  const plain = await resolveEditorToken(req, body.editorToken ?? null);
  if (!plain) {
    return NextResponse.json({ error: "Editor token required", code: "TOKEN_REQUIRED" }, { status: 401 });
  }

  const existing = await prisma.coordinatorTask.findFirst({
    where: { id: taskId, creationSource: "PUBLIC" },
  });

  if (!existing?.creatorEditTokenHash || !existing.creatorEditTokenExpiresAt) {
    return NextResponse.json({ error: "Not found", code: "NOT_FOUND" }, { status: 404 });
  }

  if (existing.creatorEditTokenExpiresAt.getTime() < Date.now()) {
    return NextResponse.json({ error: "Edit link expired", code: "TOKEN_EXPIRED" }, { status: 403 });
  }

  const ok = await bcrypt.compare(plain, existing.creatorEditTokenHash);
  if (!ok) {
    return NextResponse.json({ error: "Invalid token", code: "TOKEN_INVALID" }, { status: 403 });
  }

  const title =
    typeof body.title === "string" ? body.title.trim().slice(0, 200) : undefined;
  const description =
    typeof body.description === "string" ? body.description.slice(0, 2000).trim() : undefined;
  const priority =
    typeof body.priority === "string" && PRIORITIES.includes(body.priority as TaskPriority)
      ? (body.priority as TaskPriority)
      : undefined;

  if (title === undefined && description === undefined && priority === undefined) {
    return NextResponse.json(
      { error: "Provide title, description, or priority to update", code: "VALIDATION_ERROR" },
      { status: 400 }
    );
  }

  const updated = await prisma.coordinatorTask.update({
    where: { id: taskId },
    data: {
      ...(title !== undefined ? { title } : {}),
      ...(description !== undefined ? { description: description || null } : {}),
      ...(priority !== undefined ? { priority } : {}),
    },
    include: {
      assignedTo: { select: { id: true, name: true, avatar: true } },
      event: { select: { id: true, name: true } },
    },
  });

  await logCoordinatorTaskAudit({
    taskId,
    action: "TASK_CONTENT_UPDATED_PUBLIC",
    actorType: "PUBLIC_TOKEN",
    metadata: { fields: { title: title !== undefined, description: description !== undefined, priority: priority !== undefined } },
    ipHash,
    userAgent: req.headers.get("user-agent"),
  });

  await prisma.notification.create({
    data: {
      staffId: updated.assignedToId,
      type: "TASK_UPDATED",
      title: "Public task updated by reporter",
      body: `"${updated.title}" was revised by the person who submitted it.`,
      data: { taskId },
      taskId,
    },
  });

  const safe = sanitizePublicTask(updated as unknown as Record<string, unknown>);
  await emitCoordinatorTaskAssigned(updated.assignedToId, {
    ...safe,
    _publicReporterUpdate: true,
  });

  console.log(JSON.stringify({ evt: "public_task_patch", outcome: "ok", taskId, ipHash }));

  return NextResponse.json({ task: safe });
}
