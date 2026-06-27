"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitCoordinatorTaskAssigned = emitCoordinatorTaskAssigned;
/**
 * Notify the socket server so connected coordinators receive `task:assigned` in real time.
 */
async function emitCoordinatorTaskAssigned(coordinatorStaffId, payload) {
    const secret = process.env.COORDINATOR_INTERNAL_SECRET;
    if (!secret) {
        console.warn(JSON.stringify({
            evt: "coordinator_emit_skipped",
            reason: "COORDINATOR_INTERNAL_SECRET unset",
        }));
        return;
    }
    const rawBase = process.env.COORDINATOR_SOCKET_INTERNAL_URL ||
        process.env.NEXT_PUBLIC_COORDINATOR_API_URL?.replace(/\/api\/v1\/?$/, "") ||
        "http://localhost:3001";
    const base = rawBase.replace(/\/$/, "");
    const url = `${base}/api/v1/internal/tasks/emit-assigned`;
    const res = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-coordinator-internal-secret": secret,
        },
        body: JSON.stringify({ coordinatorStaffId, payload }),
    }).catch((e) => {
        console.error(JSON.stringify({ evt: "coordinator_emit_error", message: String(e) }));
        return null;
    });
    if (res && !res.ok) {
        const t = await res.text().catch(() => "");
        console.error(JSON.stringify({ evt: "coordinator_emit_http_error", status: res.status, t }));
    }
}
