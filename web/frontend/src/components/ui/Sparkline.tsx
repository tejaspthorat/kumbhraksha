'use client';

import { useId, useMemo } from 'react';

type SparklineProps = {
  data: number[];
  /** Stroke colour — any CSS color. Defaults to the active accent (coral/orange). */
  color?: string;
  width?: number;
  height?: number;
  /** Fill a soft gradient under the line. */
  fill?: boolean;
  className?: string;
  strokeWidth?: number;
};

/**
 * Dependency-free inline SVG sparkline. Tiny, render-cheap, and reusable across
 * KPI tiles and panels. Auto-scales to its data's min/max.
 */
export function Sparkline({
  data,
  color = 'var(--coral)',
  width = 96,
  height = 28,
  fill = true,
  className,
  strokeWidth = 1.5,
}: SparklineProps) {
  const gradientId = useId();

  const { line, area } = useMemo(() => {
    if (data.length < 2) return { line: '', area: '' };
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const step = width / (data.length - 1);
    const pts = data.map((d, i) => {
      const x = i * step;
      const y = height - ((d - min) / range) * (height - strokeWidth * 2) - strokeWidth;
      return [x, y] as const;
    });
    const line = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`).join(' ');
    const area = `${line} L${width},${height} L0,${height} Z`;
    return { line, area };
  }, [data, width, height, strokeWidth]);

  if (!line) return null;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={className}
      aria-hidden="true"
    >
      {fill && (
        <>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.22" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill={`url(#${gradientId})`} stroke="none" />
        </>
      )}
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
