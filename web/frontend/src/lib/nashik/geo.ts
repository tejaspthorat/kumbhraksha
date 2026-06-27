/**
 * Real Nashik Kumbh reference geography, parsed from the source KML datasets
 * (data/*.kml) into static JSON under public/nashik/. Loaded client-side.
 *
 *  • cameras      — 4,000+ CCTV camera points (Z<zone>-C<n>)
 *  • zones        — CCTV coverage-zone polygons
 *  • police       — district police stations
 *  • chokepoints  — Kumbh traffic chokepoints / parking, risk-rated
 *
 * Center is the centroid of all cameras (the surveilled core, Panchavati/Ramkund).
 */

export interface GeoPoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
}
export interface PoliceStation extends GeoPoint {}
export interface CctvCamera extends GeoPoint {}
export interface CctvZone {
  id: string;
  name: string;
  ring: [number, number][]; // [lat, lng] pairs
}
export type ChokepointRisk = 'very high' | 'high' | 'medium';
export interface Chokepoint extends GeoPoint {
  category: string;
  status: string;
  risk: ChokepointRisk;
  note: string;
}
export interface GeoMeta {
  center: { lat: number; lng: number };
  bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number };
  counts: { cameras: number; zones: number; police: number; chokepoints: number };
}

/** Nashik Kumbh network center (camera centroid) — keep in sync with meta.json. */
export const NASHIK_CENTER = { lat: 19.995845, lng: 73.797309 };

async function getJSON<T>(file: string): Promise<T> {
  const res = await fetch(`/nashik/${file}`, { cache: 'force-cache' });
  if (!res.ok) throw new Error(`Failed to load /nashik/${file}`);
  return res.json() as Promise<T>;
}

export const geo = {
  meta: () => getJSON<GeoMeta>('meta.json'),
  police: () => getJSON<PoliceStation[]>('police.json'),
  chokepoints: () => getJSON<Chokepoint[]>('chokepoints.json'),
  zones: () => getJSON<CctvZone[]>('zones.json'),
  cameras: () => getJSON<CctvCamera[]>('cameras.json'),
  /** Police, chokepoints and zones in one shot (small payloads). */
  async layers() {
    const [police, chokepoints, zones, meta] = await Promise.all([
      this.police(),
      this.chokepoints(),
      this.zones(),
      this.meta(),
    ]);
    return { police, chokepoints, zones, meta };
  },
};

/** Risk → coral-family hex for chokepoint markers. */
export function riskColor(risk: string): string {
  switch (risk) {
    case 'very high':
      return '#c64545'; // error red
    case 'high':
      return '#cc785c'; // coral
    default:
      return '#e8a55a'; // amber
  }
}

/** Zone label from a camera name like "Z12-C3" → "Z12". */
export function cameraZone(name: string): string {
  const m = name.match(/^Z\d+/i);
  return m ? m[0].toUpperCase() : 'Other';
}
