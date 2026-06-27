'use client';

/**
 * Real interactive operations map (Leaflet + OpenStreetMap tiles).
 * Drop-in replacement for the old CSS TacticalMap — same prop shape so the
 * Live Operations and CCTV pages can swap to it without other changes.
 *
 * Uses vector overlays only (CircleMarker / Circle) so there are no broken
 * default-marker image assets under Turbopack. Must be loaded via
 * next/dynamic with `ssr: false` because Leaflet touches `window`.
 */
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';
import clsx from 'clsx';
import {
  MapContainer,
  TileLayer,
  Circle,
  CircleMarker,
  Tooltip,
  useMap,
} from 'react-leaflet';

const COLORS = {
  coral: '#cc785c',
  coralActive: '#a9583e',
  teal: '#5db8a6',
  amber: '#e8a55a',
  dark: '#181715',
  canvas: '#faf9f5',
};

export interface MapCase {
  id: string;
  lat: number;
  lng: number;
  label?: string;
  radiusMeters?: number;
  isChild?: boolean;
}
export interface MapSighting {
  id: string;
  lat: number;
  lng: number;
  matched?: boolean;
}
export interface MapCctv {
  id: string;
  lat: number;
  lng: number;
  coverageRadius?: number;
}

interface Props {
  center: { lat: number; lng: number };
  spanMeters?: number;
  cases?: MapCase[];
  sightings?: MapSighting[];
  cctv?: MapCctv[];
  showCoverage?: boolean;
  showRings?: boolean;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  className?: string;
}

/** Rough span(m) → Leaflet zoom mapping so existing spanMeters props still work. */
function zoomForSpan(span: number) {
  if (span >= 8000) return 12;
  if (span >= 4000) return 13;
  if (span >= 2000) return 14;
  return 15;
}

/** Keeps the view synced to the center prop and fixes the grey-tiles-on-mount issue. */
function MapController({ center, zoom }: { center: { lat: number; lng: number }; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([center.lat, center.lng], zoom);
    // Leaflet sometimes mounts before the container has its final size.
    const t = setTimeout(() => map.invalidateSize(), 150);
    return () => clearTimeout(t);
  }, [map, center.lat, center.lng, zoom]);
  return null;
}

export default function OpsMap({
  center,
  spanMeters = 3000,
  cases = [],
  sightings = [],
  cctv = [],
  showCoverage = false,
  showRings = true,
  selectedId,
  onSelect,
  className,
}: Props) {
  const zoom = zoomForSpan(spanMeters);

  return (
    <div
      className={clsx(
        'relative overflow-hidden rounded-xl border border-hairline bg-surface-soft',
        className
      )}
    >
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={zoom}
        scrollWheelZoom
        zoomControl
        style={{ height: '100%', width: '100%', background: COLORS.canvas }}
      >
        <MapController center={center} zoom={zoom} />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* CCTV coverage rings */}
        {showCoverage &&
          cctv.map((c) => (
            <Circle
              key={`cov-${c.id}`}
              center={[c.lat, c.lng]}
              radius={c.coverageRadius ?? 60}
              pathOptions={{ color: COLORS.teal, weight: 1, opacity: 0.4, fillOpacity: 0.06 }}
            />
          ))}

        {/* CCTV camera dots */}
        {cctv.map((c) => (
          <CircleMarker
            key={`cam-${c.id}`}
            center={[c.lat, c.lng]}
            radius={3}
            pathOptions={{
              color: COLORS.dark,
              weight: 1,
              opacity: 0.7,
              fillColor: COLORS.dark,
              fillOpacity: 0.55,
            }}
          >
            <Tooltip>CCTV camera</Tooltip>
          </CircleMarker>
        ))}

        {/* Case alert radii */}
        {showRings &&
          cases.map((c) =>
            c.radiusMeters ? (
              <Circle
                key={`ring-${c.id}`}
                center={[c.lat, c.lng]}
                radius={c.radiusMeters}
                pathOptions={{
                  color: COLORS.coral,
                  weight: 1.5,
                  opacity: 0.5,
                  fillColor: COLORS.coral,
                  fillOpacity: 0.05,
                }}
              />
            ) : null
          )}

        {/* Sightings */}
        {sightings.map((s) => (
          <CircleMarker
            key={`sight-${s.id}`}
            center={[s.lat, s.lng]}
            radius={6}
            pathOptions={{
              color: COLORS.canvas,
              weight: 2,
              fillColor: s.matched ? COLORS.teal : COLORS.amber,
              fillOpacity: 1,
            }}
          >
            <Tooltip>{s.matched ? 'Matched sighting' : 'Unverified sighting'}</Tooltip>
          </CircleMarker>
        ))}

        {/* Cases */}
        {cases.map((c) => {
          const selected = selectedId === c.id;
          return (
            <CircleMarker
              key={`case-${c.id}`}
              center={[c.lat, c.lng]}
              radius={selected ? 11 : 8}
              eventHandlers={{ click: () => onSelect?.(c.id) }}
              pathOptions={{
                color: COLORS.canvas,
                weight: 2,
                fillColor: selected ? COLORS.coralActive : COLORS.coral,
                fillOpacity: 1,
              }}
            >
              <Tooltip permanent={selected} direction="top">
                {c.label ?? 'Missing person'}
              </Tooltip>
            </CircleMarker>
          );
        })}

        {/* Command center */}
        <CircleMarker
          center={[center.lat, center.lng]}
          radius={5}
          pathOptions={{
            color: COLORS.canvas,
            weight: 3,
            fillColor: COLORS.dark,
            fillOpacity: 1,
          }}
        >
          <Tooltip>Command center</Tooltip>
        </CircleMarker>
      </MapContainer>
    </div>
  );
}
