'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers, Eye, Users, Activity, AlertTriangle, Camera,
  Maximize2, Minimize2, RefreshCw, Zap, MapPin, Grid3X3,
  ChevronDown, BarChart3, Crosshair, Radio
} from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import Badge from '@/components/ui/BaseBadge';
import AnimatedCounter from '@/components/ui/AnimatedCounter';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

interface CameraHeatmapData {
  name: string;
  positions: { x: number; y: number }[];
  bounding_boxes: { x1: number; y1: number; x2: number; y2: number; conf: number }[];
  count: number;
  density: string;
  frame_width: number;
  frame_height: number;
  timestamp: string;
}

interface HeatmapResponse {
  cameras: Record<string, CameraHeatmapData>;
  grid: number[][];
  total_people: number;
  timestamp: string;
}

interface CameraInfo {
  id: number;
  name: string;
  status: string;
}

function getDensityColor(value: number): string {
  // Smooth gradient from green -> yellow -> orange -> red
  if (value <= 0.05) return 'rgba(16, 185, 129, 0.08)';
  if (value <= 0.2) return `rgba(16, 185, 129, ${0.2 + value * 2})`;
  if (value <= 0.4) return `rgba(234, 179, 8, ${0.3 + value})`;
  if (value <= 0.6) return `rgba(249, 115, 22, ${0.4 + value * 0.6})`;
  if (value <= 0.8) return `rgba(239, 68, 68, ${0.5 + value * 0.4})`;
  return `rgba(239, 68, 68, ${0.7 + value * 0.3})`;
}

function getDensityLevel(density: string): 'success' | 'warning' | 'danger' {
  if (density === 'High') return 'danger';
  if (density === 'Medium') return 'warning';
  return 'success';
}

function HeatmapSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-surface-soft rounded-lg animate-pulse" />
          <div className="h-4 w-80 bg-surface-soft rounded-lg animate-pulse" />
        </div>
        <div className="h-8 w-32 bg-surface-soft rounded-full animate-pulse" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-[100px] bg-surface-card rounded-2xl animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 h-[500px] bg-surface-card rounded-2xl animate-pulse" />
        <div className="h-[500px] bg-surface-card rounded-2xl animate-pulse" />
      </div>
    </div>
  );
}

export default function HeatmapPage() {
  const [heatmapData, setHeatmapData] = useState<HeatmapResponse | null>(null);
  const [cameras, setCameras] = useState<CameraInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'overlay' | 'split'>('grid');
  const [loading, setLoading] = useState(true);
  const [gridSize, setGridSize] = useState<20 | 30 | 40>(20);
  const [showPositions, setShowPositions] = useState(true);
  const [expandedCamera, setExpandedCamera] = useState<number | null>(null);
  const heatmapFrameRefs = useRef<Record<number, HTMLImageElement | null>>({});

  // Fetch cameras
  useEffect(() => {
    const fetchCameras = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/cameras');
        if (res.ok) {
          const data = await res.json();
          setCameras(data);
        }
      } catch (err) {
        console.error('Error fetching cameras:', err);
      }
    };
    fetchCameras();
    const interval = setInterval(fetchCameras, 10000);
    return () => clearInterval(interval);
  }, []);

  // Fetch heatmap data
  const fetchHeatmap = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:5000/api/heatmap/data');
      if (res.ok) {
        const data = await res.json();
        setHeatmapData(data);
      }
    } catch (err) {
      console.error('Error fetching heatmap:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHeatmap();
    const interval = setInterval(fetchHeatmap, 2000);
    return () => clearInterval(interval);
  }, [fetchHeatmap]);

  // Refresh heatmap image frames
  useEffect(() => {
    if (cameras.length === 0) return;
    const interval = setInterval(() => {
      cameras.forEach(cam => {
        const img = heatmapFrameRefs.current[cam.id];
        if (img) {
          img.src = `http://localhost:5000/api/cameras/${cam.id}/heatmap?t=${Date.now()}`;
        }
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [cameras]);

  // Computed stats
  const totalPeople = heatmapData?.total_people || 0;
  const activeCameras = cameras.length;
  const cameraEntries = Object.entries(heatmapData?.cameras || {});
  const highDensityCameras = cameraEntries.filter(([, cam]) => cam.density === 'High').length;

  const maxDensityCamera = useMemo(() => {
    if (!cameraEntries.length) return null;
    return cameraEntries.reduce((max, curr) =>
      curr[1].count > (max?.[1]?.count || 0) ? curr : max
    , cameraEntries[0]);
  }, [cameraEntries]);

  const overallDensity = useMemo(() => {
    if (highDensityCameras > 0) return 'High';
    const mediumCount = cameraEntries.filter(([, cam]) => cam.density === 'Medium').length;
    if (mediumCount > 0) return 'Medium';
    return 'Low';
  }, [cameraEntries, highDensityCameras]);

  // Grid data for selected view
  const displayGrid = useMemo(() => {
    if (!heatmapData?.grid) return [];
    return heatmapData.grid;
  }, [heatmapData]);

  if (loading && !heatmapData) return <HeatmapSkeleton />;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-red-500/20 to-amber-500/20 border border-red-500/20">
              <Layers size={22} className="text-red-600" />
            </div>
            Crowd Density Heatmap
          </h1>
          <p className="text-sm text-muted mt-1">Real-time spatial analysis from YOLO person detection</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={cameras.length > 0 ? 'success' : 'warning'} pulse={cameras.length > 0}>
            <Radio size={10} className="mr-1" />
            {cameras.length} Camera{cameras.length !== 1 ? 's' : ''} Active
          </Badge>
          <Badge variant={getDensityLevel(overallDensity)} pulse={overallDensity === 'High'}>
            {overallDensity} Density
          </Badge>
        </div>
      </div>

      {/* Stats Row */}
      <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-muted font-medium uppercase tracking-wider">Total Detected</p>
              <div className="mt-2">
                <AnimatedCounter value={totalPeople} className="text-3xl font-bold text-ink" />
              </div>
              <p className="text-xs text-muted-soft mt-1">people across all cameras</p>
            </div>
            <div className="p-2.5 rounded-xl bg-accent/15">
              <Users size={18} className="text-coral" />
            </div>
          </div>
          <div className="absolute -bottom-2 -right-2 w-20 h-20 bg-accent/5 rounded-full blur-2xl" />
        </GlassCard>

        <GlassCard className="relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-muted font-medium uppercase tracking-wider">Active Cameras</p>
              <div className="mt-2">
                <AnimatedCounter value={activeCameras} className="text-3xl font-bold text-ink" />
              </div>
              <p className="text-xs text-muted-soft mt-1">{highDensityCameras} with high density</p>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-500/15">
              <Camera size={18} className="text-blue-600" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-muted font-medium uppercase tracking-wider">Hottest Zone</p>
              <div className="mt-2">
                <span className="text-xl font-bold text-ink">
                  {maxDensityCamera ? maxDensityCamera[1].name : 'N/A'}
                </span>
              </div>
              <p className="text-xs text-muted-soft mt-1">
                {maxDensityCamera ? `${maxDensityCamera[1].count} people` : 'No data'}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-red-500/15">
              <Crosshair size={18} className="text-red-600" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-muted font-medium uppercase tracking-wider">High Density Alerts</p>
              <div className="mt-2">
                <AnimatedCounter value={highDensityCameras} className="text-3xl font-bold text-red-600" />
              </div>
              <p className="text-xs text-muted-soft mt-1">cameras in critical state</p>
            </div>
            <div className="p-2.5 rounded-xl bg-red-500/15">
              <AlertTriangle size={18} className="text-red-600" />
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* View Controls */}
      <motion.div variants={item} className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-1 p-1 rounded-xl bg-white/4 border border-hairline">
          {([
            { key: 'grid', icon: Grid3X3, label: 'Density Grid' },
            { key: 'overlay', icon: Layers, label: 'Camera Heatmaps' },
            { key: 'split', icon: BarChart3, label: 'Split View' },
          ] as const).map(mode => (
            <button
              key={mode.key}
              onClick={() => setViewMode(mode.key)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === mode.key ? 'bg-primary-light text-ink' : 'text-muted hover:text-body'
              }`}
            >
              <mode.icon size={14} />
              {mode.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => setShowPositions(!showPositions)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
              showPositions
                ? 'bg-accent/20 border-accent/30 text-coral'
                : 'bg-white/4 border-hairline text-muted'
            }`}
          >
            <Eye size={12} />
            Positions
          </button>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-muted-soft mr-1">Grid:</span>
            {([20, 30, 40] as const).map(size => (
              <button
                key={size}
                onClick={() => setGridSize(size)}
                className={`px-2 py-1 rounded text-[10px] font-medium transition-all ${
                  gridSize === size ? 'bg-primary-light text-ink' : 'bg-white/4 text-muted-soft'
                }`}
              >
                {size}×{size}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      {cameras.length === 0 ? (
        <motion.div variants={item}>
          <GlassCard className="text-center py-20" hover={false}>
            <Camera size={64} className="mx-auto text-white/15 mb-4" />
            <p className="text-muted text-lg">No cameras connected</p>
            <p className="text-xs text-muted-soft mt-2">Add cameras from the Live Cameras page to see heatmap data</p>
          </GlassCard>
        </motion.div>
      ) : (
        <>
          {/* Grid / Overlay / Split View */}
          {(viewMode === 'grid' || viewMode === 'split') && (
            <div className={`grid gap-6 ${viewMode === 'split' ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1'}`}>
              {/* Aggregated Density Grid */}
              <motion.div variants={item}>
                <GlassCard hover={false}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
                        <Grid3X3 size={14} className="text-coral" />
                        Aggregated Density Grid
                      </h3>
                      <p className="text-[10px] text-muted-soft mt-0.5">
                        {gridSize}×{gridSize} spatial density from {activeCameras} camera{activeCameras !== 1 ? 's' : ''} • {totalPeople} people tracked
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                        <span className="text-[10px] text-muted-soft">Low</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
                        <span className="text-[10px] text-muted-soft">Medium</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2.5 h-2.5 rounded-sm bg-red-500" />
                        <span className="text-[10px] text-muted-soft">High</span>
                      </div>
                      <Badge variant="success" pulse>
                        <RefreshCw size={10} className="mr-1" />
                        Live
                      </Badge>
                    </div>
                  </div>

                  <div
                    className="rounded-xl overflow-hidden border border-hairline bg-black/20"
                    style={{ aspectRatio: '1 / 1', maxHeight: '500px' }}
                  >
                    <div
                      className="grid w-full h-full"
                      style={{ gridTemplateColumns: `repeat(${displayGrid[0]?.length || gridSize}, 1fr)` }}
                    >
                      {displayGrid.flat().map((v, i) => (
                        <motion.div
                          key={`grid-${i}`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.0005, duration: 0.3 }}
                          className="relative group"
                          style={{
                            background: getDensityColor(v),
                            transition: 'background 0.5s ease',
                          }}
                          title={`Density: ${(v * 100).toFixed(1)}%`}
                        >
                          {/* Pulse effect for high density cells */}
                          {v > 0.7 && (
                            <div
                              className="absolute inset-0 animate-ping opacity-20"
                              style={{ background: 'rgba(239, 68, 68, 0.3)' }}
                            />
                          )}
                          {/* Tooltip on hover */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-50 pointer-events-none">
                            <div className="px-2 py-1 rounded bg-black/90 border border-white/10 text-[9px] text-on-dark whitespace-nowrap">
                              {(v * 100).toFixed(0)}% density
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Density gradient bar */}
                  <div className="mt-4 pt-3 border-t border-hairline">
                    <div className="flex items-center justify-between text-[10px] text-muted-soft mb-1.5">
                      <span>Density Gradient</span>
                      <span className="font-medium">
                        {overallDensity === 'High' ? '⚠️ CRITICAL' : overallDensity === 'Medium' ? '⚠️ ELEVATED' : '✅ NORMAL'}
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full overflow-hidden"
                      style={{
                        background: 'linear-gradient(to right, rgba(16,185,129,0.3), rgba(234,179,8,0.5), rgba(249,115,22,0.7), rgba(239,68,68,0.9))'
                      }}
                    />
                    <div className="flex justify-between text-[9px] text-muted-soft mt-1">
                      <span>0%</span>
                      <span>25%</span>
                      <span>50%</span>
                      <span>75%</span>
                      <span>100%</span>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>

              {/* Camera-level stats (in split view) */}
              {viewMode === 'split' && (
                <motion.div variants={item}>
                  <GlassCard hover={false} className="h-full">
                    <h3 className="text-sm font-semibold text-ink mb-4 flex items-center gap-2">
                      <BarChart3 size={14} className="text-coral" />
                      Per-Camera Breakdown
                    </h3>
                    <div className="space-y-3 max-h-[460px] overflow-y-auto pr-2">
                      {cameraEntries.map(([camId, camData]) => (
                        <div
                          key={camId}
                          className="p-3 rounded-xl bg-surface-soft border border-hairline hover:bg-surface-cream-strong transition-all cursor-pointer"
                          onClick={() => setExpandedCamera(expandedCamera === parseInt(camId) ? null : parseInt(camId))}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-2 h-2 rounded-full ${
                                camData.density === 'High' ? 'bg-red-500 animate-pulse'
                                : camData.density === 'Medium' ? 'bg-amber-500'
                                : 'bg-emerald-500'
                              }`} />
                              <span className="text-sm font-medium text-body-strong">{camData.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-body font-mono">{camData.count} ppl</span>
                              <Badge variant={getDensityLevel(camData.density)}>
                                {camData.density}
                              </Badge>
                            </div>
                          </div>

                          {/* Person position dots visualization */}
                          {showPositions && camData.positions.length > 0 && (
                            <div className="mt-3 relative h-16 rounded-lg bg-black/30 border border-hairline overflow-hidden">
                              {camData.positions.map((pos, idx) => (
                                <div
                                  key={idx}
                                  className="absolute w-2 h-2 rounded-full transform -translate-x-1/2 -translate-y-1/2"
                                  style={{
                                    left: `${pos.x * 100}%`,
                                    top: `${pos.y * 100}%`,
                                    background: camData.density === 'High'
                                      ? '#ef4444'
                                      : camData.density === 'Medium'
                                      ? '#f59e0b'
                                      : '#10b981',
                                    boxShadow: `0 0 6px ${
                                      camData.density === 'High' ? 'rgba(239,68,68,0.6)'
                                      : camData.density === 'Medium' ? 'rgba(245,158,11,0.6)'
                                      : 'rgba(16,185,129,0.6)'
                                    }`,
                                  }}
                                />
                              ))}
                              <div className="absolute top-1 left-1 text-[8px] text-muted-soft font-mono">
                                {camData.frame_width}×{camData.frame_height}
                              </div>
                            </div>
                          )}

                          {/* Expanded heatmap image */}
                          <AnimatePresence>
                            {expandedCamera === parseInt(camId) && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-3"
                              >
                                <div className="relative rounded-lg overflow-hidden border border-hairline">
                                  <img
                                    ref={el => { heatmapFrameRefs.current[parseInt(camId)] = el; }}
                                    src={`http://localhost:5000/api/cameras/${camId}/heatmap?t=${Date.now()}`}
                                    alt={`Heatmap ${camData.name}`}
                                    className="w-full h-auto"
                                  />
                                  <div className="absolute top-2 left-2">
                                    <Badge variant="success" pulse>
                                      <Radio size={8} className="mr-1" /> LIVE HEATMAP
                                    </Badge>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}

                      {cameraEntries.length === 0 && (
                        <div className="text-center py-8">
                          <Camera size={32} className="mx-auto text-white/15 mb-2" />
                          <p className="text-xs text-muted-soft">Waiting for detection data...</p>
                        </div>
                      )}
                    </div>
                  </GlassCard>
                </motion.div>
              )}
            </div>
          )}

          {/* Camera Heatmap Overlay View */}
          {(viewMode === 'overlay' || viewMode === 'grid') && (
            <motion.div variants={item}>
              <GlassCard hover={false}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
                    <Layers size={14} className="text-coral" />
                    Camera Density Heatmaps
                  </h3>
                  <p className="text-[10px] text-muted-soft">
                    Generated from YOLO person detections with Gaussian density smoothing
                  </p>
                </div>

                <div className={`grid gap-4 ${
                  cameras.length === 1 ? 'grid-cols-1' : cameras.length <= 4 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
                }`}>
                  {cameras.map(cam => {
                    const camData = heatmapData?.cameras?.[String(cam.id)];
                    return (
                      <div key={cam.id} className="relative group">
                        <div className="rounded-xl overflow-hidden border border-hairline bg-black/30">
                          {/* Heatmap image from backend */}
                          <div className="relative aspect-video">
                            <img
                              ref={el => { heatmapFrameRefs.current[cam.id] = el; }}
                              src={`http://localhost:5000/api/cameras/${cam.id}/heatmap?t=${Date.now()}`}
                              alt={`Heatmap ${cam.name}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />

                            {/* Person position overlay */}
                            {showPositions && camData && (
                              <div className="absolute inset-0 pointer-events-none">
                                {camData.positions.map((pos, idx) => (
                                  <div
                                    key={idx}
                                    className="absolute w-3 h-3 rounded-full border-2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse"
                                    style={{
                                      left: `${pos.x * 100}%`,
                                      top: `${pos.y * 100}%`,
                                      borderColor: camData.density === 'High' ? '#ef4444'
                                        : camData.density === 'Medium' ? '#f59e0b' : '#10b981',
                                      boxShadow: `0 0 8px ${
                                        camData.density === 'High' ? 'rgba(239,68,68,0.5)'
                                        : camData.density === 'Medium' ? 'rgba(245,158,11,0.5)'
                                        : 'rgba(16,185,129,0.5)'
                                      }`,
                                    }}
                                  />
                                ))}
                              </div>
                            )}

                            {/* Top badges */}
                            <div className="absolute top-2 left-2 flex items-center gap-2">
                              <Badge variant="success" pulse>
                                <Radio size={8} className="mr-1" /> LIVE
                              </Badge>
                              {camData && camData.density === 'High' && (
                                <Badge variant="danger" pulse>HIGH DENSITY</Badge>
                              )}
                            </div>

                            {/* Bottom info */}
                            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-ink">{cam.name}</span>
                                <div className="flex items-center gap-2">
                                  {camData && (
                                    <>
                                      <span className="text-xs text-body font-mono flex items-center gap-1">
                                        <Users size={10} />
                                        {camData.count}
                                      </span>
                                      <Badge variant={getDensityLevel(camData.density)}>
                                        {camData.density}
                                      </Badge>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* Position map for all cameras */}
          {showPositions && cameraEntries.length > 0 && viewMode !== 'split' && (
            <motion.div variants={item}>
              <GlassCard hover={false}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
                    <Crosshair size={14} className="text-coral" />
                    Real-Time Person Locations
                  </h3>
                  <span className="text-[10px] text-muted-soft">
                    {totalPeople} people tracked across {activeCameras} camera{activeCameras !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {cameraEntries.map(([camId, camData]) => (
                    <div key={camId} className="relative h-32 rounded-xl bg-black/30 border border-hairline overflow-hidden">
                      {/* Grid lines */}
                      <div className="absolute inset-0 pointer-events-none" style={{
                        backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
                        backgroundSize: '25% 25%'
                      }} />
                      {/* Center line */}
                      <div className="absolute top-0 bottom-0 left-1/2 w-px bg-surface-cream-strong" />
                      <div className="absolute left-0 right-0 top-1/2 h-px bg-surface-cream-strong" />

                      {/* Person dots */}
                      {camData.positions.map((pos, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute w-2.5 h-2.5 rounded-full transform -translate-x-1/2 -translate-y-1/2"
                          style={{
                            left: `${pos.x * 100}%`,
                            top: `${pos.y * 100}%`,
                            background: camData.density === 'High' ? '#ef4444'
                              : camData.density === 'Medium' ? '#f59e0b' : '#10b981',
                            boxShadow: `0 0 10px ${
                              camData.density === 'High' ? 'rgba(239,68,68,0.5)'
                              : camData.density === 'Medium' ? 'rgba(245,158,11,0.5)'
                              : 'rgba(16,185,129,0.5)'
                            }`,
                          }}
                        />
                      ))}

                      {/* Label */}
                      <div className="absolute top-2 left-2 flex items-center gap-2">
                        <span className="text-[10px] text-on-dark font-medium bg-black/50 px-2 py-0.5 rounded">
                          {camData.name}
                        </span>
                        <span className="text-[10px] text-on-dark-soft font-mono bg-black/40 px-1.5 py-0.5 rounded">{camData.count} ppl</span>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </motion.div>
          )}
        </>
      )}

      {/* Footer */}
      <motion.div variants={item} className="text-center">
        <p className="text-[10px] text-muted-soft flex items-center justify-center gap-2">
          <RefreshCw size={10} className="animate-spin" />
          Heatmap data refreshes every 2 seconds • Powered by YOLOv8 person detection
          {heatmapData?.timestamp && (
            <> • Last update: {new Date(heatmapData.timestamp).toLocaleTimeString()}</>
          )}
        </p>
      </motion.div>
    </motion.div>
  );
}
