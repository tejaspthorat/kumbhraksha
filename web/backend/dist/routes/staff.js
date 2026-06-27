"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = __importDefault(require("../lib/prisma"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Apply auth middleware to protect staff endpoints
router.use(auth_1.requireAdminAuth);
/**
 * POST /api/staff — Create a new coordinator account (admin action).
 */
router.post('/', async (req, res) => {
    try {
        const { name, email, password, zoneId, profileId, role, avatar } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'name, email and password are required' });
        }
        if (!zoneId || !profileId) {
            return res.status(400).json({ error: 'zoneId and profileId are required' });
        }
        // Guard: reject if email already exists
        const existing = await prisma_1.default.staff.findUnique({ where: { email } });
        if (existing) {
            return res.status(409).json({ error: 'Email already registered' });
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const staff = await prisma_1.default.staff.create({
            data: {
                name,
                email,
                password: hashedPassword,
                staffRole: 'COORDINATOR',
                role: role || 'Coordinator',
                status: 'active',
                avatar: avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
                lastSeen: new Date().toISOString(),
                zoneId: Number(zoneId),
                profileId,
            },
            select: {
                id: true,
                name: true,
                email: true,
                staffRole: true,
                zoneId: true,
                createdAt: true,
            },
        });
        return res.status(201).json(staff);
    }
    catch (err) {
        console.error('[POST /api/staff]', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
/**
 * GET /api/staff — List coordinators.
 */
router.get('/', async (_req, res) => {
    try {
        const coordinators = await prisma_1.default.staff.findMany({
            where: { staffRole: 'COORDINATOR' },
            select: {
                id: true,
                name: true,
                email: true,
                zoneId: true,
                staffRole: true,
                status: true,
            },
            orderBy: { name: 'asc' },
        });
        return res.json(coordinators);
    }
    catch (err) {
        console.error('[GET /api/staff]', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
