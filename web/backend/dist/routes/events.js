"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const prisma_1 = __importDefault(require("../lib/prisma"));
const router = (0, express_1.Router)();
router.get('/', auth_1.requireAdminAuth, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        const events = await prisma_1.default.event.findMany({
            where: { profileId: userId },
            select: {
                id: true,
                name: true,
                description: true,
                location: true,
                startDate: true,
                endDate: true,
                allowPublicTasks: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 100,
        });
        return res.json(events);
    }
    catch (err) {
        console.error('[GET /api/events]', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
