"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CASCADE_STAGES = exports.NETWORK_CENTER = void 0;
exports.stageForLevel = stageForLevel;
exports.expectedLevel = expectedLevel;
exports.withLiveCascade = withLiveCascade;
/** Sangam Nose, Prayagraj — the network's reference center. */
exports.NETWORK_CENTER = { lat: 25.4225, lng: 81.8848 };
exports.CASCADE_STAGES = [
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
function stageForLevel(level) {
    return exports.CASCADE_STAGES[Math.min(level, exports.CASCADE_STAGES.length - 1)];
}
/** Derive the cascade level a case *should* be at given how long it's been open. */
function expectedLevel(reportedAt) {
    const ms = Date.now() -
        (typeof reportedAt === 'string'
            ? new Date(reportedAt).getTime()
            : reportedAt.getTime());
    const mins = ms / 60000;
    let level = 0;
    for (const s of exports.CASCADE_STAGES)
        if (mins >= s.atMinutes)
            level = s.level;
    return level;
}
/** Recompute a report's live cascade level/radius from how long it's been open. */
function withLiveCascade(r) {
    if (r.status === 'REUNITED')
        return r;
    const lvl = Math.max(r.cascadeLevel, expectedLevel(r.reportedAt));
    return { ...r, cascadeLevel: lvl, alertRadiusMeters: stageForLevel(lvl).radiusMeters };
}
