"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publicTaskRateLimit = publicTaskRateLimit;
const buckets = new Map();
function prune(now, arr, windowMs) {
    return arr.filter((x) => x > now - windowMs);
}
/**
 * Fixed-window style limiter (in-process). For serverless multi-node deployments,
 * replace with Redis / Upstash (see docs/PUBLIC_COORDINATOR_TASKS_API.md).
 */
function publicTaskRateLimit(key, limit, windowMs) {
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
