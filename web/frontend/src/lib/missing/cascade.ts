/**
 * The alert cascade (see implementation/main_plan.md → "The Alert Cascade").
 * Time-based expanding fan-out. Automatic but overridable by authorities.
 *
 * This module is isomorphic (no Node-only deps) so client components can import
 * the helpers below without pulling the server-only seed store into the bundle.
 */
import type { MissingReport } from './types';

/**
 * Nashik Kumbh (Sinhastha) reference center — centroid of the real CCTV grid
 * around Panchavati / Ramkund on the Godavari. Matches public/nashik/meta.json.
 */
export const NETWORK_CENTER = { lat: 19.995845, lng: 73.797309 };

export interface CascadeStage {
  level: number;
  atMinutes: number;
  radiusMeters: number;
  label: string;
  channel: 'PUSH' | 'PUSH+SMS' | 'BROADCAST';
  detail: string;
}

export const CASCADE_STAGES: CascadeStage[] = [
  {
    level: 0,
    atMinutes: 0,
    radiusMeters: 500,
    label: 'Immediate',
    channel: 'PUSH',
    detail: 'Push to app users within 500 m · nearby CCTV highlighted',
  },
  {
    level: 1,
    atMinutes: 5,
    radiusMeters: 1000,
    label: 'Priority',
    channel: 'PUSH',
    detail: 'Radius expands to 1 km · promoted to top of nearby feeds',
  },
  {
    level: 2,
    atMinutes: 15,
    radiusMeters: 2000,
    label: 'Sector-wide',
    channel: 'PUSH+SMS',
    detail: 'Radius 2 km · SMS to registered users · escalated to senior officer',
  },
  {
    level: 3,
    atMinutes: 30,
    radiusMeters: 4000,
    label: 'Mela-wide',
    channel: 'PUSH+SMS',
    detail: 'Mela-wide for children/elderly · cross-reference hospitals',
  },
  {
    level: 4,
    atMinutes: 60,
    radiusMeters: 8000,
    label: 'Full escalation',
    channel: 'BROADCAST',
    detail: 'Cell broadcast (on approval) · flagged for police investigation',
  },
];

export function stageForLevel(level: number): CascadeStage {
  return CASCADE_STAGES[Math.min(level, CASCADE_STAGES.length - 1)];
}

/** Derive the cascade level a case *should* be at given how long it's been open. */
export function expectedLevel(reportedAt: string | Date): number {
  const ms =
    Date.now() -
    (typeof reportedAt === 'string'
      ? new Date(reportedAt).getTime()
      : reportedAt.getTime());
  const mins = ms / 60000;
  let level = 0;
  for (const s of CASCADE_STAGES) if (mins >= s.atMinutes) level = s.level;
  return level;
}

/** Recompute a report's live cascade level/radius from how long it's been open. */
export function withLiveCascade(r: MissingReport): MissingReport {
  if (r.status === 'REUNITED') return r;
  const lvl = Math.max(r.cascadeLevel, expectedLevel(r.reportedAt));
  return { ...r, cascadeLevel: lvl, alertRadiusMeters: stageForLevel(lvl).radiusMeters };
}
