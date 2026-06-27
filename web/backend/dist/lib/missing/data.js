"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.networkCenter = void 0;
exports.getReports = getReports;
exports.getReport = getReport;
exports.createReport = createReport;
exports.setReportStatus = setReportStatus;
exports.getSightings = getSightings;
exports.createSighting = createSighting;
exports.triageSighting = triageSighting;
exports.getCctv = getCctv;
/**
 * Data access for the missing-persons network.
 *
 * Prefers the real Prisma backend; falls back to the in-memory store when the
 * tables/DB are unavailable (e.g. before the migration is applied). Prisma is
 * accessed loosely-typed so the app builds even if the client hasn't been
 * regenerated yet — the try/catch routes traffic to the seed store in that case.
 */
const prisma_1 = __importDefault(require("../prisma"));
const store_1 = require("./store");
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma_1.default;
function mapPerson(p) {
    return {
        id: p.id,
        name: p.name,
        age: p.age,
        gender: p.gender,
        photoUrl: p.photoUrl,
        description: p.description,
        clothing: p.clothing,
        medicalNotes: p.medicalNotes,
    };
}
function mapReport(r) {
    return {
        id: r.id,
        person: mapPerson(r.person),
        reporterName: r.reporterName,
        reporterPhone: r.reporterPhone,
        relationship: r.relationship,
        lastSeenLat: r.lastSeenLat,
        lastSeenLng: r.lastSeenLng,
        lastSeenLabel: r.lastSeenLabel,
        lastSeenTime: (r.lastSeenTime instanceof Date ? r.lastSeenTime.toISOString() : r.lastSeenTime),
        reportedAt: (r.reportedAt instanceof Date ? r.reportedAt.toISOString() : r.reportedAt),
        status: r.status,
        alertRadiusMeters: r.alertRadiusMeters,
        cascadeLevel: r.cascadeLevel,
        assignedOfficerId: r.assignedOfficerId,
        sightingsCount: r._count?.sightings ?? r.sightingsCount ?? 0,
        usersNotified: r.usersNotified ?? 0,
    };
}
function mapSighting(s) {
    return {
        id: s.id,
        missingReportId: s.missingReportId,
        spotterName: s.spotterName,
        photoUrl: s.photoUrl,
        lat: s.lat,
        lng: s.lng,
        description: s.description,
        spottedAt: (s.spottedAt instanceof Date ? s.spottedAt.toISOString() : s.spottedAt),
        aiMatchConfidence: s.aiMatchConfidence,
        status: s.status,
    };
}
async function getReports() {
    try {
        const rows = await db.missingReport.findMany({
            include: { person: true, _count: { select: { sightings: true } } },
            orderBy: { reportedAt: 'desc' },
        });
        if (!rows)
            throw new Error('no rows');
        return rows.map(mapReport);
    }
    catch {
        return store_1.memStore.listReports();
    }
}
async function getReport(id) {
    try {
        const r = await db.missingReport.findUnique({
            where: { id },
            include: { person: true, _count: { select: { sightings: true } } },
        });
        if (!r)
            throw new Error('not found');
        return mapReport(r);
    }
    catch {
        return store_1.memStore.getReport(id) ?? null;
    }
}
async function createReport(input) {
    try {
        const person = await db.missingPerson.create({ data: { ...input.person } });
        const r = await db.missingReport.create({
            data: {
                personId: person.id,
                reporterName: input.reporterName,
                reporterPhone: input.reporterPhone,
                relationship: input.relationship,
                lastSeenLat: input.lastSeenLat,
                lastSeenLng: input.lastSeenLng,
                lastSeenLabel: input.lastSeenLabel,
                lastSeenTime: input.lastSeenTime ? new Date(input.lastSeenTime) : new Date(),
            },
            include: { person: true, _count: { select: { sightings: true } } },
        });
        return mapReport(r);
    }
    catch {
        return store_1.memStore.createReport({
            person: { ...input.person, id: '' },
            reporterName: input.reporterName,
            reporterPhone: input.reporterPhone,
            relationship: input.relationship,
            lastSeenLat: input.lastSeenLat,
            lastSeenLng: input.lastSeenLng,
            lastSeenLabel: input.lastSeenLabel,
            lastSeenTime: input.lastSeenTime,
        });
    }
}
async function setReportStatus(id, status) {
    try {
        const r = await db.missingReport.update({
            where: { id },
            data: { status },
            include: { person: true, _count: { select: { sightings: true } } },
        });
        return mapReport(r);
    }
    catch {
        return store_1.memStore.updateStatus(id, status) ?? null;
    }
}
async function getSightings(onlyPending = false) {
    try {
        const rows = await db.sighting.findMany({
            where: onlyPending ? { status: 'PENDING' } : undefined,
            orderBy: { spottedAt: 'desc' },
        });
        if (!rows)
            throw new Error('no rows');
        return rows.map(mapSighting);
    }
    catch {
        return onlyPending ? store_1.memStore.pendingSightings() : store_1.memStore.listSightings();
    }
}
async function createSighting(input) {
    try {
        const s = await db.sighting.create({
            data: {
                missingReportId: input.missingReportId,
                spotterName: input.spotterName ?? 'Citizen',
                photoUrl: input.photoUrl,
                lat: input.lat,
                lng: input.lng,
                description: input.description,
                status: input.missingReportId ? 'MATCHED' : 'PENDING',
            },
        });
        return mapSighting(s);
    }
    catch {
        return store_1.memStore.createSighting(input);
    }
}
async function triageSighting(id, action, missingReportId) {
    try {
        const status = action === 'dismiss' ? 'DISMISSED' : action === 'match' ? 'MATCHED' : 'CONFIRMED';
        const s = await db.sighting.update({
            where: { id },
            data: { status, ...(action === 'match' && missingReportId ? { missingReportId } : {}) },
        });
        return mapSighting(s);
    }
    catch {
        return store_1.memStore.triageSighting(id, action, missingReportId) ?? null;
    }
}
async function getCctv() {
    try {
        const rows = await db.cctvLocation.findMany();
        if (!rows || rows.length === 0)
            throw new Error('no rows');
        return rows.map((c) => ({
            id: c.id,
            lat: c.lat,
            lng: c.lng,
            sector: c.sector,
            coverageRadius: c.coverageRadius,
            cameraType: c.cameraType,
        }));
    }
    catch {
        return store_1.memStore.listCctv();
    }
}
exports.networkCenter = store_1.memStore.center;
