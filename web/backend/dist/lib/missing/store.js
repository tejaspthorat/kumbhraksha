"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.memStore = exports.withLiveCascade = void 0;
/**
 * In-memory fallback store for the missing-persons network.
 *
 * The API routes prefer Prisma (real backend), and fall back to this store when
 * the database is unreachable — mirroring the app's existing mock-fallback
 * pattern (see src/app/api/alerts/route.ts). It seeds realistic data around the
 * Nashik Kumbh (Panchavati / Ramkund) so both the citizen app and dashboard are
 * demoable instantly.
 */
const crypto_1 = require("crypto");
const cascade_1 = require("./cascade");
// Re-export the isomorphic cascade helper so server routes can keep importing it
// from the store; client components import it directly from './cascade'.
var cascade_2 = require("./cascade");
Object.defineProperty(exports, "withLiveCascade", { enumerable: true, get: function () { return cascade_2.withLiveCascade; } });
const CENTER = cascade_1.NETWORK_CENTER;
const jitter = (base, spread) => base + (Math.random() - 0.5) * spread;
const minsAgo = (m) => new Date(Date.now() - m * 60000).toISOString();
function seed() {
    const reports = [
        {
            id: 'case-1247',
            person: {
                id: 'p-1',
                name: 'Aarav Sharma',
                age: 6,
                gender: 'MALE',
                photoUrl: null,
                description: 'Small boy, curly hair, was holding a red balloon',
                clothing: 'Yellow kurta, blue shorts, black sandals',
                medicalNotes: 'Mild asthma',
            },
            reporterName: 'Priya Sharma',
            reporterPhone: '+91 ***** *4821',
            relationship: 'Mother',
            lastSeenLat: jitter(CENTER.lat, 0.004),
            lastSeenLng: jitter(CENTER.lng, 0.004),
            lastSeenLabel: 'Near Ramkund, Panchavati',
            lastSeenTime: minsAgo(18),
            reportedAt: minsAgo(16),
            status: 'SIGHTING_RECEIVED',
            alertRadiusMeters: 2000,
            cascadeLevel: 2,
            assignedOfficerId: null,
            sightingsCount: 2,
            usersNotified: 1840,
        },
        {
            id: 'case-1251',
            person: {
                id: 'p-2',
                name: 'Kamla Devi',
                age: 72,
                gender: 'FEMALE',
                photoUrl: null,
                description: 'Elderly woman, walks with a cane, hard of hearing',
                clothing: 'White saree with green border',
                medicalNotes: 'Disoriented; possible dementia',
            },
            reporterName: 'Ramesh Yadav',
            reporterPhone: '+91 ***** *7733',
            relationship: 'Son',
            lastSeenLat: jitter(CENTER.lat, 0.006),
            lastSeenLng: jitter(CENTER.lng, 0.006),
            lastSeenLabel: 'Gandhi Talav, Panchavati',
            lastSeenTime: minsAgo(42),
            reportedAt: minsAgo(38),
            status: 'SEARCHING',
            alertRadiusMeters: 4000,
            cascadeLevel: 3,
            assignedOfficerId: null,
            sightingsCount: 0,
            usersNotified: 6200,
        },
        {
            id: 'case-1253',
            person: {
                id: 'p-3',
                name: 'Imran Khan',
                age: 9,
                gender: 'MALE',
                photoUrl: null,
                description: 'Boy, glasses, shy',
                clothing: 'Green t-shirt, grey trousers',
                medicalNotes: null,
            },
            reporterName: 'Saima Khan',
            reporterPhone: '+91 ***** *1190',
            relationship: 'Mother',
            lastSeenLat: jitter(CENTER.lat, 0.003),
            lastSeenLng: jitter(CENTER.lng, 0.003),
            lastSeenLabel: 'Kapaleshwar Mandir gate',
            lastSeenTime: minsAgo(6),
            reportedAt: minsAgo(4),
            status: 'REPORTED',
            alertRadiusMeters: 500,
            cascadeLevel: 0,
            assignedOfficerId: null,
            sightingsCount: 0,
            usersNotified: 312,
        },
    ];
    const sightings = [
        {
            id: 's-1',
            missingReportId: 'case-1247',
            spotterName: 'Volunteer · Ramkund Sector',
            photoUrl: null,
            lat: jitter(CENTER.lat, 0.003),
            lng: jitter(CENTER.lng, 0.003),
            description: 'Small boy in yellow kurta crying near the water tap',
            spottedAt: minsAgo(5),
            aiMatchConfidence: 0.84,
            status: 'MATCHED',
        },
        {
            id: 's-2',
            missingReportId: null,
            spotterName: 'Citizen',
            photoUrl: null,
            lat: jitter(CENTER.lat, 0.005),
            lng: jitter(CENTER.lng, 0.005),
            description: 'Confused elderly woman in white saree sitting alone',
            spottedAt: minsAgo(9),
            aiMatchConfidence: 0.61,
            status: 'PENDING',
        },
        {
            id: 's-3',
            missingReportId: null,
            spotterName: 'Citizen',
            photoUrl: null,
            lat: jitter(CENTER.lat, 0.007),
            lng: jitter(CENTER.lng, 0.007),
            description: 'Young child wandering near Tapovan shuttle gate, no adult nearby',
            spottedAt: minsAgo(2),
            aiMatchConfidence: null,
            status: 'PENDING',
        },
    ];
    const sectors = [
        'Ramkund Sector',
        'Panchavati Bazaar',
        'Godavari Bridge',
        'Tapovan Camp',
        'Trimbak Road',
        'Sadhugram',
        'Nashik Road Transit',
        'Medical Base',
    ];
    const cctv = Array.from({ length: 42 }).map((_, i) => ({
        id: `cam-${i + 1}`,
        lat: jitter(CENTER.lat, 0.02),
        lng: jitter(CENTER.lng, 0.02),
        sector: sectors[i % sectors.length],
        coverageRadius: 50 + (i % 3) * 25,
        cameraType: i % 4 === 0 ? 'PTZ' : 'Fixed',
    }));
    return { reports, sightings, cctv };
}
// Module singleton — survives across requests in a running server.
const g = globalThis;
const store = g.__kr_store ?? (g.__kr_store = seed());
exports.memStore = {
    center: CENTER,
    listReports() {
        return [...store.reports].sort((a, b) => +new Date(b.reportedAt) - +new Date(a.reportedAt));
    },
    getReport(id) {
        return store.reports.find((r) => r.id === id);
    },
    createReport(input) {
        const report = {
            id: `case-${Math.floor(1000 + Math.random() * 9000)}`,
            person: { ...input.person, id: input.person.id || `p-${(0, crypto_1.randomUUID)().slice(0, 8)}` },
            reporterName: input.reporterName ?? null,
            reporterPhone: input.reporterPhone ?? null,
            relationship: input.relationship ?? null,
            lastSeenLat: input.lastSeenLat ?? CENTER.lat,
            lastSeenLng: input.lastSeenLng ?? CENTER.lng,
            lastSeenLabel: input.lastSeenLabel ?? null,
            lastSeenTime: input.lastSeenTime ?? new Date().toISOString(),
            reportedAt: new Date().toISOString(),
            status: 'REPORTED',
            alertRadiusMeters: 500,
            cascadeLevel: 0,
            assignedOfficerId: null,
            sightingsCount: 0,
            usersNotified: Math.floor(150 + Math.random() * 400),
        };
        store.reports.unshift(report);
        return report;
    },
    updateStatus(id, status) {
        const r = store.reports.find((x) => x.id === id);
        if (r)
            r.status = status;
        return r;
    },
    listSightings() {
        return [...store.sightings].sort((a, b) => +new Date(b.spottedAt) - +new Date(a.spottedAt));
    },
    pendingSightings() {
        return this.listSightings().filter((s) => s.status === 'PENDING');
    },
    createSighting(input) {
        const sighting = {
            id: `s-${(0, crypto_1.randomUUID)().slice(0, 8)}`,
            missingReportId: input.missingReportId ?? null,
            spotterName: input.spotterName ?? 'Citizen',
            photoUrl: input.photoUrl ?? null,
            lat: input.lat ?? CENTER.lat,
            lng: input.lng ?? CENTER.lng,
            description: input.description ?? null,
            spottedAt: new Date().toISOString(),
            aiMatchConfidence: input.aiMatchConfidence ?? null,
            status: input.missingReportId ? 'MATCHED' : 'PENDING',
        };
        store.sightings.unshift(sighting);
        if (sighting.missingReportId) {
            const r = store.reports.find((x) => x.id === sighting.missingReportId);
            if (r) {
                r.sightingsCount = (r.sightingsCount ?? 0) + 1;
                if (r.status === 'REPORTED' || r.status === 'SEARCHING')
                    r.status = 'SIGHTING_RECEIVED';
            }
        }
        return sighting;
    },
    triageSighting(id, action, missingReportId) {
        const s = store.sightings.find((x) => x.id === id);
        if (!s)
            return undefined;
        if (action === 'dismiss')
            s.status = 'DISMISSED';
        if (action === 'match' && missingReportId) {
            s.status = 'MATCHED';
            s.missingReportId = missingReportId;
        }
        if (action === 'new')
            s.status = 'CONFIRMED';
        return s;
    },
    listCctv() {
        return store.cctv;
    },
    reset() {
        const s = seed();
        store.reports = s.reports;
        store.sightings = s.sightings;
        store.cctv = s.cctv;
    },
};
