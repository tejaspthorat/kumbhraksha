import { Router, Request, Response } from 'express';
import { 
  getCctv, 
  getReports, 
  getReport, 
  setReportStatus, 
  createReport, 
  getSightings, 
  createSighting, 
  triageSighting,
  networkCenter 
} from '../lib/missing/data';
import { withLiveCascade } from '../lib/missing/store';
import { distanceMeters } from '../lib/geo';
import type { MissingReportStatus } from '../lib/missing/types';
import { missingBus } from '../lib/missing/bus';

const router = Router();

// ── GET /api/missing/stream ── (Server-Sent Events for live dashboard alerts)
router.get('/stream', (req: Request, res: Response) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
  });
  res.flushHeaders?.();
  const unsubscribe = missingBus.subscribe(res);
  req.on('close', unsubscribe);
});

// ── GET /api/missing/cctv ──
router.get('/cctv', async (_req: Request, res: Response) => {
  const cctv = await getCctv();
  return res.json(cctv);
});

// ── GET /api/missing/feed ──
router.get('/feed', async (req: Request, res: Response) => {
  const lat = parseFloat(req.query.lat as string) || networkCenter.lat;
  const lng = parseFloat(req.query.lng as string) || networkCenter.lng;
  const me = { lat, lng };

  const reports = (await getReports())
    .map(withLiveCascade)
    .filter((r) => r.status !== 'REUNITED')
    .map((r) => ({
      ...r,
      distanceMeters: distanceMeters(me, { lat: r.lastSeenLat, lng: r.lastSeenLng }),
    }))
    .sort((a, b) => a.distanceMeters - b.distanceMeters);

  return res.json({ center: me, items: reports });
});

// ── GET /api/missing/reports ──
router.get('/reports', async (_req: Request, res: Response) => {
  const reports = (await getReports()).map(withLiveCascade);
  return res.json(reports);
});

// ── POST /api/missing/reports ──
router.post('/reports', async (req: Request, res: Response) => {
  try {
    const body = req.body;
    if (!body?.person?.name) {
      return res.status(400).json({ error: 'person.name is required' });
    }
    if (typeof body.lastSeenLat !== 'number' || typeof body.lastSeenLng !== 'number') {
      return res.status(400).json({ error: 'lastSeenLat and lastSeenLng are required' });
    }
    const report = await createReport({
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
    missingBus.publish('report:new', {
      ...withLiveCascade(report),
      source: body.source ?? 'mobile',
    });
    return res.status(201).json(report);
  } catch (e) {
    return res.status(400).json({ error: 'Invalid request' });
  }
});

// ── GET /api/missing/reports/:id ──
router.get('/reports/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const report = await getReport(id);
  if (!report) return res.status(404).json({ error: 'Not found' });
  return res.json(withLiveCascade(report));
});

// ── PATCH /api/missing/reports/:id ──
router.patch('/reports/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const body = req.body || {};
  const status = body.status as MissingReportStatus | undefined;
  if (!status) return res.status(400).json({ error: 'status is required' });
  const report = await setReportStatus(id, status);
  if (!report) return res.status(404).json({ error: 'Not found' });
  return res.json(report);
});

// ── GET /api/missing/sightings ──
router.get('/sightings', async (req: Request, res: Response) => {
  const onlyPending = req.query.status === 'pending';
  const sightings = await getSightings(onlyPending);
  return res.json(sightings);
});

// ── POST /api/missing/sightings ──
router.post('/sightings', async (req: Request, res: Response) => {
  try {
    const body = req.body;
    if (typeof body.lat !== 'number' || typeof body.lng !== 'number') {
      return res.status(400).json({ error: 'lat and lng are required' });
    }
    const sighting = await createSighting({
      missingReportId: body.missingReportId || undefined,
      spotterName: body.spotterName,
      photoUrl: body.photoUrl,
      lat: body.lat,
      lng: body.lng,
      description: body.description,
    });
    missingBus.publish('sighting:new', sighting);
    return res.status(201).json(sighting);
  } catch {
    return res.status(400).json({ error: 'Invalid request' });
  }
});

// ── PATCH /api/missing/sightings/:id ──
router.patch('/sightings/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const body = req.body || {};
  const action = body.action as 'match' | 'dismiss' | 'new' | undefined;
  if (!action) return res.status(400).json({ error: 'action is required' });
  const sighting = await triageSighting(id, action, body.missingReportId);
  if (!sighting) return res.status(404).json({ error: 'Not found' });
  return res.json(sighting);
});

// ── GET /api/missing/stats ──
router.get('/stats', async (_req: Request, res: Response) => {
  const [reports, sightings, cctv] = await Promise.all([
    getReports(),
    getSightings(),
    getCctv(),
  ]);
  const live = reports.map(withLiveCascade);
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

export default router;
