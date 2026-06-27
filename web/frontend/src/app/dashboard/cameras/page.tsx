'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  AlertTriangle,
  Camera,
  Eye,
  Flame,
  Plus,
  Radio,
  RefreshCw,
  Route,
  ShieldAlert,
  SplitSquareHorizontal,
  Trash2,
  Users,
  Video,
} from 'lucide-react';
import { krApi } from '@/lib/missing/client';
import type { MissingReport } from '@/lib/missing/types';
import { NETWORK_CENTER as networkCenter, withLiveCascade } from '@/lib/missing/cascade';
import { geo, cameraZone, type CctvCamera, type CctvZone } from '@/lib/nashik/geo';
import { PageHeading, StatTile } from '@/components/missing/CaseUI';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import AddCameraModal from '@/components/ui/AddCameraModal';
import { distanceMeters } from '@/lib/geo';
import {
  crowdCameraApi,
  type CameraStats,
  type CrowdCamera,
} from '@/lib/crowdCameras';

const OpsMap = dynamic(() => import('@/components/missing/OpsMap'), {
  ssr: false,
  loading: () => (
    <div className="aspect-[16/10] w-full rounded-xl bg-surface-soft border border-hairline animate-pulse" />
  ),
});

const CAM_COVERAGE_M = 60;

type FeedMode = 'frame' | 'heatmap';

function densityLabel(camera?: CrowdCamera | null, stats?: CameraStats | null) {
  const value = stats?.density ?? camera?.density ?? 'Low';
  return typeof value === 'string' ? value : 'Low';
}

function densityVariant(density: string) {
  if (density === 'High') return 'danger';
  if (density === 'Medium') return 'warning';
  return 'success';
}

function statusDot(status: string) {
  if (status === 'online') return 'bg-success';
  if (status === 'error') return 'bg-error';
  if (status === 'connecting') return 'bg-warning';
  return 'bg-muted-soft';
}

function cameraPriority(camera: CrowdCamera) {
  if (camera.status !== 'online') return camera.status === 'connecting' ? 20 : 30;
  if (camera.camera_type === 'phone') return 0;
  if (camera.video_source?.startsWith('http')) return 1;
  return 2;
}

function preferredCameraId(cameras: CrowdCamera[]) {
  return [...cameras].sort((a, b) => cameraPriority(a) - cameraPriority(b) || a.id - b.id)[0]?.id ?? null;
}

export default function CctvIntelligencePage() {
  const [mapCameras, setMapCameras] = useState<CctvCamera[]>([]);
  const [zones, setZones] = useState<CctvZone[]>([]);
  const [reports, setReports] = useState<MissingReport[]>([]);
  const [showZones, setShowZones] = useState(true);

  const [liveCameras, setLiveCameras] = useState<CrowdCamera[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<number | null>(null);
  const [selectedStats, setSelectedStats] = useState<CameraStats | null>(null);
  const [feedMode, setFeedMode] = useState<FeedMode>('frame');
  const [frameTick, setFrameTick] = useState(Date.now());
  const [addOpen, setAddOpen] = useState(false);
  const [liveLoading, setLiveLoading] = useState(true);
  const [liveError, setLiveError] = useState<string | null>(null);

  const loadLiveCameras = useCallback(async () => {
    try {
      const data = await crowdCameraApi.list();
      const sorted = [...data].sort((a, b) => cameraPriority(a) - cameraPriority(b) || a.id - b.id);
      setLiveCameras(sorted);
      setSelectedCameraId((prev) => {
        const previous = prev ? sorted.find((camera) => camera.id === prev) : null;
        if (previous?.status === 'online') return prev;
        return preferredCameraId(sorted);
      });
      setLiveError(null);
    } catch (error) {
      setLiveError(error instanceof Error ? error.message : 'Unable to load live cameras');
    } finally {
      setLiveLoading(false);
    }
  }, []);

  useEffect(() => {
    geo.cameras().then(setMapCameras).catch(() => {});
    geo.zones().then(setZones).catch(() => {});
    krApi.reports().then((r) => setReports(r.map(withLiveCascade))).catch(() => {});
    loadLiveCameras();

    const id = setInterval(loadLiveCameras, 5000);
    return () => clearInterval(id);
  }, [loadLiveCameras]);

  useEffect(() => {
    if (!selectedCameraId) {
      setSelectedStats(null);
      return;
    }

    const cameraId = selectedCameraId;
    let cancelled = false;
    async function loadStats() {
      try {
        const stats = await crowdCameraApi.stats(cameraId);
        if (!cancelled) setSelectedStats(stats);
      } catch {
        if (!cancelled) setSelectedStats(null);
      }
    }

    loadStats();
    const id = setInterval(loadStats, 2000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [selectedCameraId]);

  useEffect(() => {
    if (!selectedCameraId) return;
    setFrameTick(Date.now());
    const id = setInterval(() => setFrameTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, [selectedCameraId, feedMode]);

  const selectedCamera = useMemo(
    () => liveCameras.find((camera) => camera.id === selectedCameraId) ?? null,
    [liveCameras, selectedCameraId]
  );

  const onlineCameras = useMemo(
    () => liveCameras.filter((camera) => camera.status === 'online').length,
    [liveCameras]
  );

  const coverage = useMemo(() => {
    const active = reports.filter((r) => r.status !== 'REUNITED');
    let covered = 0;
    const blind: MissingReport[] = [];

    for (const r of active) {
      const inView = mapCameras.some(
        (c) =>
          distanceMeters(
            { lat: r.lastSeenLat, lng: r.lastSeenLng },
            { lat: c.lat, lng: c.lng }
          ) <= CAM_COVERAGE_M
      );
      if (inView) covered++;
      else blind.push(r);
    }

    return { covered, blind, active: active.length };
  }, [mapCameras, reports]);

  const sectors = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of mapCameras) {
      const z = cameraZone(c.name);
      map.set(z, (map.get(z) ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  }, [mapCameras]);

  async function handleAdded(camera: CrowdCamera) {
    setLiveCameras((prev) => [camera, ...prev.filter((c) => c.id !== camera.id)]);
    setSelectedCameraId(camera.id);
    setSelectedStats(null);
    await loadLiveCameras();
  }

  async function removeSelectedCamera() {
    if (!selectedCamera) return;
    const ok = window.confirm(`Remove ${selectedCamera.name}?`);
    if (!ok) return;

    await crowdCameraApi.remove(selectedCamera.id);
    setLiveCameras((prev) => prev.filter((camera) => camera.id !== selectedCamera.id));
    setSelectedCameraId((prev) => (prev === selectedCamera.id ? null : prev));
    setSelectedStats(null);
    await loadLiveCameras();
  }

  const selectedDensity = densityLabel(selectedCamera, selectedStats);
  const selectedCount = selectedStats?.count ?? selectedCamera?.count ?? 0;
  const selectedFps = selectedStats?.fps ?? selectedCamera?.fps ?? 0;
  const frameSrc = selectedCamera
    ? feedMode === 'frame'
      ? crowdCameraApi.frameUrl(selectedCamera.id, frameTick)
      : crowdCameraApi.heatmapUrl(selectedCamera.id, frameTick)
    : '';

  return (
    <div className="max-w-[1280px] mx-auto">
      <PageHeading eyebrow="Coverage Intelligence - Nashik Kumbh" title="CCTV Intelligence">
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setShowZones((v) => !v)}>
            <Eye className="size-4" /> Coverage zones
          </Button>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="size-4" /> Add camera
          </Button>
        </div>
      </PageHeading>

      <AddCameraModal isOpen={addOpen} onClose={() => setAddOpen(false)} onAdd={handleAdded} />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatTile
          label="Cameras mapped"
          value={mapCameras.length.toLocaleString('en-IN')}
          accent="teal"
          hint="Static CCTV dataset"
        />
        <StatTile label="Coverage zones" value={zones.length} hint="Surveillance polygons" />
        <StatTile
          label="Live feeds"
          value={`${onlineCameras}/${liveCameras.length}`}
          accent={onlineCameras > 0 ? 'teal' : 'coral'}
          hint="Connected to crowd backend"
        />
        <StatTile
          label="Cases in view"
          value={`${coverage.covered}/${coverage.active}`}
          hint={`Active case within ${CAM_COVERAGE_M} m`}
        />
        <StatTile
          label="In blind spots"
          value={coverage.blind.length}
          accent="coral"
          hint="No camera within reach"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_420px] gap-6">
        <section className="card-canvas p-5">
          <div className="flex items-center gap-2 mb-4">
            <Camera className="size-4 text-muted" />
            <h2 className="text-lg font-medium tracking-tight">Coverage map</h2>
          </div>
          <OpsMap
            className="aspect-[16/10] w-full"
            center={networkCenter}
            spanMeters={4000}
            showRings
            cameraPoints={mapCameras}
            zones={showZones ? zones : []}
            cases={reports
              .filter((r) => r.status !== 'REUNITED')
              .map((r) => ({
                id: r.id,
                lat: r.lastSeenLat,
                lng: r.lastSeenLng,
                label: r.person.name,
                radiusMeters: r.alertRadiusMeters,
              }))}
          />
          <div className="flex flex-wrap items-center gap-4 mt-4 text-[12px] text-muted">
            <Legend color="bg-accent-teal" label="Mapped CCTV camera" />
            <Legend color="bg-accent-teal/10 border border-accent-teal/50" label="Coverage zone" />
            <Legend color="bg-coral" label="Active case" />
          </div>
        </section>

        <aside className="space-y-6">
          <section className="card-dark p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <Video className="size-4 text-coral" />
                <p className="caption-upper text-on-dark-soft">Live feed</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setFeedMode('frame')}
                  className={
                    'inline-flex size-8 items-center justify-center rounded-md transition-colors ' +
                    (feedMode === 'frame'
                      ? 'bg-surface-dark-elevated text-on-dark'
                      : 'text-on-dark-soft hover:bg-surface-dark-elevated')
                  }
                  title="Annotated feed"
                >
                  <Video className="size-4" />
                </button>
                <button
                  onClick={() => setFeedMode('heatmap')}
                  className={
                    'inline-flex size-8 items-center justify-center rounded-md transition-colors ' +
                    (feedMode === 'heatmap'
                      ? 'bg-surface-dark-elevated text-on-dark'
                      : 'text-on-dark-soft hover:bg-surface-dark-elevated')
                  }
                  title="Heatmap overlay"
                >
                  <Flame className="size-4" />
                </button>
              </div>
            </div>

            {selectedCamera ? (
              <>
                <div className="relative aspect-video overflow-hidden rounded-lg border border-white/10 bg-black">
                  <img
                    src={frameSrc}
                    alt={`${selectedCamera.name} ${feedMode === 'frame' ? 'feed' : 'heatmap'}`}
                    className="h-full w-full object-contain"
                  />
                  <div className="absolute left-3 top-3 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-medium text-on-dark">
                      <span className={`size-2 rounded-full ${statusDot(selectedCamera.status)}`} />
                      {selectedCamera.status}
                    </span>
                    <Badge variant={densityVariant(selectedDensity)}>{selectedDensity}</Badge>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-on-dark font-medium truncate">{selectedCamera.name}</h3>
                      <p className="text-[12px] text-on-dark-soft truncate">
                        {selectedCamera.video_source || `${selectedCamera.protocol ?? 'http'} source`}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setFrameTick(Date.now())}
                        className="inline-flex size-8 items-center justify-center rounded-md text-on-dark-soft hover:bg-surface-dark-elevated"
                        title="Refresh frame"
                      >
                        <RefreshCw className="size-4" />
                      </button>
                      <button
                        onClick={removeSelectedCamera}
                        className="inline-flex size-8 items-center justify-center rounded-md text-error hover:bg-error/10"
                        title="Remove camera"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 mt-4">
                    <Metric icon={Users} label="People" value={selectedCount} />
                    <Metric icon={Flame} label="Density" value={selectedDensity} />
                    <Metric
                      icon={SplitSquareHorizontal}
                      label="Zones"
                      value={`${selectedStats?.zone_a ?? 0}|${selectedStats?.zone_b ?? 0}`}
                    />
                    <Metric icon={Radio} label="FPS" value={selectedFps} />
                  </div>
                </div>
              </>
            ) : (
              <div className="grid place-items-center rounded-lg border border-white/10 bg-black/20 py-14 text-center">
                <div>
                  <Camera className="mx-auto size-10 text-on-dark-soft" />
                  <p className="mt-3 text-sm text-on-dark">No live camera selected</p>
                  <p className="mt-1 text-[12px] text-on-dark-soft">Add a webcam, IP stream, or video file.</p>
                </div>
              </div>
            )}
          </section>

          <section className="card-canvas p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="caption-upper text-muted">Backend cameras</p>
              <Button variant="secondary" size="icon-sm" onClick={loadLiveCameras} title="Refresh cameras">
                <RefreshCw className="size-4" />
              </Button>
            </div>

            {liveError && (
              <div className="mb-3 flex items-start gap-2 rounded-lg border border-error/20 bg-error/10 p-3 text-[12px] text-error">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                <span>{liveError}</span>
              </div>
            )}

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
              {liveCameras.map((camera) => {
                const density = densityLabel(camera);
                const selected = camera.id === selectedCameraId;
                return (
                  <button
                    key={camera.id}
                    onClick={() => setSelectedCameraId(camera.id)}
                    className={
                      'w-full rounded-lg border p-3 text-left transition-colors ' +
                      (selected
                        ? 'border-coral/40 bg-coral/5'
                        : 'border-hairline hover:bg-surface-soft')
                    }
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="min-w-0 truncate text-sm font-medium text-ink">
                        {camera.name}
                      </span>
                      <span className={`size-2.5 shrink-0 rounded-full ${statusDot(camera.status)}`} />
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2 text-[12px] text-muted">
                      <span>{camera.count ?? 0} people</span>
                      <Badge variant={densityVariant(density)}>{density}</Badge>
                    </div>
                  </button>
                );
              })}

              {!liveLoading && liveCameras.length === 0 && (
                <div className="rounded-lg border border-dashed border-hairline p-5 text-center">
                  <p className="text-sm text-muted">No backend cameras yet.</p>
                  <Button className="mt-3" size="sm" onClick={() => setAddOpen(true)}>
                    <Plus className="size-4" /> Add camera
                  </Button>
                </div>
              )}
            </div>
          </section>
        </aside>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <section className="card-dark p-5">
          <div className="flex items-center gap-2 mb-3">
            <ShieldAlert className="size-4 text-coral" />
            <p className="caption-upper text-on-dark-soft">Blind-spot alert</p>
          </div>
          {coverage.active === 0 ? (
            <p className="text-on-dark-soft text-[14px]">No active cases right now.</p>
          ) : coverage.blind.length === 0 ? (
            <p className="text-on-dark-soft text-[14px]">
              All active cases are within camera coverage.
            </p>
          ) : (
            <div className="space-y-2">
              {coverage.blind.map((r) => (
                <div key={r.id} className="rounded-lg bg-surface-dark-elevated p-3">
                  <p className="text-on-dark text-[14px] font-medium">{r.person.name}</p>
                  <p className="text-on-dark-soft text-[13px]">{r.lastSeenLabel}</p>
                  <p className="text-coral text-[12px] mt-1 flex items-center gap-1">
                    <Route className="size-3" /> Deploy field team - expand alert radius 50%
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="card-canvas p-5">
          <p className="caption-upper text-muted mb-3">Cameras by zone - top 10</p>
          <div className="space-y-2.5">
            {sectors.map(([zone, count]) => {
              const max = sectors[0]?.[1] ?? 1;
              return (
                <div key={zone} className="flex items-center gap-3">
                  <span className="text-[13px] text-body w-14 shrink-0 font-mono">{zone}</span>
                  <div className="flex-1 h-2 rounded-full bg-surface-soft overflow-hidden">
                    <div
                      className="h-full rounded-full bg-accent-teal"
                      style={{ width: `${(count / max) * 100}%` }}
                    />
                  </div>
                  <span className="font-mono text-[12px] text-muted w-8 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-lg bg-surface-dark-elevated p-2.5">
      <div className="flex items-center gap-1.5 text-[11px] text-on-dark-soft">
        <Icon className="size-3.5" />
        {label}
      </div>
      <p className="mt-1 truncate font-mono text-[14px] text-on-dark">{value}</p>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`size-2.5 rounded-full ${color}`} />
      {label}
    </span>
  );
}
