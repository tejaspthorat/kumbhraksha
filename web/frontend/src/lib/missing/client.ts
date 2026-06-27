'use client';

import type { MissingReport, Sighting, CctvLocation } from './types';

export type FeedItem = MissingReport & { distanceMeters: number };

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/** Browser-side client for the missing-persons API (used by the dashboard). */
export const krApi = {
  feed: (lat?: number, lng?: number) =>
    fetch(`/api/missing/feed${lat != null ? `?lat=${lat}&lng=${lng}` : ''}`, {
      cache: 'no-store',
    }).then((r) => json<{ center: { lat: number; lng: number }; items: FeedItem[] }>(r)),

  reports: () =>
    fetch('/api/missing/reports', { cache: 'no-store' }).then((r) => json<MissingReport[]>(r)),

  report: (id: string) =>
    fetch(`/api/missing/reports/${id}`, { cache: 'no-store' }).then((r) => json<MissingReport>(r)),

  createReport: (body: unknown) =>
    fetch('/api/missing/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then((r) => json<MissingReport>(r)),

  setStatus: (id: string, status: string) =>
    fetch(`/api/missing/reports/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    }).then((r) => json<MissingReport>(r)),

  sightings: (onlyPending = false) =>
    fetch(`/api/missing/sightings${onlyPending ? '?status=pending' : ''}`, {
      cache: 'no-store',
    }).then((r) => json<Sighting[]>(r)),

  createSighting: (body: unknown) =>
    fetch('/api/missing/sightings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then((r) => json<Sighting>(r)),

  triage: (id: string, action: 'match' | 'dismiss' | 'new', missingReportId?: string) =>
    fetch(`/api/missing/sightings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, missingReportId }),
    }).then((r) => json<Sighting>(r)),

  cctv: () =>
    fetch('/api/missing/cctv', { cache: 'no-store' }).then((r) => json<CctvLocation[]>(r)),
};
