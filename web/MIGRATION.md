You are working on a Next.js + Prisma + Supabase crowd management dashboard called SentinelView.

I have updated two files: `prisma/schema.prisma` and `lib/store.ts`. Apply the changes below and make sure the database push works and all UI pages still render correctly. Do NOT add or remove any UI-facing fields — only the changes described here are permitted.

────────────────────────────────────────
PART 1 — SCHEMA CHANGES (schema.prisma)
────────────────────────────────────────

Replace the full content of `prisma/schema.prisma` with the new file provided.

KEY CHANGES (for your awareness — do not revert them):

1. NEW ENUMS added:
   - `AlertLevel` (danger | warning | info) — replaces `String` on `Alert.level`
   - `ZoneLevel` (danger | warning | success) — replaces `String` on `Zone.level`
   - `AlertStatus` (pending | accepted | ignored) — replaces `String` on `Suggestion.status`
   - `DeviceStatus` (online | offline | degraded) — replaces `String` on `Camera.status` and `Device.status`
   - `StaffStatus` (active | break | offline) — replaces `String` on `Staff.status`
   - `DensityStatus` (danger | warning | success) — replaces `String` on `ZoneDensity.status`
   - `PredictionSeverity` (danger | warning | info | success) — replaces `String` on `Prediction.severity`

2. NEW FIELDS added (no field removed):
   - `Profile`: added `name String?`, `createdAt DateTime @default(now())`, `updatedAt DateTime @updatedAt`
   - `Suggestion`: added `createdAt DateTime @default(now())`, `updatedAt DateTime @updatedAt`
   - `Zone`: added `updatedAt DateTime @updatedAt`
   - `Alert`: added `createdAt DateTime @default(now())`, `resolvedAt DateTime?`
   - `AlertLog`: added `createdAt DateTime @default(now())`
   - `Camera`: added `updatedAt DateTime @updatedAt`; `status` type changed to `DeviceStatus`
   - `Device`: added `updatedAt DateTime @updatedAt`, `zoneId Int?` (nullable FK to Zone), `zone Zone? @relation(...)`; `status` type changed to `DeviceStatus`
   - `Staff`: added `updatedAt DateTime @updatedAt`; `status` type changed to `StaffStatus`
   - `StaffTask`: added `createdAt DateTime @default(now())`
   - `ZoneDensity`: added `updatedAt DateTime @updatedAt`; `status` type changed to `DensityStatus`
   - `Prediction`: added `createdAt DateTime @default(now())`; `severity` type changed to `PredictionSeverity`
   - `CrowdData`: added `createdAt DateTime @default(now())`
   - `PeakData`: added `createdAt DateTime @default(now())`

3. NEW INDEXES added on:
   - `Alert`: [zoneId, level], [createdAt(sort: Desc)]
   - `AlertLog`: [severity], [resolved], [zoneId, severity], [createdAt(sort: Desc)]
   - `Camera`: [status], [zoneId, status]
   - `Device`: [status], [zoneId], [location]
   - `Staff`: [status], [zoneId, status]
   - `Suggestion`: [status], [zone], [priority]
   - `Zone`: [level], [density]
   - `ZoneDensity`: [status], [zoneId, status]
   - `Prediction`: [severity], [zoneId, severity], [createdAt(sort: Desc)]
   - `CrowdData`: [createdAt(sort: Desc)]
   - `PeakData`: [createdAt(sort: Desc)]
   - `ZoneRanking`: [avgDensity(sort: Desc)], [alerts(sort: Desc)]
   - `FlowData`: [from], [to], [from, to]
   - `Profile`: [role]
   - `Room`: [name]
   - `DensityThreshold`: [level]
   - `AlertSummary`: [name]

4. RELATION CHANGES:
   - All Zone child relations (`Alert`, `AlertLog`, `Camera`, `Staff`, `ZoneDensity`, `Prediction`) now have `onDelete: Cascade`
   - `Device` now optionally belongs to a `Zone` via nullable `zoneId Int?` with `onDelete: SetNull`

────────────────────────────────────────
PART 2 — SEED FILE (prisma/seed.ts)
────────────────────────────────────────

Update `prisma/seed.ts` to match the new enum types. Find every place a String value is now an enum and cast it correctly:

- `Suggestion.status`: change `status: 'pending'` → `status: 'pending' as AlertStatus` (or import and use the Prisma enum: `AlertStatus.pending`)
- `Alert.level`: e.g. `level: 'danger'` → `level: 'danger' as AlertLevel`
- `Zone.level`: e.g. `level: 'warning'` → `level: 'warning' as ZoneLevel`
- `Camera.status`: e.g. `status: 'online'` → `status: 'online' as DeviceStatus`
- `Device.status`: same as Camera
- `Staff.status`: e.g. `status: 'active'` → `status: 'active' as StaffStatus`
- `ZoneDensity.status`: e.g. `status: 'danger'` → `status: 'danger' as DensityStatus`
- `Prediction.severity`: e.g. `severity: 'danger'` → `severity: 'danger' as PredictionSeverity`

Also add `zoneId: null` to all Device seed entries (Device.zoneId is now optional). If you want to link a device to a zone, set `zoneId: getZoneId('Gate A')` etc.

Do NOT change any field values or add/remove seed entries.

────────────────────────────────────────
PART 3 — DB PUSH & VERIFICATION
────────────────────────────────────────

Run these commands in order:

```bash
# 1. Push schema to database (no migration file needed for dev)
npx prisma db push

# 2. Re-seed the database
npx prisma db seed

# 3. Open Prisma Studio to visually verify data is present
npx prisma studio
```

If `db push` fails on an enum type conflict (existing String columns can't auto-cast):
```bash
# Reset and re-seed (dev only — data will be cleared)
npx prisma migrate reset --force
npx prisma db seed
```

If you see "P1001 Can't reach database server" — confirm DATABASE_URL and DIRECT_URL are set in `.env`.

────────────────────────────────────────
PART 4 — STORE (lib/store.ts)
────────────────────────────────────────

Replace `lib/store.ts` with the new file provided.

KEY CHANGES:
- All `any[]` types replaced with proper typed interfaces matching the schema
- Added `error: string | null` state for error handling
- Added three optimistic update actions:
  - `setAlertResolved(alertId, resolved)` — updates alerts + alertLog locally
  - `setSuggestionStatus(suggestionId, status)` — updates suggestions locally
  - `updateZone(zoneId, patch)` — patches a zone (for WebSocket pushes)
- Added selector hooks at the bottom of the file:
  - `useZoneById(id)` — get a single zone by ID
  - `useUnresolvedAlerts()` — all active alerts
  - `useAlertsByZone(zoneId)` — alerts for a specific zone
  - `useCamerasByZone(zoneId)` — cameras in a zone
  - `useStaffByZone(zoneId)` — staff in a zone
  - `usePendingSuggestions()` — only status='pending' suggestions
  - `useCriticalZones()` — zones with level='danger'
  - `useOnlineDevices()` — devices with status='online'

These selectors prevent full re-renders on store changes. Use them in components instead of reading the full array and filtering in JSX.

────────────────────────────────────────
PART 5 — UI IMPACT CHECKS
────────────────────────────────────────

After db push and seed, verify these pages still render correctly:

1. `/dashboard` — zone cards, crowd chart, alert count badges
2. `/dashboard/screens` — camera panels, per-zone counts
3. `/dashboard/alerts` — alert table, severity badges, resolved toggle
4. `/dashboard/setup` — room layout canvas, suggestion list
5. `/dashboard/devices` (if exists) — device status list

For each page, check:
- No "undefined" values in the UI where string fields were (level, status, severity now use enum values — they are identical strings, so no UI change needed)
- `resolvedAt` is nullable — any UI showing resolved time must check `alert.resolvedAt ?? 'N/A'`
- `Device.zoneId` is now nullable — zone badge on device cards must check `device.zone?.name ?? 'Unassigned'`
- `Profile.name` is nullable — any user name display must check `profile.name ?? profile.email`

────────────────────────────────────────
PART 6 — API ROUTE (app/api/dashboard/route.ts)
────────────────────────────────────────

If your `/api/dashboard` route currently queries all models separately, add the following `include` to the Zone query so the store receives nested relations in one fetch:

```typescript
const zones = await prisma.zone.findMany({
  include: {
    cameras: true,
    staff: true,
    alerts: { where: { resolved: false }, orderBy: { createdAt: 'desc' }, take: 5 },
    predictions: { orderBy: { createdAt: 'desc' }, take: 3 },
    zoneDensity: true,
  },
  orderBy: { density: 'desc' },
})
```

Also add to the alerts query:
```typescript
const alerts = await prisma.alert.findMany({
  include: { zone: { select: { id: true, name: true } } },
  orderBy: { createdAt: 'desc' },
})
```

And alertLog:
```typescript
const alertLog = await prisma.alertLog.findMany({
  include: { zone: { select: { id: true, name: true } } },
  orderBy: { createdAt: 'desc' },
  take: 50,
})
```

This ensures the store's `Zone[]` type (which includes optional nested arrays) is populated correctly.

────────────────────────────────────────
PART 7 — PROXY / AUTH (no changes needed)
────────────────────────────────────────

`middleware.ts` (proxy.ts) requires no changes. The JWT payload still uses `user_role` which maps to the unchanged `Role` enum (ADMIN | STAFF | USER).

`auth.ts` requires no changes. The `handleLogin` and `handleRegister` functions still use `profile.role` which is the same `Role` enum.

One optional improvement — after this change `Profile` has a `name` field. If you want to store it during register, add it to `handleRegister`:
```typescript
const profile = await prisma.profile.create({
  data: {
    id: userId,
    email: email,
    name: email.split('@')[0], // or accept name as a param
    role: roleInput.toUpperCase() as any
  }
})
```