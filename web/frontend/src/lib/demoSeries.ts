/**
 * Deterministic pseudo-random series helpers for telemetry visualisations.
 * Seeded so SSR and client render identically (no hydration mismatch) and so
 * sparklines stay stable between renders.
 */
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function series(seed: number, length = 16, base = 50, variance = 30): number[] {
  const rand = mulberry32(seed);
  let v = base;
  return Array.from({ length }, () => {
    v += (rand() - 0.45) * variance;
    v = Math.max(base * 0.3, Math.min(base * 1.8, v));
    return Math.round(v);
  });
}

/** A gently rising trend, good for crowd-growth style charts. */
export function trendUp(seed: number, length = 24, start = 30, peak = 95): number[] {
  const rand = mulberry32(seed);
  return Array.from({ length }, (_, i) => {
    const t = i / (length - 1);
    const value = start + (peak - start) * t + (rand() - 0.5) * 12;
    return Math.max(0, Math.round(value));
  });
}
