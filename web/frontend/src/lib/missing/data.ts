/**
 * Data access for the missing-persons network.
 *
 * Prefers the real Prisma backend; falls back to the in-memory store when the
 * tables/DB are unavailable (e.g. before the migration is applied). Prisma is
 * accessed loosely-typed so the app builds even if the client hasn't been
 * regenerated yet — the try/catch routes traffic to the seed store in that case.
 */
import prisma from '@/lib/prisma';
import { memStore } from './store';
import type {
  MissingReport,
  Sighting,
  CctvLocation,
  MissingReportStatus,
  MissingPerson,
} from './types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any;

function mapPerson(p: any): MissingPerson {
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

function mapReport(r: any): MissingReport {
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

function mapSighting(s: any): Sighting {
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

export async function getReports(): Promise<MissingReport[]> {
  try {
    const rows = await db.missingReport.findMany({
      include: { person: true, _count: { select: { sightings: true } } },
      orderBy: { reportedAt: 'desc' },
    });
    if (!rows) throw new Error('no rows');
    return rows.map(mapReport);
  } catch {
    return memStore.listReports();
  }
}

export async function getReport(id: string): Promise<MissingReport | null> {
  try {
    const r = await db.missingReport.findUnique({
      where: { id },
      include: { person: true, _count: { select: { sightings: true } } },
    });
    if (!r) throw new Error('not found');
    return mapReport(r);
  } catch {
    return memStore.getReport(id) ?? null;
  }
}

export interface CreateReportInput {
  person: Omit<MissingPerson, 'id'>;
  reporterName?: string;
  reporterPhone?: string;
  relationship?: string;
  lastSeenLat: number;
  lastSeenLng: number;
  lastSeenLabel?: string;
  lastSeenTime?: string;
}

export async function createReport(input: CreateReportInput): Promise<MissingReport> {
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
  } catch {
    return memStore.createReport({
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

export async function setReportStatus(
  id: string,
  status: MissingReportStatus
): Promise<MissingReport | null> {
  try {
    const r = await db.missingReport.update({
      where: { id },
      data: { status },
      include: { person: true, _count: { select: { sightings: true } } },
    });
    return mapReport(r);
  } catch {
    return memStore.updateStatus(id, status) ?? null;
  }
}

export async function getSightings(onlyPending = false): Promise<Sighting[]> {
  try {
    const rows = await db.sighting.findMany({
      where: onlyPending ? { status: 'PENDING' } : undefined,
      orderBy: { spottedAt: 'desc' },
    });
    if (!rows) throw new Error('no rows');
    return rows.map(mapSighting);
  } catch {
    return onlyPending ? memStore.pendingSightings() : memStore.listSightings();
  }
}

export interface CreateSightingInput {
  missingReportId?: string;
  spotterName?: string;
  photoUrl?: string;
  lat: number;
  lng: number;
  description?: string;
}

export async function createSighting(input: CreateSightingInput): Promise<Sighting> {
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
  } catch {
    return memStore.createSighting(input);
  }
}

export async function triageSighting(
  id: string,
  action: 'match' | 'dismiss' | 'new',
  missingReportId?: string
): Promise<Sighting | null> {
  try {
    const status = action === 'dismiss' ? 'DISMISSED' : action === 'match' ? 'MATCHED' : 'CONFIRMED';
    const s = await db.sighting.update({
      where: { id },
      data: { status, ...(action === 'match' && missingReportId ? { missingReportId } : {}) },
    });
    return mapSighting(s);
  } catch {
    return memStore.triageSighting(id, action, missingReportId) ?? null;
  }
}

export async function getCctv(): Promise<CctvLocation[]> {
  try {
    const rows = await db.cctvLocation.findMany();
    if (!rows || rows.length === 0) throw new Error('no rows');
    return rows.map((c: any) => ({
      id: c.id,
      lat: c.lat,
      lng: c.lng,
      sector: c.sector,
      coverageRadius: c.coverageRadius,
      cameraType: c.cameraType,
    }));
  } catch {
    return memStore.listCctv();
  }
}

export const networkCenter = memStore.center;
