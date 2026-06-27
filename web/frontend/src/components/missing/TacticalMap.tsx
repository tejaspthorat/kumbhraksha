'use client';

/**
 * Editorial "operations map" — a self-contained SVG/CSS map (no tile dependency)
 * that projects lat/lng around a center onto the cream canvas. Renders missing
 * cases with expanding alert-radius rings, sightings, CCTV coverage, and the
 * viewer's position. Shared by the Live Operations dashboard and case views.
 */
import { useMemo } from 'react';
import clsx from 'clsx';

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

function project(
  pt: { lat: number; lng: number },
  center: { lat: number; lng: number },
  span: number
) {
  const latRad = (center.lat * Math.PI) / 180;
  const dxM = (pt.lng - center.lng) * 111320 * Math.cos(latRad);
  const dyM = (pt.lat - center.lat) * 110540;
  return {
    left: 50 + (dxM / span) * 100,
    top: 50 - (dyM / span) * 100,
  };
}

export default function TacticalMap({
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
  const radiusPct = (m: number) => (m / spanMeters) * 100; // diameter fraction handled via width

  const placedCctv = useMemo(
    () => cctv.map((c) => ({ ...c, ...project(c, center, spanMeters) })),
    [cctv, center, spanMeters]
  );
  const placedCases = useMemo(
    () => cases.map((c) => ({ ...c, ...project(c, center, spanMeters) })),
    [cases, center, spanMeters]
  );
  const placedSightings = useMemo(
    () => sightings.map((s) => ({ ...s, ...project(s, center, spanMeters) })),
    [sightings, center, spanMeters]
  );

  return (
    <div
      className={clsx(
        'relative overflow-hidden rounded-xl border border-hairline bg-surface-soft dot-pattern',
        className
      )}
    >
      {/* river band — a soft diagonal motif for the Godavari */}
      <div
        className="absolute inset-0 opacity-60 pointer-events-none"
        style={{
          background:
            'linear-gradient(115deg, transparent 38%, rgba(93,184,166,0.14) 46%, rgba(93,184,166,0.18) 52%, transparent 60%)',
        }}
      />

      {/* CCTV coverage + dots */}
      {placedCctv.map((c) => (
        <div key={c.id}>
          {showCoverage && (
            <span
              className="absolute rounded-full border border-accent-teal/30 bg-accent-teal/5 -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${c.left}%`,
                top: `${c.top}%`,
                width: `${radiusPct((c.coverageRadius ?? 50) * 2)}%`,
                aspectRatio: '1',
              }}
            />
          )}
          <span
            className="absolute size-1.5 rounded-full bg-surface-dark/60 -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${c.left}%`, top: `${c.top}%` }}
            title="CCTV camera"
          />
        </div>
      ))}

      {/* Sightings */}
      {placedSightings.map((s) => (
        <span
          key={s.id}
          className={clsx(
            'absolute size-3 rounded-full -translate-x-1/2 -translate-y-1/2 ring-2 ring-canvas',
            s.matched ? 'bg-accent-teal' : 'bg-accent-amber'
          )}
          style={{ left: `${s.left}%`, top: `${s.top}%` }}
          title="Sighting"
        />
      ))}

      {/* Cases with expanding alert rings */}
      {placedCases.map((c) => {
        const selected = selectedId === c.id;
        return (
          <div key={c.id}>
            {showRings && c.radiusMeters ? (
              <span
                className="absolute rounded-full border-2 border-coral/40 bg-coral/5 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                style={{
                  left: `${c.left}%`,
                  top: `${c.top}%`,
                  width: `${radiusPct(c.radiusMeters * 2)}%`,
                  aspectRatio: '1',
                }}
              />
            ) : null}
            <button
              onClick={() => onSelect?.(c.id)}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-10 group"
              style={{ left: `${c.left}%`, top: `${c.top}%` }}
              title={c.label}
            >
              <span className="relative flex size-4">
                <span className="alert-ring absolute inline-flex size-4" />
                <span
                  className={clsx(
                    'relative inline-flex size-4 rounded-full ring-2 ring-canvas',
                    selected ? 'bg-coral-active scale-125' : 'bg-coral',
                    'transition-transform'
                  )}
                />
              </span>
            </button>
          </div>
        );
      })}

      {/* Center / viewer */}
      <span
        className="absolute left-1/2 top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-surface-dark ring-4 ring-canvas"
        title="Command center"
      />

      {/* Scale chip */}
      <div className="absolute bottom-3 left-3 rounded-md bg-canvas/85 border border-hairline px-2 py-1 text-[11px] text-muted font-mono">
        {spanMeters >= 1000 ? `${(spanMeters / 1000).toFixed(1)} km` : `${spanMeters} m`} view
      </div>
    </div>
  );
}
