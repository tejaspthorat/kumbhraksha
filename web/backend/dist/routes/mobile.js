"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../lib/prisma"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
/**
 * POST /api/mobile/login — Coordinator mobile login.
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        const staff = await prisma_1.default.staff.findUnique({ where: { email } });
        if (!staff) {
            return res.status(404).json({ error: 'Coordinator not found' });
        }
        if (staff.staffRole !== 'COORDINATOR') {
            return res.status(403).json({ error: 'Access restricted to coordinators' });
        }
        if (!staff.password) {
            return res.status(401).json({ error: 'No password set for this account' });
        }
        const valid = await bcryptjs_1.default.compare(password, staff.password);
        if (!valid) {
            return res.status(401).json({ error: 'Invalid password' });
        }
        const token = jsonwebtoken_1.default.sign({ staffId: staff.id, role: staff.staffRole }, process.env.JWT_SECRET, { expiresIn: '7d' });
        return res.json({
            token,
            staff: {
                id: staff.id,
                name: staff.name,
                email: staff.email,
                staffRole: staff.staffRole,
                zoneId: staff.zoneId,
            },
        });
    }
    catch (err) {
        console.error('[POST /api/mobile/login]', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
/**
 * GET /api/mobile/tasks — Fetch tasks assigned to the authenticated coordinator.
 */
router.get('/tasks', auth_1.requireMobileAuth, async (req, res) => {
    try {
        const staffId = Number(req.user?.id);
        if (!staffId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const tasks = await prisma_1.default.coordinatorTask.findMany({
            where: { assignedToId: staffId },
            include: {
                event: { select: { id: true, name: true } },
                updates: {
                    orderBy: { timestamp: 'desc' },
                    take: 5,
                    include: { staff: { select: { id: true, name: true } } },
                },
            },
            orderBy: [
                { priority: 'desc' },
                { deadline: 'asc' },
            ],
        });
        return res.json(tasks);
    }
    catch (err) {
        console.error('[GET /api/mobile/tasks]', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
/**
 * PATCH /api/mobile/tasks/:id/status — Coordinator updates task status from mobile.
 */
router.patch('/tasks/:id/status', auth_1.requireMobileAuth, async (req, res) => {
    try {
        const staffId = Number(req.user?.id);
        if (!staffId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const taskId = req.params.id;
        const { status, note } = req.body;
        const validStatuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'NEEDS_HELP'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status value' });
        }
        // Ownership check — coordinator can only update their own tasks
        const existing = await prisma_1.default.coordinatorTask.findFirst({
            where: { id: taskId, assignedToId: staffId },
        });
        if (!existing) {
            return res.status(404).json({ error: 'Task not found or not assigned to you' });
        }
        // Update task + create audit log in a transaction
        const [task] = await prisma_1.default.$transaction([
            prisma_1.default.coordinatorTask.update({
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
            prisma_1.default.taskUpdate.create({
                data: {
                    taskId,
                    staffId: staffId,
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
        }
        catch (socketErr) {
            console.warn('[PATCH /api/mobile/tasks/[id]/status] socket notify failed', socketErr);
        }
        return res.json(task);
    }
    catch (err) {
        console.error('[PATCH /api/mobile/tasks/:id/status]', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
