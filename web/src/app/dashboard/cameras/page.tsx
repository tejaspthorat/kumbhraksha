//web/src/app/dashboard/cameras/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera as CameraIcon, Maximize2, Minimize2, Users, Activity, Eye, Layers, Grid3X3, Plus, Trash2, Wifi, WifiOff, Play, Pause, AlertCircle } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import Badge from '@/components/ui/BaseBadge';
import { useStore } from '@/lib/store';
import AddCameraModal from '@/components/ui/AddCameraModal';
import Skeleton from '@/components/ui/Skeleton';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';
import RefreshButton from '@/components/ui/RefreshButton';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const item = { hidden: { opacity: 0, scale: 0.95 }, show: { opacity: 1, scale: 1 } };

function CamerasSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-32 rounded-xl" />
          <Skeleton className="h-10 w-24 rounded-xl" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <GlassCard key={i} className="p-0 overflow-hidden" hover={false}>
            <Skeleton className="aspect-video w-full rounded-none" />
            <div className="p-4 flex justify-between items-center">
              <Skeleton className="h-4 w-32" />
              <div className="flex gap-2">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-16 rounded-full" />
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}

export interface Camera {
  id: number;
  name: string;
  ip: string;
  port: number;
  protocol: string;
  status: string;
  count: number;
  density: number;
  level: 'success' | 'warning' | 'danger';
  fps: number;
  added_at: string;
  zoneId?: number;
  zone?: any;
}

export interface CameraStats {
  count: number;
  density: string;
  zone_a: number;
  zone_b: number;
  fps?: number;
  timestamp?: string;
}

export default function CamerasPage() {
  const { cameras, ready, fetchDashboardData } = useStore();
  const { status } = useRealtimeSync('Camera');
  const [expanded, setExpanded] = useState<number | null>(null);
  const [overlay, setOverlay] = useState<'none' | 'heatmap' | 'zones'>('none');
  const [grid, setGrid] = useState<'2x2' | '3x3'>('3x3');
  const [fetchedCameras, setFetchedCameras] = useState<Camera[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraStats, setCameraStats] = useState<Record<number, CameraStats>>({});

  const currentCameras = fetchedCameras.length > 0 ? fetchedCameras : (cameras as unknown as Camera[] || []);

  const fetchCameras = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/cameras');
      if (!response.ok) throw new Error('Failed to fetch cameras');
      const data = await response.json();
      setFetchedCameras(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching cameras:', err);
      setError('Failed to connect to backend server. Make sure it\'s running on port 5000');
      setFetchedCameras([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (fetchedCameras.length === 0) return;
    
    for (const camera of fetchedCameras) {
      try {
        const response = await fetch(`http://localhost:5000/api/cameras/${camera.id}/stats`);
        if (response.ok) {
          const stats = await response.json();
          setCameraStats(prev => ({ ...prev, [camera.id]: stats }));
        }
      } catch (err) {
        console.error(`Error fetching stats for camera ${camera.id}:`, err);
      }
    }
  };

  useEffect(() => {
    fetchCameras();
  }, []);

  useEffect(() => {
    const interval = setInterval(fetchStats, 2000);
    return () => clearInterval(interval);
  }, [fetchedCameras]);

  const deleteCamera = async (cameraId: number) => {
    if (!confirm('Are you sure you want to remove this camera?')) return;
    
    try {
      const response = await fetch(`http://localhost:5000/api/cameras/${cameraId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setFetchedCameras(fetchedCameras.filter(cam => cam.id !== cameraId));
        if (expanded === cameraId) setExpanded(null);
        setCameraStats(prev => {
          const newStats = { ...prev };
          delete newStats[cameraId];
          return newStats;
        });
      }
    } catch (err) {
      console.error('Error deleting camera:', err);
    }
  };

  const handleAddCamera = (newCamera: Camera) => {
    setFetchedCameras(prev => [...prev, newCamera]);
    fetchCameras();
  };

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Live Monitoring</h1>
            <p className="text-sm text-white/40 mt-1">Real-time multi-camera visual intelligence grid</p>
          </div>
          <div className="flex items-center gap-4">
            <RefreshButton onRefresh={fetchDashboardData} status={status} />
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-linear-to-r from-accent to-accent-light text-white font-medium hover:shadow-lg transition-all"
            >
              <Plus size={16} />
              Add Camera
            </button>
            <div className="flex items-center gap-1 p-1 rounded-xl bg-white/4 border border-white/6">
              {(['none', 'heatmap', 'zones'] as const).map(o => (
                <button
                  key={o}
                  onClick={() => setOverlay(o)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    overlay === o ? 'bg-primary-light text-white' : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  {o === 'none' ? <Eye size={14} /> : o === 'heatmap' ? <Layers size={14} /> : <Grid3X3 size={14} />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && fetchedCameras.length === 0 && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {(!ready || loading) ? (
          <CamerasSkeleton />
        ) : currentCameras.length === 0 ? (
          <div className="text-center py-20">
            <CameraIcon size={48} className="mx-auto text-white/20 mb-4" />
            <p className="text-white/40">No cameras added yet</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 px-4 py-2 rounded-xl bg-accent/20 text-accent text-sm hover:bg-accent/30 transition-colors"
            >
              Add your first camera
            </button>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {expanded !== null ? (
              <motion.div
                key="expanded"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <ExpandedCamera
                  cam={currentCameras.find((c) => c.id === expanded)!}
                  stats={cameraStats[expanded]}
                  overlay={overlay}
                  onClose={() => setExpanded(null)}
                  onDelete={deleteCamera}
                />
              </motion.div>
            ) : (
              <motion.div
                key="grid"
                variants={container}
                initial="hidden"
                animate="show"
                className={`grid gap-4 ${
                  grid === '2x2' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
                }`}
              >
                {currentCameras.map((cam) => (
                  <motion.div
                    key={cam.id}
                    variants={item}
                  >
                    <CameraCard
                      cam={cam}
                      stats={cameraStats[cam.id]}
                      overlay={overlay}
                      onExpand={() => setExpanded(cam.id)}
                      onDelete={deleteCamera}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </motion.div>

      <AddCameraModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddCamera}
      />
    </>
  );
}

function CameraCard({ cam, stats, overlay, onExpand, onDelete }: { 
  cam: any; 
  stats?: CameraStats;
  overlay: string; 
  onExpand: () => void;
  onDelete: (id: number) => void;
}) {
  const { zones } = useStore();
  const zone = zones?.find((z: any) => z.id === cam.zoneId) || cam.zone || { people: 0, density: 0, level: 'success' };
  const storeDensity = zone.density || 0;
  const storeCount = zone.people || 0;
  
  const [isPlaying, setIsPlaying] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [frameKey, setFrameKey] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);
  const frameUrl = `http://localhost:5000/api/cameras/${cam.id}/frame`;

  useEffect(() => {
    if (!isPlaying) return;
    
    // Refresh frame every 50ms for smoother video
    const interval = setInterval(() => {
      if (imgRef.current && isPlaying) {
        // Force reload with cache busting
        const timestamp = Date.now();
        imgRef.current.src = `${frameUrl}?t=${timestamp}`;
        setFrameKey(timestamp);
      }
    }, 50); // Faster refresh for video
    
    return () => clearInterval(interval);
  }, [cam.id, isPlaying, frameUrl]);

  const currentStats = stats || { 
    count: cam.count ?? storeCount, 
    density: cam.density ? (cam.density > 2 ? 'High' : cam.density > 1 ? 'Medium' : 'Low') : (storeDensity > 2 ? 'High' : storeDensity > 1 ? 'Medium' : 'Low'), 
    zone_a: 0, 
    zone_b: 0,
    fps: 0
  };
  
  const densityLevel = getDensityLevel(currentStats.density);

  return (
    <GlassCard className="p-0 overflow-hidden group">
      <div className="relative aspect-video bg-linear-to-br from-[#0a1520] to-[#0d1f2d] overflow-hidden">
        {/* Live video feed */}
        <img
          ref={imgRef}
          src={`${frameUrl}?t=${frameKey}`}
          alt={`Camera ${cam.name}`}
          className="w-full h-full object-cover"
          style={{ display: isPlaying && !imageError ? 'block' : 'none' }}
          onError={(e) => {
            console.log(`Failed to load frame for camera ${cam.id}`);
            setImageError(true);
          }}
          onLoad={() => {
            console.log(`Frame loaded for camera ${cam.id}`);
            setImageError(false);
          }}
        />
        
        {/* Placeholder when paused or error */}
        {(!isPlaying || imageError) && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            {imageError ? (
              <div className="text-center">
                <AlertCircle size={32} className="text-red-400 mx-auto mb-2" />
                <p className="text-xs text-red-400">Connection failed</p>
                <button 
                  onClick={() => {
                    setImageError(false);
                    if (imgRef.current) {
                      imgRef.current.src = `${frameUrl}?t=${Date.now()}`;
                    }
                  }}
                  className="mt-2 px-3 py-1 text-xs bg-accent/20 text-accent rounded-lg hover:bg-accent/30"
                >
                  Retry
                </button>
              </div>
            ) : (
              <CameraIcon size={48} className="text-white/20" />
            )}
          </div>
        )}

        {/* Overlay effects */}
        {overlay === 'heatmap' && (
          <div className="absolute inset-0 bg-linear-to-br from-emerald-500/20 via-amber-500/20 to-red-500/30 mix-blend-screen pointer-events-none" />
        )}
        
        {/* Zone overlay */}
        {overlay === 'zones' && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-4 border-2 border-dashed border-accent/40 rounded-lg">
              <span className="absolute top-1 left-2 text-[10px] text-accent/60 font-mono">{zone?.name || 'Zone'}</span>
            </div>
            <div className="absolute top-0 bottom-0 left-1/2 w-px bg-accent/40" />
            <span className="absolute top-2 left-4 text-[10px] text-accent/60 font-mono bg-black/50 px-2 py-1 rounded">
              Zone A: {currentStats.zone_a}
            </span>
            <span className="absolute top-2 right-4 text-[10px] text-accent/60 font-mono bg-black/50 px-2 py-1 rounded">
              Zone B: {currentStats.zone_b}
            </span>
          </div>
        )}

        {/* Controls */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <Badge variant={!imageError ? "success" : "danger"} pulse={!imageError}>
            <span className="flex items-center gap-1">
              {!imageError ? <Wifi size={10} /> : <WifiOff size={10} />} 
              {!imageError ? 'LIVE' : 'ERROR'}
            </span>
          </Badge>
          {currentStats.density === 'High' && (
            <Badge variant="danger" pulse>
              HIGH DENSITY
            </Badge>
          )}
          {currentStats.fps && currentStats.fps > 0 && (
            <Badge variant="info" className="text-[10px]">
              {currentStats.fps} FPS
            </Badge>
          )}
        </div>

        <div className="absolute top-3 right-3 flex items-center gap-2">
          {!imageError && (
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-1.5 rounded-lg bg-black/50 hover:bg-black/70 transition-colors"
            >
              {isPlaying ? <Pause size={14} className="text-white/60" /> : <Play size={14} className="text-white/60" />}
            </button>
          )}
          <button
            onClick={() => onDelete(cam.id)}
            className="p-1.5 rounded-lg bg-black/50 hover:bg-red-500/70 transition-colors opacity-0 group-hover:opacity-100"
          >
            <Trash2 size={14} className="text-white/60" />
          </button>
          <button
            onClick={onExpand}
            className="p-1.5 rounded-lg bg-black/50 hover:bg-black/70 transition-colors opacity-0 group-hover:opacity-100"
          >
            <Maximize2 size={14} className="text-white/60" />
          </button>
        </div>
      </div>

      {/* Info bar */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CameraIcon size={14} className="text-white/30" />
          <span className="text-sm font-medium text-white/70">{cam.name}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Users size={12} className="text-white/30" />
            <span className="text-xs font-bold text-white">{currentStats.count}</span>
          </div>
          <Badge variant={densityLevel}>
            {currentStats.density}
          </Badge>
        </div>
      </div>
    </GlassCard>
  );
}

function ExpandedCamera({ cam, stats, overlay, onClose, onDelete }: { 
  cam: any; 
  stats?: CameraStats;
  overlay: string; 
  onClose: () => void;
  onDelete: (id: number) => void;
}) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [frameKey, setFrameKey] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);
  const frameUrl = `http://localhost:5000/api/cameras/${cam.id}/frame`;

  useEffect(() => {
    if (!isPlaying) return;
    
    const interval = setInterval(() => {
      if (imgRef.current && isPlaying) {
        const timestamp = Date.now();
        imgRef.current.src = `${frameUrl}?t=${timestamp}`;
        setFrameKey(timestamp);
      }
    }, 50);
    
    return () => clearInterval(interval);
  }, [cam.id, isPlaying, frameUrl]);

  const { zones } = useStore();
  const zone = zones?.find((z: any) => z.id === cam.zoneId) || cam.zone || { people: 0, density: 0 };

  const currentStats = stats || { 
    count: cam.count ?? zone.people ?? 0, 
    density: cam.density ? (cam.density > 2 ? 'High' : cam.density > 1 ? 'Medium' : 'Low') : 'Low', 
    zone_a: 0, 
    zone_b: 0,
    fps: 0
  };
  const densityLevel = getDensityLevel(currentStats.density);

  return (
    <GlassCard className="p-0 overflow-hidden" hover={false}>
      <div className="relative aspect-21/9 bg-linear-to-br from-[#0a1520] to-[#0d1f2d] overflow-hidden">
        <img
          ref={imgRef}
          src={`${frameUrl}?t=${frameKey}`}
          alt={`Camera ${cam.name}`}
          className="w-full h-full object-cover"
          style={{ display: isPlaying && !imageError ? 'block' : 'none' }}
          onError={() => {
            console.log(`Failed to load expanded frame for camera ${cam.id}`);
            setImageError(true);
          }}
          onLoad={() => {
            console.log(`Expanded frame loaded for camera ${cam.id}`);
            setImageError(false);
          }}
        />
        
        {(!isPlaying || imageError) && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            {imageError ? (
              <div className="text-center">
                <AlertCircle size={48} className="text-red-400 mx-auto mb-3" />
                <p className="text-sm text-red-400">Failed to connect to camera stream</p>
                <button 
                  onClick={() => {
                    setImageError(false);
                    if (imgRef.current) {
                      imgRef.current.src = `${frameUrl}?t=${Date.now()}`;
                    }
                  }}
                  className="mt-3 px-4 py-2 text-sm bg-accent/20 text-accent rounded-lg hover:bg-accent/30"
                >
                  Retry Connection
                </button>
              </div>
            ) : (
              <CameraIcon size={64} className="text-white/20" />
            )}
          </div>
        )}

        {overlay === 'heatmap' && (
          <div className="absolute inset-0 bg-linear-to-br from-emerald-500/20 via-amber-500/30 to-red-500/30 mix-blend-screen pointer-events-none" />
        )}

        {overlay === 'zones' && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 bottom-0 left-1/2 w-px bg-accent/60" />
            <div className="absolute top-4 left-8 px-3 py-1 bg-black/50 rounded-lg text-xs text-accent font-mono">
              Zone A - {currentStats.zone_a} people
            </div>
            <div className="absolute top-4 right-8 px-3 py-1 bg-black/50 rounded-lg text-xs text-accent font-mono">
              Zone B - {currentStats.zone_b} people
            </div>
          </div>
        )}

        <div className="absolute top-4 left-4">
          <Badge variant={!imageError ? "success" : "danger"} pulse={!imageError}>
            {!imageError ? 'LIVE' : 'ERROR'} • {cam.name}
          </Badge>
          {currentStats.fps && currentStats.fps > 0 && (
            <Badge variant="info" className="ml-2">
              {currentStats.fps} FPS
            </Badge>
          )}
        </div>
        
        <div className="absolute top-4 right-4 flex items-center gap-2">
          {!imageError && (
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2 rounded-lg bg-black/50 hover:bg-black/70 transition-colors"
            >
              {isPlaying ? <Pause size={16} className="text-white/60" /> : <Play size={16} className="text-white/60" />}
            </button>
          )}
          <button
            onClick={() => onDelete(cam.id)}
            className="p-2 rounded-lg bg-black/50 hover:bg-red-500/70 transition-colors"
          >
            <Trash2 size={16} className="text-white/60" />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-black/50 hover:bg-black/70 transition-colors"
          >
            <Minimize2 size={16} className="text-white/60" />
          </button>
        </div>
      </div>
      
      <div className="p-6 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-accent" />
            <span className="text-lg font-bold text-white">{currentStats.count}</span>
            <span className="text-sm text-white/30">people detected</span>
          </div>
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-accent" />
            <span className="text-lg font-bold text-white">
              {currentStats.density}
            </span>
            <span className="text-sm text-white/30">density</span>
          </div>
          {currentStats.fps && currentStats.fps > 0 && (
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-accent" />
              <span className="text-lg font-bold text-white">{currentStats.fps}</span>
              <span className="text-sm text-white/30">FPS</span>
            </div>
          )}
        </div>
        <Badge variant={densityLevel}>
          {currentStats.density === 'High' ? 'CRITICAL' : currentStats.density === 'Medium' ? 'WARNING' : 'NORMAL'} DENSITY
        </Badge>
      </div>
    </GlassCard>
  );
}

function getDensityLevel(density: string): 'success' | 'warning' | 'danger' {
  if (density === 'High') return 'danger';
  if (density === 'Medium') return 'warning';
  return 'success';
}