"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.krApi = void 0;
async function json(res) {
    if (!res.ok)
        throw new Error(await res.text());
    return res.json();
}
/** Browser-side client for the missing-persons API (used by the dashboard). */
exports.krApi = {
    feed: (lat, lng) => fetch(`/api/missing/feed${lat != null ? `?lat=${lat}&lng=${lng}` : ''}`, {
        cache: 'no-store',
    }).then((r) => json(r)),
    reports: () => fetch('/api/missing/reports', { cache: 'no-store' }).then((r) => json(r)),
    report: (id) => fetch(`/api/missing/reports/${id}`, { cache: 'no-store' }).then((r) => json(r)),
    createReport: (body) => fetch('/api/missing/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    }).then((r) => json(r)),
    setStatus: (id, status) => fetch(`/api/missing/reports/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
    }).then((r) => json(r)),
    sightings: (onlyPending = false) => fetch(`/api/missing/sightings${onlyPending ? '?status=pending' : ''}`, {
        cache: 'no-store',
    }).then((r) => json(r)),
    createSighting: (body) => fetch('/api/missing/sightings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    }).then((r) => json(r)),
    triage: (id, action, missingReportId) => fetch(`/api/missing/sightings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, missingReportId }),
    }).then((r) => json(r)),
    cctv: () => fetch('/api/missing/cctv', { cache: 'no-store' }).then((r) => json(r)),
};
