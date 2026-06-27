type Bucket = { t: number[] };

const buckets = new Map<string, number[]>();

function prune(now: number, arr: number[], windowMs: number) {
  return arr.filter((x) => x > now - windowMs);
}

/**
 * Fixed-window style limiter (in-process). For serverless multi-node deployments,
 * replace with Redis / Upstash (see docs/PUBLIC_COORDINATOR_TASKS_API.md).
 */
export function publicTaskRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const arr = prune(now, buckets.get(key) ?? [], windowMs);
  if (arr.length >= limit) {
    buckets.set(key, arr);
    return false;
  }
  arr.push(now);
  buckets.set(key, arr);
  return true;
}
