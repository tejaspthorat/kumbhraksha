"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../lib/prisma"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Apply auth middleware to protect all internal tasks endpoints
router.use(auth_1.requireAdminAuth);
const PRIORITIES = ["LOW", "MEDIUM", "HIGH"];
const STATUSES = ["OPEN", "IN_PROGRESS", "COMPLETED"];
function errorResponse(res, message, code, status, details) {
    return res.status(status).json({ error: message, code, ...(details ? { details } : {}) });
}
function formatTask(task) {
    const assignees = task.assignees ?? [];
    return {
        ...task,
        assignees: assignees.map((a) => ({
            id: a.id,
            name: a.name ?? null,
            email: a.email,
        })),
    };
}
// ── GET /api/tasks ──
router.get('/', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return errorResponse(res, "Authentication required", "UNAUTHORIZED", 401);
        }
        const statusFilter = req.query.status?.toUpperCase();
        const priorityFilter = req.query.priority?.toUpperCase();
        const role = req.query.role;
        const page = Math.max(1, parseInt(req.query.page || "1", 10));
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || "20", 10)));
        const skip = (page - 1) * limit;
        const where = {};
        if (statusFilter && STATUSES.includes(statusFilter)) {
            where.status = statusFilter;
        }
        if (priorityFilter && PRIORITIES.includes(priorityFilter)) {
            where.priority = priorityFilter;
        }
        if (role === "creator") {
            where.creatorId = userId;
        }
        else if (role === "assignee") {
            where.assignees = { some: { id: userId } };
        }
        else {
            where.OR = [{ creatorId: userId }, { assignees: { some: { id: userId } } }];
        }
        const [tasks, total] = await Promise.all([
            prisma_1.default.task.findMany({
                where,
                include: {
                    assignees: { select: { id: true, name: true, email: true } },
                    creator: { select: { id: true, name: true, email: true } },
                },
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            }),
            prisma_1.default.task.count({ where }),
        ]);
        return res.json({
            tasks: tasks.map((t) => formatTask(t)),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    }
    catch (err) {
        console.error('[GET /api/tasks]', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
// ── POST /api/tasks ──
router.post('/', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return errorResponse(res, "Authentication required", "UNAUTHORIZED", 401);
        }
        const body = req.body || {};
        const title = typeof body.title === "string" ? body.title.trim() : "";
        if (!title) {
            return errorResponse(res, "title is required and must be a non-empty string", "VALIDATION_ERROR", 400);
        }
        if (title.length > 500) {
            return errorResponse(res, "title must be 500 characters or fewer", "VALIDATION_ERROR", 400);
        }
        const description = typeof body.description === "string" ? body.description.trim().slice(0, 5000) : null;
        let dueDate = null;
        if (body.dueDate !== undefined && body.dueDate !== null) {
            if (typeof body.dueDate !== "string") {
                return errorResponse(res, "dueDate must be an ISO 8601 date-time string", "VALIDATION_ERROR", 400);
            }
            const parsed = new Date(body.dueDate);
            if (isNaN(parsed.getTime())) {
                return errorResponse(res, "dueDate is not a valid ISO 8601 date-time", "VALIDATION_ERROR", 422);
            }
            dueDate = parsed;
        }
        const priorityRaw = typeof body.priority === "string" ? body.priority.toUpperCase() : "MEDIUM";
        if (!PRIORITIES.includes(priorityRaw)) {
            return errorResponse(res, `priority must be one of: ${PRIORITIES.join(", ").toLowerCase()}`, "VALIDATION_ERROR", 400);
        }
        const priority = priorityRaw;
        const statusRaw = typeof body.status === "string" ? body.status.toUpperCase() : "OPEN";
        if (!STATUSES.includes(statusRaw)) {
            return errorResponse(res, `status must be one of: ${STATUSES.join(", ").toLowerCase()}`, "VALIDATION_ERROR", 400);
        }
        const status = statusRaw;
        let assigneeIds = [];
        if (body.assignees !== undefined && body.assignees !== null) {
            if (!Array.isArray(body.assignees)) {
                return errorResponse(res, "assignees must be an array of user IDs", "VALIDATION_ERROR", 400);
            }
            for (const id of body.assignees) {
                if (typeof id !== "string" || !id.trim()) {
                    return errorResponse(res, "Each assignee must be a non-empty string user ID", "VALIDATION_ERROR", 400);
                }
            }
            assigneeIds = [...new Set(body.assignees)];
            if (assigneeIds.length > 0) {
                const existingProfiles = await prisma_1.default.profile.findMany({
                    where: { id: { in: assigneeIds } },
                    select: { id: true },
                });
                const existingIds = new Set(existingProfiles.map((p) => p.id));
                const missing = assigneeIds.filter((id) => !existingIds.has(id));
                if (missing.length > 0) {
                    return errorResponse(res, `The following user IDs do not exist: ${missing.join(", ")}`, "INVALID_ASSIGNEES", 400, { nonExistentIds: missing.join(", ") });
                }
            }
        }
        const creatorProfile = await prisma_1.default.profile.findUnique({
            where: { id: userId },
            select: { id: true },
        });
        if (!creatorProfile) {
            return errorResponse(res, "Your user profile was not found. Please complete onboarding first.", "PROFILE_NOT_FOUND", 403);
        }
        const task = await prisma_1.default.task.create({
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
        return res.status(201).json({ task: formatTask(task) });
    }
    catch (err) {
        console.error('[POST /api/tasks]', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
// ── GET /api/tasks/:taskId ──
router.get('/:taskId', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return errorResponse(res, "Authentication required", "UNAUTHORIZED", 401);
        }
        const { taskId } = req.params;
        const task = await prisma_1.default.task.findUnique({
            where: { id: taskId },
            include: {
                assignees: { select: { id: true, name: true, email: true } },
                creator: { select: { id: true, name: true, email: true } },
            },
        });
        if (!task) {
            return errorResponse(res, "Task not found", "NOT_FOUND", 404);
        }
        const isCreator = task.creatorId === userId;
        const isAssignee = task.assignees.some((a) => a.id === userId);
        if (!isCreator && !isAssignee) {
            return errorResponse(res, "You do not have permission to view this task", "FORBIDDEN", 403);
        }
        return res.json({ task: formatTask(task) });
    }
    catch (err) {
        console.error('[GET /api/tasks/:taskId]', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
// ── PATCH /api/tasks/:taskId ──
router.patch('/:taskId', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return errorResponse(res, "Authentication required", "UNAUTHORIZED", 401);
        }
        const { taskId } = req.params;
        const existing = await prisma_1.default.task.findUnique({
            where: { id: taskId },
            include: {
                assignees: { select: { id: true } },
            },
        });
        if (!existing) {
            return errorResponse(res, "Task not found", "NOT_FOUND", 404);
        }
        const isCreator = existing.creatorId === userId;
        const isAssignee = existing.assignees.some((a) => a.id === userId);
        if (!isCreator && !isAssignee) {
            return errorResponse(res, "You do not have permission to update this task", "FORBIDDEN", 403);
        }
        const body = req.body || {};
        const updateData = {};
        if (body.title !== undefined) {
            const title = typeof body.title === "string" ? body.title.trim() : "";
            if (!title) {
                return errorResponse(res, "title must be a non-empty string", "VALIDATION_ERROR", 400);
            }
            if (title.length > 500) {
                return errorResponse(res, "title must be 500 characters or fewer", "VALIDATION_ERROR", 400);
            }
            updateData.title = title;
        }
        if (body.description !== undefined) {
            updateData.description =
                body.description === null
                    ? null
                    : typeof body.description === "string"
                        ? body.description.trim().slice(0, 5000)
                        : null;
        }
        if (body.dueDate !== undefined) {
            if (body.dueDate === null) {
                updateData.dueDate = null;
            }
            else if (typeof body.dueDate === "string") {
                const parsed = new Date(body.dueDate);
                if (isNaN(parsed.getTime())) {
                    return errorResponse(res, "dueDate is not a valid ISO 8601 date-time", "VALIDATION_ERROR", 422);
                }
                updateData.dueDate = parsed;
            }
            else {
                return errorResponse(res, "dueDate must be an ISO 8601 date-time string or null", "VALIDATION_ERROR", 400);
            }
        }
        if (body.priority !== undefined) {
            const priorityRaw = typeof body.priority === "string" ? body.priority.toUpperCase() : "";
            if (!PRIORITIES.includes(priorityRaw)) {
                return errorResponse(res, `priority must be one of: ${PRIORITIES.join(", ").toLowerCase()}`, "VALIDATION_ERROR", 400);
            }
            updateData.priority = priorityRaw;
        }
        if (body.status !== undefined) {
            const statusRaw = typeof body.status === "string" ? body.status.toUpperCase() : "";
            if (!STATUSES.includes(statusRaw)) {
                return errorResponse(res, `status must be one of: ${STATUSES.join(", ").toLowerCase()}`, "VALIDATION_ERROR", 400);
            }
            updateData.status = statusRaw;
        }
        let assigneeConnect;
        if (body.assignees !== undefined) {
            if (body.assignees === null) {
                assigneeConnect = [];
            }
            else if (Array.isArray(body.assignees)) {
                for (const id of body.assignees) {
                    if (typeof id !== "string" || !id.trim()) {
                        return errorResponse(res, "Each assignee must be a non-empty string user ID", "VALIDATION_ERROR", 400);
                    }
                }
                const dedupedIds = [...new Set(body.assignees)];
                if (dedupedIds.length > 0) {
                    const existingProfiles = await prisma_1.default.profile.findMany({
                        where: { id: { in: dedupedIds } },
                        select: { id: true },
                    });
                    const existingIds = new Set(existingProfiles.map((p) => p.id));
                    const missing = dedupedIds.filter((id) => !existingIds.has(id));
                    if (missing.length > 0) {
                        return errorResponse(res, `The following user IDs do not exist: ${missing.join(", ")}`, "INVALID_ASSIGNEES", 400, { nonExistentIds: missing.join(", ") });
                    }
                }
                assigneeConnect = dedupedIds.map((id) => ({ id }));
            }
            else {
                return errorResponse(res, "assignees must be an array of user IDs or null", "VALIDATION_ERROR", 400);
            }
        }
        if (Object.keys(updateData).length === 0 && assigneeConnect === undefined) {
            return errorResponse(res, "No valid fields provided for update", "VALIDATION_ERROR", 400);
        }
        const updated = await prisma_1.default.task.update({
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
        return res.json({ task: formatTask(updated) });
    }
    catch (err) {
        console.error('[PATCH /api/tasks/:taskId]', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
// ── DELETE /api/tasks/:taskId ──
router.delete('/:taskId', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return errorResponse(res, "Authentication required", "UNAUTHORIZED", 401);
        }
        const { taskId } = req.params;
        const existing = await prisma_1.default.task.findUnique({
            where: { id: taskId },
            select: { creatorId: true },
        });
        if (!existing) {
            return errorResponse(res, "Task not found", "NOT_FOUND", 404);
        }
        if (existing.creatorId !== userId) {
            return errorResponse(res, "Only the task creator can delete this task", "FORBIDDEN", 403);
        }
        await prisma_1.default.task.delete({ where: { id: taskId } });
        return res.status(200).json({ message: "Task deleted successfully" });
    }
    catch (err) {
        console.error('[DELETE /api/tasks/:taskId]', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
