'use client';

import type { EvacuationRoute as EvacRouteType } from '@/lib/floorPlanStore';

interface EvacuationRouteProps {
  route: EvacRouteType;
}

export default function EvacuationRoute({ route }: EvacuationRouteProps) {
  if (route.points.length < 2) return null;

  // Build SVG polyline
  const pathData = route.points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  // Get bounds for SVG sizing
  const minX = Math.min(...route.points.map((p) => p.x)) - 10;
  const minY = Math.min(...route.points.map((p) => p.y)) - 10;
  const maxX = Math.max(...route.points.map((p) => p.x)) + 10;
  const maxY = Math.max(...route.points.map((p) => p.y)) + 10;

  // Arrow at end
  const last = route.points[route.points.length - 1];
  const secondLast = route.points[route.points.length - 2];
  const angle = Math.atan2(last.y - secondLast.y, last.x - secondLast.x);
  const arrowSize = 8;
  const arrowP1 = {
    x: last.x - arrowSize * Math.cos(angle - Math.PI / 6),
    y: last.y - arrowSize * Math.sin(angle - Math.PI / 6),
  };
  const arrowP2 = {
    x: last.x - arrowSize * Math.cos(angle + Math.PI / 6),
    y: last.y - arrowSize * Math.sin(angle + Math.PI / 6),
  };

  return (
    <svg
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: maxX,
        height: maxY,
        pointerEvents: 'none',
        zIndex: 5,
        overflow: 'visible',
      }}
    >
      <path
        d={pathData}
        fill="none"
        stroke="#E24B4A"
        strokeWidth="2"
        strokeDasharray="6 4"
        strokeLinecap="round"
      />
      {/* Arrow */}
      <polygon
        points={`${last.x},${last.y} ${arrowP1.x},${arrowP1.y} ${arrowP2.x},${arrowP2.y}`}
        fill="#E24B4A"
      />
    </svg>
  );
}
