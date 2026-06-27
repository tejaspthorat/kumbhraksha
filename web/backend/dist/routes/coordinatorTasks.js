"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const prisma_1 = __importDefault(require("../lib/prisma"));
const emitCoordinatorTaskAssigned_1 = require("../lib/emitCoordinatorTaskAssigned");
const coordinatorTaskAudit_1 = require("../lib/coordinatorTaskAudit");
const router = (0, express_1.Router)();
// Apply auth middleware to all routes in this router
router.use(auth_1.requireAdminAuth);
/**
 * POST /api/coordinator-tasks — Admin creates a coordinator task.
 */
router.post('/', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        const { title, description, priority, assignedToId, eventId, locationLat, locationLng, locationLabel, deadline, } = req.body;
        if (!title || !assignedToId || !eventId) {
            return res.status(400).json({ error: 'title, assignedToId and eventId are required' });
        }
        const task = await prisma_1.default.coordinatorTask.create({
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
        await (0, coordinatorTaskAudit_1.logCoordinatorTaskAudit)({
            taskId: task.id,
            action: 'CREATED',
            actorType: 'PROFILE',
            actorProfileId: userId,
            metadata: { title, priority: priority || 'MEDIUM', assignedToId },
        });
        // Real-time push to coordinator's mobile socket room
        await (0, emitCoordinatorTaskAssigned_1.emitCoordinatorTaskAssigned)(Number(assignedToId), task);
        return res.status(201).json(task);
    }
    catch (err) {
        console.error('[POST /api/coordinator-tasks]', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
/**
 * GET /api/coordinator-tasks — List coordinator tasks with optional filters.
 */
router.get('/', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        const eventId = req.query.eventId;
        const assignedToId = req.query.assignedToId;
        const status = req.query.status;
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '50', 10)));
        const tasks = await prisma_1.default.coordinatorTask.findMany({
            where: {
                ...(eventId && { eventId }),
                ...(assignedToId && { assignedToId: Number(assignedToId) }),
                ...(status && { status: status }),
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
        return res.json(tasks);
    }
    catch (err) {
        console.error('[GET /api/coordinator-tasks]', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
