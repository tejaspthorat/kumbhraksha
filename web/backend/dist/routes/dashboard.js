"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const prisma_1 = __importDefault(require("../lib/prisma"));
const mockData_1 = require("../lib/mockData");
const router = (0, express_1.Router)();
router.get('/', auth_1.requireAdminAuth, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        // Test database connection first
        try {
            await prisma_1.default.$queryRaw `SELECT 1`;
        }
        catch (dbError) {
            console.warn('Database connection failed, using mock data:', dbError);
            return res.json(mockData_1.fullMockData);
        }
        // 1. Ensure Profile exists (Auto-Onboarding)
        let profile = await prisma_1.default.profile.findUnique({
            where: { id: userId },
            include: { zones: { take: 1 } }
        });
        if (!profile) {
            console.log(`[Dashboard] Creating new profile for user ${userId}`);
            const email = req.user?.email || '';
            const name = req.user?.name || 'New User';
            profile = await prisma_1.default.profile.create({
                data: {
                    id: userId,
                    email,
                    name,
                    role: 'ADMIN', // Default new web users as ADMIN of their own dashboard
                },
                include: { zones: { take: 1 } }
            });
        }
        // 2. If no zones exist, seed with defaults so AI Orchestrator doesn't crash
        if (!profile.zones || profile.zones.length === 0) {
            console.log(`[Dashboard] Seeding default zones for user ${userId}`);
            await prisma_1.default.zone.createMany({
                data: [
                    { name: 'Main Entrance', profileId: userId, area: 120, density: 0, level: 'success', people: 0 },
                    { name: 'Food Court', profileId: userId, area: 450, density: 0, level: 'success', people: 0 },
                    { name: 'Exhibition Hall', profileId: userId, area: 800, density: 0, level: 'success', people: 0 },
                    { name: 'Emergency Exit A', profileId: userId, area: 50, density: 0, level: 'success', people: 0 },
                ]
            });
        }
        // parallel database queries
        const [zones, alerts, staff, tasks, crowdData, predictions, cameras, devices] = await Promise.allSettled([
            prisma_1.default.zone.findMany({
                where: { profileId: userId },
                include: {
                    cameras: true,
                    staff: true,
                    alerts: { where: { resolved: false }, orderBy: { createdAt: 'desc' }, take: 5 },
                    predictions: { orderBy: { createdAt: 'desc' }, take: 3 },
                    zoneDensity: true,
                },
                orderBy: { density: 'desc' },
            }),
            prisma_1.default.alert.findMany({
                where: { zone: { profileId: userId } },
                include: { zone: { select: { id: true, name: true } } },
                orderBy: { createdAt: 'desc' }
            }),
            prisma_1.default.staff.findMany({ where: { profileId: userId } }),
            prisma_1.default.staffTask.findMany({ where: { profileId: userId } }),
            prisma_1.default.crowdData.findMany({ where: { profileId: userId }, orderBy: { createdAt: 'desc' } }),
            prisma_1.default.prediction.findMany({ where: { zone: { profileId: userId } } }),
            prisma_1.default.camera.findMany({ where: { profileId: userId } }),
            prisma_1.default.device.findMany({ where: { profileId: userId } })
        ]);
        const [rooms, entries, suggestions, zoneDensity, thresholds, flowData, peakData, zoneRanking, alertSummary, alertLog] = await Promise.allSettled([
            prisma_1.default.room.findMany({ where: { profileId: userId } }),
            prisma_1.default.entryPoint.findMany({ where: { profileId: userId } }),
            prisma_1.default.suggestion.findMany({ where: { profileId: userId } }),
            prisma_1.default.zoneDensity.findMany({ where: { zone: { profileId: userId } } }),
            prisma_1.default.densityThreshold.findMany({ where: { profileId: userId } }),
            prisma_1.default.flowData.findMany({ where: { profileId: userId } }),
            prisma_1.default.peakData.findMany({ where: { profileId: userId }, orderBy: { createdAt: 'desc' } }),
            prisma_1.default.zoneRanking.findMany({ where: { profileId: userId }, orderBy: { avgDensity: 'desc' } }),
            prisma_1.default.alertSummary.findMany({ where: { profileId: userId } }),
            prisma_1.default.alertLog.findMany({
                where: { zone: { profileId: userId } },
                include: { zone: { select: { id: true, name: true } } },
                orderBy: { createdAt: 'desc' },
                take: 50
            })
        ]);
        const getValue = (settled, defaultValue = []) => {
            return settled.status === 'fulfilled' ? settled.value : defaultValue;
        };
        return res.json({
            profileId: userId,
            rooms: getValue(rooms),
            entries: getValue(entries),
            suggestions: getValue(suggestions),
            alerts: getValue(alerts),
            cameras: getValue(cameras),
            devices: getValue(devices),
            staff: getValue(staff),
            tasks: getValue(tasks),
            zones: getValue(zones),
            zoneDensity: getValue(zoneDensity),
            thresholds: getValue(thresholds),
            predictions: getValue(predictions),
            flowData: getValue(flowData),
            crowdData: getValue(crowdData),
            peakData: getValue(peakData),
            zoneRanking: getValue(zoneRanking),
            alertSummary: getValue(alertSummary),
            alertLog: getValue(alertLog)
        });
    }
    catch (error) {
        console.error('[Dashboard API Error]:', error);
        return res.json(mockData_1.fullMockData);
    }
});
exports.default = router;
