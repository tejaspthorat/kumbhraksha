/** Shared types for the KumbhRaksha missing-persons network (mirror Prisma). */

export type Gender = 'MALE' | 'FEMALE' | 'OTHER' | 'UNKNOWN';

export type MissingReportStatus =
  | 'REPORTED'
  | 'SEARCHING'
  | 'SIGHTING_RECEIVED'
  | 'VERIFICATION'
  | 'REUNITED'
  | 'ESCALATED';

export type SightingStatus = 'PENDING' | 'MATCHED' | 'CONFIRMED' | 'DISMISSED';

export interface MissingPerson {
  id: string;
  name: string;
  age?: number | null;
  gender: Gender;
  photoUrl?: string | null;
  description?: string | null;
  clothing?: string | null;
  medicalNotes?: string | null;
}

export interface MissingReport {
  id: string;
  person: MissingPerson;
  reporterName?: string | null;
  reporterPhone?: string | null;
  relationship?: string | null;
  lastSeenLat: number;
  lastSeenLng: number;
  lastSeenLabel?: string | null;
  lastSeenTime: string;
  reportedAt: string;
  status: MissingReportStatus;
  alertRadiusMeters: number;
  cascadeLevel: number;
  assignedOfficerId?: number | null;
  sightingsCount?: number;
  usersNotified?: number;
}

export interface Sighting {
  id: string;
  missingReportId?: string | null;
  spotterName?: string | null;
  photoUrl?: string | null;
  lat: number;
  lng: number;
  description?: string | null;
  spottedAt: string;
  aiMatchConfidence?: number | null;
  status: SightingStatus;
}

export interface CctvLocation {
  id: string;
  lat: number;
  lng: number;
  sector?: string | null;
  coverageRadius: number;
  cameraType?: string | null;
}

export const STATUS_LABEL: Record<MissingReportStatus, string> = {
  REPORTED: 'Reported',
  SEARCHING: 'Searching',
  SIGHTING_RECEIVED: 'Sighting received',
  VERIFICATION: 'Verifying',
  REUNITED: 'Reunited',
  ESCALATED: 'Escalated',
};
