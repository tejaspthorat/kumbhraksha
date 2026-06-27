"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const crypto_1 = __importDefault(require("crypto"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = __importDefault(require("../lib/prisma"));
const publicTaskRateLimit_1 = require("../lib/publicTaskRateLimit");
const publicTaskIp_1 = require("../lib/publicTaskIp");
const verifyTurnstile_1 = require("../lib/verifyTurnstile");
const coordinatorTaskAudit_1 = require("../lib/coordinatorTaskAudit");
const emitCoordinatorTaskAssigned_1 = require("../lib/emitCoordinatorTaskAssigned");
const sendPublicTaskEmail_1 = require("../lib/sendPublicTaskEmail");
const router = (0, express_1.Router)();
const CREATE_WINDOW_MS = 60 * 60 * 1000;
const MAX_CREATES_PER_HOUR = 120;
const WINDOW_MS = 60_000;
const MAX_COORDS_PER_WINDOW = 120;
const MAX_EVENTS_PER_WINDOW = 60;
const READ_WINDOW_MS = 60_000;
const MAX_READS = 40;
const PATCH_WINDOW_MS = 60_000;
const MAX_PATCHES = 20;
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
function sanitizePublicTask(task) {
    const { creatorEditTokenHash: _h, creatorEditTokenExpiresAt: _e, ...rest } = task;
    return rest;
}
function resolveEditorToken(req, bodyToken) {
    const header = req.headers["x-task-editor-token"];
    if (typeof header === "string")
        return header;
    const q = req.query.token;
    if (typeof q === "string")
        return q;
    return typeof bodyToken === "string" ? bodyToken : null;
}
// ── GET /api/public/events ──
router.get('/events', async (req, res) => {
    const ip = (0, publicTaskIp_1.getClientIp)(req);
    const ipHash = (0, publicTaskIp_1.hashClientIp)(ip);
    if (!(0, publicTaskRateLimit_1.publicTaskRateLimit)(`public:events:${ipHash ?? "unknown"}`, MAX_EVENTS_PER_WINDOW, WINDOW_MS)) {
        return res.status(429).json({ error: "Too many requests", code: "RATE_LIMITED" });
    }
    const events = await prisma_1.default.event.findMany({
        where: { allowPublicTasks: true },
        select: {
            id: true,
            name: true,
            location: true,
            startDate: true,
            endDate: true,
        },
        orderBy: { startDate: "desc" },
        take: 50,
    });
    return res.json({ data: events });
});
// ── GET /api/public/coordinators ──
router.get('/coordinators', async (req, res) => {
    const ip = (0, publicTaskIp_1.getClientIp)(req);
    const ipHash = (0, publicTaskIp_1.hashClientIp)(ip);
    if (!(0, publicTaskRateLimit_1.publicTaskRateLimit)(`public:coord:${ipHash ?? "unknown"}`, MAX_COORDS_PER_WINDOW, WINDOW_MS)) {
        return res.status(429).json({ error: "Too many requests", code: "RATE_LIMITED" });
    }
    const eventId = req.query.eventId;
    if (!eventId) {
        return res.status(400).json({ error: "eventId query parameter required", code: "VALIDATION_ERROR" });
    }
    const event = await prisma_1.default.event.findFirst({
        where: { id: eventId, allowPublicTasks: true },
        select: { profileId: true },
    });
    if (!event) {
        return res.status(404).json({ error: "Event not found", code: "NOT_FOUND" });
    }
    const coordinators = await prisma_1.default.staff.findMany({
        where: {
            profileId: event.profileId,
            staffRole: "COORDINATOR",
            status: "active",
        },
        select: {
            id: true,
            name: true,
            avatar: true,
            zone: { select: { id: true, name: true } },
        },
        orderBy: { name: "asc" },
        take: 100,
    });
    return res.json({ data: coordinators });
});
// ── POST /api/public/coordinator-tasks ──
router.post('/coordinator-tasks', async (req, res) => {
    const ip = (0, publicTaskIp_1.getClientIp)(req);
    const ipHash = (0, publicTaskIp_1.hashClientIp)(ip);
    if (!(0, publicTaskRateLimit_1.publicTaskRateLimit)(`public:task:create:${ipHash ?? "unknown"}`, MAX_CREATES_PER_HOUR, CREATE_WINDOW_MS)) {
        console.warn(JSON.stringify({ evt: "public_task_create", outcome: "rate_limited", ipHash: ipHash ?? null }));
        return res.status(429).json({ error: "Too many submissions. Try again later.", code: "RATE_LIMITED" });
    }
    const body = req.body || {};
    if (body.website && String(body.website).length > 0) {
        console.warn(JSON.stringify({ evt: "public_task_create", outcome: "honeypot", ipHash }));
        return res.status(400).json({ error: "Invalid request", code: "VALIDATION_ERROR" });
    }
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const description = typeof body.description === "string" ? body.description.slice(0, 2000).trim() : "";
    const priorityRaw = typeof body.priority === "string" ? body.priority : "MEDIUM";
    const eventId = typeof body.eventId === "string" ? body.eventId.trim() : "";
    const assignedToId = typeof body.assignedToId === "number" ? body.assignedToId : NaN;
    const publicCreatorName = typeof body.publicCreatorName === "string" ? body.publicCreatorName.trim().slice(0, 120) : "";
    const publicCreatorEmailRaw = typeof body.publicCreatorEmail === "string" ? body.publicCreatorEmail.trim().slice(0, 320) : "";
    const notifyCreatorOnUpdates = Boolean(body.notifyCreatorOnUpdates);
    const turnstileToken = typeof body.turnstileToken === "string" ? body.turnstileToken : "";
    if (!title || title.length > 200) {
        return res.status(400).json({ error: "Invalid title", code: "VALIDATION_ERROR" });
    }
    if (!eventId) {
        return res.status(400).json({ error: "eventId required", code: "VALIDATION_ERROR" });
    }
    if (!Number.isFinite(assignedToId) || assignedToId < 1) {
        return res.status(400).json({ error: "assignedToId required", code: "VALIDATION_ERROR" });
    }
    if (!publicCreatorName) {
        return res.status(400).json({ error: "Name required", code: "VALIDATION_ERROR" });
    }
    if (!PRIORITIES.includes(priorityRaw)) {
        return res.status(400).json({ error: "Invalid priority", code: "VALIDATION_ERROR" });
    }
    if (!turnstileToken) {
        return res.status(400).json({ error: "CAPTCHA required", code: "CAPTCHA_REQUIRED" });
    }
    const captchaOk = await (0, verifyTurnstile_1.verifyTurnstileToken)(turnstileToken, ip);
    if (!captchaOk) {
        console.warn(JSON.stringify({ evt: "public_task_create", outcome: "captcha_failed", ipHash }));
        return res.status(400).json({ error: "CAPTCHA verification failed", code: "CAPTCHA_FAILED" });
    }
    let publicCreatorEmail = null;
    if (publicCreatorEmailRaw) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(publicCreatorEmailRaw)) {
            return res.status(400).json({ error: "Invalid email", code: "VALIDATION_ERROR" });
        }
        publicCreatorEmail = publicCreatorEmailRaw;
    }
    const event = await prisma_1.default.event.findFirst({
        where: { id: eventId, allowPublicTasks: true },
        select: { id: true, profileId: true, name: true },
    });
    if (!event) {
        return res.status(404).json({ error: "Event not found", code: "NOT_FOUND" });
    }
    const coordinator = await prisma_1.default.staff.findFirst({
        where: {
            id: assignedToId,
            profileId: event.profileId,
            staffRole: "COORDINATOR",
            status: "active",
        },
        select: { id: true, name: true },
    });
    if (!coordinator) {
        return res.status(400).json({ error: "Coordinator not available for this event", code: "INVALID_ASSIGNEE" });
    }
    const editorToken = crypto_1.default.randomBytes(32).toString("hex");
    const creatorEditTokenHash = await bcryptjs_1.default.hash(editorToken, 10);
    const creatorEditTokenExpiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
    const task = await prisma_1.default.coordinatorTask.create({
        data: {
            title,
            description: description || null,
            priority: priorityRaw,
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
    await (0, coordinatorTaskAudit_1.logCoordinatorTaskAudit)({
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
        userAgent: req.headers["user-agent"],
    });
    await prisma_1.default.notification.create({
        data: {
            staffId: coordinator.id,
            type: "TASK_ASSIGNED",
            title: "New public task request",
            body: `${publicCreatorName}: ${title}`,
            data: { taskId: task.id, priority: task.priority, creationSource: "PUBLIC" },
            taskId: task.id,
        },
    });
    const safePayload = sanitizePublicTask(task);
    await (0, emitCoordinatorTaskAssigned_1.emitCoordinatorTaskAssigned)(coordinator.id, safePayload);
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
    const editUrl = `${appUrl}/public/request-coordinator-task?taskId=${encodeURIComponent(task.id)}&token=${encodeURIComponent(editorToken)}`;
    if (publicCreatorEmail) {
        void (0, sendPublicTaskEmail_1.sendPublicTaskConfirmationEmail)({
            to: publicCreatorEmail,
            taskTitle: title,
            taskId: task.id,
            editUrl,
        }).catch((e) => console.error(JSON.stringify({ evt: "public_task_email_failed", taskId: task.id, message: String(e) })));
    }
    console.log(JSON.stringify({
        evt: "public_task_create",
        outcome: "ok",
        taskId: task.id,
        eventId: event.id,
        ipHash,
    }));
    return res.status(201).json({
        task: safePayload,
        editorToken,
        editUrl,
        message: "Task submitted. Save your editor token or link; they are not shown again if you leave this page.",
    });
});
// ── GET /api/public/coordinator-tasks/:taskId ──
router.get('/coordinator-tasks/:taskId', async (req, res) => {
    const { taskId } = req.params;
    const ip = (0, publicTaskIp_1.getClientIp)(req);
    const ipHash = (0, publicTaskIp_1.hashClientIp)(ip);
    if (!(0, publicTaskRateLimit_1.publicTaskRateLimit)(`public:task:read:${ipHash ?? "unknown"}`, MAX_READS, READ_WINDOW_MS)) {
        return res.status(429).json({ error: "Too many requests", code: "RATE_LIMITED" });
    }
    const plain = resolveEditorToken(req, null);
    if (!plain) {
        return res.status(401).json({ error: "Editor token required", code: "TOKEN_REQUIRED" });
    }
    const task = await prisma_1.default.coordinatorTask.findFirst({
        where: { id: taskId, creationSource: "PUBLIC" },
        include: {
            assignedTo: { select: { id: true, name: true, avatar: true } },
            event: { select: { id: true, name: true } },
        },
    });
    if (!task?.creatorEditTokenHash || !task.creatorEditTokenExpiresAt) {
        return res.status(404).json({ error: "Not found", code: "NOT_FOUND" });
    }
    if (task.creatorEditTokenExpiresAt.getTime() < Date.now()) {
        return res.status(403).json({ error: "Edit link expired", code: "TOKEN_EXPIRED" });
    }
    const ok = await bcryptjs_1.default.compare(plain, task.creatorEditTokenHash);
    if (!ok) {
        console.warn(JSON.stringify({ evt: "public_task_token_fail", taskId, ipHash }));
        return res.status(403).json({ error: "Invalid token", code: "TOKEN_INVALID" });
    }
    return res.json({ task: sanitizePublicTask(task) });
});
// ── PATCH /api/public/coordinator-tasks/:taskId ──
router.patch('/coordinator-tasks/:taskId', async (req, res) => {
    const { taskId } = req.params;
    const ip = (0, publicTaskIp_1.getClientIp)(req);
    const ipHash = (0, publicTaskIp_1.hashClientIp)(ip);
    if (!(0, publicTaskRateLimit_1.publicTaskRateLimit)(`public:task:patch:${ipHash ?? "unknown"}`, MAX_PATCHES, PATCH_WINDOW_MS)) {
        return res.status(429).json({ error: "Too many requests", code: "RATE_LIMITED" });
    }
    const body = req.body || {};
    const plain = resolveEditorToken(req, body.editorToken ?? null);
    if (!plain) {
        return res.status(401).json({ error: "Editor token required", code: "TOKEN_REQUIRED" });
    }
    const existing = await prisma_1.default.coordinatorTask.findFirst({
        where: { id: taskId, creationSource: "PUBLIC" },
    });
    if (!existing?.creatorEditTokenHash || !existing.creatorEditTokenExpiresAt) {
        return res.status(404).json({ error: "Not found", code: "NOT_FOUND" });
    }
    if (existing.creatorEditTokenExpiresAt.getTime() < Date.now()) {
        return res.status(403).json({ error: "Edit link expired", code: "TOKEN_EXPIRED" });
    }
    const ok = await bcryptjs_1.default.compare(plain, existing.creatorEditTokenHash);
    if (!ok) {
        return res.status(403).json({ error: "Invalid token", code: "TOKEN_INVALID" });
    }
    const title = typeof body.title === "string" ? body.title.trim().slice(0, 200) : undefined;
    const description = typeof body.description === "string" ? body.description.slice(0, 2000).trim() : undefined;
    const priority = typeof body.priority === "string" && PRIORITIES.includes(body.priority)
        ? body.priority
        : undefined;
    if (title === undefined && description === undefined && priority === undefined) {
        return res.status(400).json({ error: "Provide title, description, or priority to update", code: "VALIDATION_ERROR" });
    }
    const updated = await prisma_1.default.coordinatorTask.update({
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
    await (0, coordinatorTaskAudit_1.logCoordinatorTaskAudit)({
        taskId,
        action: "TASK_CONTENT_UPDATED_PUBLIC",
        actorType: "PUBLIC_TOKEN",
        metadata: { fields: { title: title !== undefined, description: description !== undefined, priority: priority !== undefined } },
        ipHash,
        userAgent: req.headers["user-agent"],
    });
    await prisma_1.default.notification.create({
        data: {
            staffId: updated.assignedToId,
            type: "TASK_UPDATED",
            title: "Public task updated by reporter",
            body: `"${updated.title}" was revised by the person who submitted it.`,
            data: { taskId },
            taskId,
        },
    });
    const safe = sanitizePublicTask(updated);
    await (0, emitCoordinatorTaskAssigned_1.emitCoordinatorTaskAssigned)(updated.assignedToId, {
        ...safe,
        _publicReporterUpdate: true,
    });
    console.log(JSON.stringify({ evt: "public_task_patch", outcome: "ok", taskId, ipHash }));
    return res.json({ task: safe });
});
exports.default = router;
