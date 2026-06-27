"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const data_1 = require("../lib/missing/data");
const store_1 = require("../lib/missing/store");
const geo_1 = require("../lib/geo");
const bus_1 = require("../lib/missing/bus");
const router = (0, express_1.Router)();
// ── GET /api/missing/stream ── (Server-Sent Events for live dashboard alerts)
router.get('/stream', (req, res) => {
    res.set({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
    });
    res.flushHeaders?.();
    const unsubscribe = bus_1.missingBus.subscribe(res);
    req.on('close', unsubscribe);
});
// ── GET /api/missing/cctv ──
router.get('/cctv', async (_req, res) => {
    const cctv = await (0, data_1.getCctv)();
    return res.json(cctv);
});
// ── GET /api/missing/feed ──
router.get('/feed', async (req, res) => {
    const lat = parseFloat(req.query.lat) || data_1.networkCenter.lat;
    const lng = parseFloat(req.query.lng) || data_1.networkCenter.lng;
    const me = { lat, lng };
    const reports = (await (0, data_1.getReports)())
        .map(store_1.withLiveCascade)
        .filter((r) => r.status !== 'REUNITED')
        .map((r) => ({
        ...r,
        distanceMeters: (0, geo_1.distanceMeters)(me, { lat: r.lastSeenLat, lng: r.lastSeenLng }),
    }))
        .sort((a, b) => a.distanceMeters - b.distanceMeters);
    return res.json({ center: me, items: reports });
});
// ── GET /api/missing/reports ──
router.get('/reports', async (_req, res) => {
    const reports = (await (0, data_1.getReports)()).map(store_1.withLiveCascade);
    return res.json(reports);
});
// ── POST /api/missing/reports ──
router.post('/reports', async (req, res) => {
    try {
        const body = req.body;
        if (!body?.person?.name) {
            return res.status(400).json({ error: 'person.name is required' });
        }
        if (typeof body.lastSeenLat !== 'number' || typeof body.lastSeenLng !== 'number') {
            return res.status(400).json({ error: 'lastSeenLat and lastSeenLng are required' });
        }
        const report = await (0, data_1.createReport)({
            person: {
                name: body.person.name,
                age: body.person.age ?? null,
                gender: body.person.gender ?? 'UNKNOWN',
                description: body.person.description ?? null,
                clothing: body.person.clothing ?? null,
                medicalNotes: body.person.medicalNotes ?? null,
                photoUrl: body.person.photoUrl ?? null,
            },
            reporterName: body.reporterName,
            reporterPhone: body.reporterPhone,
            relationship: body.relationship,
            lastSeenLat: body.lastSeenLat,
            lastSeenLng: body.lastSeenLng,
            lastSeenLabel: body.lastSeenLabel,
            lastSeenTime: body.lastSeenTime,
        });
        // Real-time alert to the control-room dashboard.
        bus_1.missingBus.publish('report:new', {
            ...(0, store_1.withLiveCascade)(report),
            source: body.source ?? 'mobile',
        });
        return res.status(201).json(report);
    }
    catch (e) {
        return res.status(400).json({ error: 'Invalid request' });
    }
});
// ── GET /api/missing/reports/:id ──
router.get('/reports/:id', async (req, res) => {
    const { id } = req.params;
    const report = await (0, data_1.getReport)(id);
    if (!report)
        return res.status(404).json({ error: 'Not found' });
    return res.json((0, store_1.withLiveCascade)(report));
});
// ── PATCH /api/missing/reports/:id ──
router.patch('/reports/:id', async (req, res) => {
    const { id } = req.params;
    const body = req.body || {};
    const status = body.status;
    if (!status)
        return res.status(400).json({ error: 'status is required' });
    const report = await (0, data_1.setReportStatus)(id, status);
    if (!report)
        return res.status(404).json({ error: 'Not found' });
    return res.json(report);
});
// ── GET /api/missing/sightings ──
router.get('/sightings', async (req, res) => {
    const onlyPending = req.query.status === 'pending';
    const sightings = await (0, data_1.getSightings)(onlyPending);
    return res.json(sightings);
});
// ── POST /api/missing/sightings ──
router.post('/sightings', async (req, res) => {
    try {
        const body = req.body;
        if (typeof body.lat !== 'number' || typeof body.lng !== 'number') {
            return res.status(400).json({ error: 'lat and lng are required' });
        }
        const sighting = await (0, data_1.createSighting)({
            missingReportId: body.missingReportId || undefined,
            spotterName: body.spotterName,
            photoUrl: body.photoUrl,
            lat: body.lat,
            lng: body.lng,
            description: body.description,
        });
        bus_1.missingBus.publish('sighting:new', sighting);
        return res.status(201).json(sighting);
    }
    catch {
        return res.status(400).json({ error: 'Invalid request' });
    }
});
// ── PATCH /api/missing/sightings/:id ──
router.patch('/sightings/:id', async (req, res) => {
    const { id } = req.params;
    const body = req.body || {};
    const action = body.action;
    if (!action)
        return res.status(400).json({ error: 'action is required' });
    const sighting = await (0, data_1.triageSighting)(id, action, body.missingReportId);
    if (!sighting)
        return res.status(404).json({ error: 'Not found' });
    return res.json(sighting);
});
// ── GET /api/missing/stats ──
router.get('/stats', async (_req, res) => {
    const [reports, sightings, cctv] = await Promise.all([
        (0, data_1.getReports)(),
        (0, data_1.getSightings)(),
        (0, data_1.getCctv)(),
    ]);
    const live = reports.map(store_1.withLiveCascade);
    const active = live.filter((r) => r.status !== 'REUNITED');
    return res.json({
        activeCases: active.length,
        children: active.filter((r) => (r.person.age ?? 99) < 12).length,
        reunited: live.filter((r) => r.status === 'REUNITED').length,
        pendingSightings: sightings.filter((s) => s.status === 'PENDING').length,
        usersNotified: active.reduce((sum, r) => sum + (r.usersNotified ?? 0), 0),
        cctvCount: cctv.length,
        escalated: active.filter((r) => r.cascadeLevel >= 3).length,
    });
});
// ── POST /api/missing/reset ──
router.post('/reset', async (_req, res) => {
    try {
        store_1.memStore.reset();
        return res.json({ success: true, message: 'In-memory store reset successfully.' });
    }
    catch (error) {
        return res.status(500).json({ error: 'Failed to reset store', details: error.message });
    }
});
exports.default = router;
