//web/src/app/dashboard/page.tsx
'use client';

import { motion } from 'framer-motion';
import {
  Users, Activity, AlertTriangle, TrendingUp, MapPin,
  ArrowUpRight, Zap, Shield, Eye, Radio, Camera
} from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import AnimatedCounter from '@/components/ui/AnimatedCounter';
import CircularGauge from '@/components/ui/CircularGauge';
import Badge from '@/components/ui/BaseBadge';
import {
  BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Cell
} from 'recharts';
import { useStore } from '@/lib/store';
import Skeleton from '@/components/ui/Skeleton';
import { useMemo, useState, useEffect, useRef, useCallback } from 'react';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

// Type definitions
interface Camera {
  id: number;
  name: string;
  status: string;
}

interface CameraStats {
  count: number;
  density: string;
  zone_a: number;
  zone_b: number;
  timestamp: string;
  fps: number;
}

interface Alert {
  id: number;
  type: string;
  level: string;
  title: string;
  description: string;
  zone: string | any;
  time: string;
  resolved: boolean;
  camera_id?: number;
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-6 w-32 rounded-full" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <GlassCard key={i} className="h-[102px]">
             <div className="flex justify-between items-start">
               <div className="space-y-3">
                 <Skeleton className="h-3 w-20" />
                 <Skeleton className="h-8 w-16" />
               </div>
               <Skeleton className="h-10 w-10 rounded-xl" />
             </div>
          </GlassCard>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <GlassCard hover={false} className="xl:col-span-2 h-[334px]">
          <Skeleton className="h-5 w-48 mb-2" />
          <Skeleton className="h-3 w-40 mb-6" />
          <Skeleton className="h-[210px] w-full" />
        </GlassCard>
        <GlassCard hover={false} className="h-[334px]">
          <Skeleton className="h-5 w-32 mb-8" />
          <div className="grid grid-cols-2 gap-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex flex-col items-center gap-2">
                <Skeleton className="h-20 w-20 rounded-full" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <GlassCard key={i} hover={false} className="h-[340px]">
            <Skeleton className="h-5 w-32 mb-6" />
            <Skeleton className="h-[240px] w-full" />
          </GlassCard>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { crowdData, zoneDensity, alerts, zones, aiPredictions: predictions, ready } = useStore();
  const [realTimeStats, setRealTimeStats] = useState({
    totalPeople: 0,
    activeZones: 0,
    activeAlerts: 0,
    predictionsCount: 0
  });
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [cameraStats, setCameraStats] = useState<Record<number, CameraStats>>({});
  const [liveAlerts, setLiveAlerts] = useState<Alert[]>([]);
  const [heatmapGridData, setHeatmapGridData] = useState<number[][]>([]);
  const [historicalCounts, setHistoricalCounts] = useState<{ time: string; count: number }[]>([]);
  const [alertSoundEnabled, setAlertSoundEnabled] = useState(true);
  const alertAudioRef = useRef<HTMLAudioElement | null>(null);
  const lastAlertTime = useRef<number>(0);
  const previousAlertIds = useRef<Set<number>>(new Set());

  // Fetch cameras from backend
  useEffect(() => {
    const fetchCameras = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/cameras');
        if (response.ok) {
          const data = await response.json();
          setCameras(data);
        }
      } catch (error) {
        console.error('Error fetching cameras:', error);
      }
    };

    fetchCameras();
    const interval = setInterval(fetchCameras, 10000);
    return () => clearInterval(interval);
  }, []);

  // Fetch stats for each camera
  useEffect(() => {
    if (cameras.length === 0) return;

    const fetchStats = async () => {
      for (const camera of cameras) {
        try {
          const response = await fetch(`http://localhost:5000/api/cameras/${camera.id}/stats`);
          if (response.ok) {
            const stats = await response.json();
            setCameraStats(prev => ({ ...prev, [camera.id]: stats }));
          }
        } catch (error) {
          console.error(`Error fetching stats for camera ${camera.id}:`, error);
        }
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 1000);
    return () => clearInterval(interval);
  }, [cameras]);

  // Fetch real-time alerts from backend
  const fetchAlerts = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:5000/api/alerts');
      if (response.ok) {
        const data = await response.json();
        
        // Check for new alerts
        const currentAlertIds = new Set<number>(data.map((a: Alert) => a.id));
        const newAlerts = data.filter((alert: Alert) => !previousAlertIds.current.has(alert.id) && !alert.resolved);
        
        if (newAlerts.length > 0 && alertSoundEnabled) {
          const now = Date.now();
          if (now - lastAlertTime.current >= 5000) {
            lastAlertTime.current = now;
            if (alertAudioRef.current) {
              alertAudioRef.current.currentTime = 0;
              alertAudioRef.current.play().catch(e => console.warn('Audio play failed:', e));
            }
          }
        }
        
        previousAlertIds.current = currentAlertIds;
        // Get only unresolved alerts, sorted by time desc, limit to 10
        const unresolvedAlerts = data.filter((a: Alert) => !a.resolved);
        unresolvedAlerts.sort((a: Alert, b: Alert) => new Date(b.time).getTime() - new Date(a.time).getTime());
        setLiveAlerts(unresolvedAlerts.slice(0, 10));
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  }, [alertSoundEnabled]);

  // Fetch heatmap grid data
  const fetchHeatmapGrid = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:5000/api/heatmap/grid?rows=16&cols=16');
      if (response.ok) {
        const data = await response.json();
        setHeatmapGridData(data.grid || []);
      }
    } catch (error) {
      console.error('Error fetching heatmap grid:', error);
    }
  }, []);

  // Update historical data for chart
  useEffect(() => {
    const updateHistoricalData = () => {
      const currentTotal = Object.values(cameraStats).reduce((sum, stat) => sum + (stat.count || 0), 0);
      const now = new Date();
      const timeLabel = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      
      setHistoricalCounts(prev => {
        const newData = [...prev, { time: timeLabel, count: currentTotal }];
        if (newData.length > 12) newData.shift();
        return newData;
      });
    };
    
    updateHistoricalData();
    const interval = setInterval(updateHistoricalData, 5000);
    return () => clearInterval(interval);
  }, [cameraStats]);

  // Initialize historical data
  useEffect(() => {
    const initialData = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 5 * 60 * 1000);
      initialData.push({
        time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        count: 0
      });
    }
    setHistoricalCounts(initialData);
  }, []);

  // Initialize audio
  useEffect(() => {
    alertAudioRef.current = new Audio('/alert.mp3');
    alertAudioRef.current.volume = 0.6;
    return () => {
      if (alertAudioRef.current) {
        alertAudioRef.current.pause();
        alertAudioRef.current = null;
      }
    };
  }, []);

  // Polling intervals for real-time data
  useEffect(() => {
    fetchAlerts();
    fetchHeatmapGrid();
    
    const alertsInterval = setInterval(fetchAlerts, 2000);
    const heatmapInterval = setInterval(fetchHeatmapGrid, 1500);
    
    return () => {
      clearInterval(alertsInterval);
      clearInterval(heatmapInterval);
    };
  }, [fetchAlerts, fetchHeatmapGrid]);

  // Calculate real-time stats from actual data
  useEffect(() => {
    const stats = Object.values(cameraStats);
    const totalPeople = stats.reduce((sum, stat) => sum + (stat.count || 0), 0);
    const highDensityCount = stats.filter(stat => stat.density === 'High').length;
    
    setRealTimeStats({
      totalPeople,
      activeZones: cameras.length,
      activeAlerts: liveAlerts.length,
      predictionsCount: predictions?.length || 0
    });
  }, [cameraStats, cameras, liveAlerts, predictions]);

  const totalPeople = realTimeStats.totalPeople;
  const criticalAlerts = liveAlerts.filter(a => a.level === 'danger').length;
  const criticalZones = Object.values(cameraStats).filter(stat => stat.density === 'High').length;

  // Calculate system health metrics
  const totalCapacity = cameras.length * 100;
  const capacityPct = totalCapacity > 0 ? Math.min(100, Math.round((totalPeople / totalCapacity) * 100)) : 15;
  const avgDensity = cameras.length ? Object.values(cameraStats).reduce((s, stat) => s + (stat.density === 'High' ? 3 : stat.density === 'Medium' ? 2 : 1), 0) / cameras.length : 0;
  const avgDensityPct = Math.min(100, Math.round((avgDensity / 3) * 100));
  const riskLevel = Math.min(100, Math.round((criticalAlerts / Math.max(1, cameras.length)) * 100));

  // Generate zone density data from actual camera stats
  const dynamicZoneDensity = useMemo(() => {
    if (cameras.length === 0) {
      return [
        { zone: 'Zone A', density: 0, count: 0 },
        { zone: 'Zone B', density: 0, count: 0 },
        { zone: 'Zone C', density: 0, count: 0 },
        { zone: 'Zone D', density: 0, count: 0 },
      ];
    }

    return cameras.map((cam) => {
      const stats = cameraStats[cam.id];
      const count = stats?.count || 0;
      const density = Math.min(100, Math.round((count / 25) * 100));
      return {
        zone: cam.name?.length > 20 ? cam.name.substring(0, 18) + '...' : cam.name || `Camera ${cam.id}`,
        density,
        count
      };
    }).sort((a, b) => b.density - a.density);
  }, [cameras, cameraStats]);

  // Get density color for heatmap cell
  const getHeatmapCellColor = (value: number) => {
    if (value > 0.7) return `rgba(239, 68, 68, ${Math.min(0.95, value)})`;
    if (value > 0.4) return `rgba(245, 158, 11, ${Math.min(0.85, value)})`;
    if (value > 0.1) return `rgba(16, 185, 129, ${Math.min(0.7, value * 1.5)})`;
    return `rgba(16, 185, 129, 0.08)`;
  };

  // Get color for chart area based on current count
  const getChartGradientColor = (count: number) => {
    if (count >= 26) return '#ef4444';
    if (count >= 11) return '#f59e0b';
    return '#10b981';
  };

  const isReady = ready || cameras.length > 0;
  
  if (!isReady) return <DashboardSkeleton />;
  
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Command Center</h1>
          <p className="text-sm text-white/40 mt-1">Real-time crowd intelligence overview</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAlertSoundEnabled(!alertSoundEnabled)}
            className={`p-2 rounded-xl transition-colors ${alertSoundEnabled ? 'bg-accent/20 text-accent' : 'bg-white/5 text-white/30'}`}
            title={alertSoundEnabled ? "Alert Sound On" : "Alert Sound Off"}
          >
            {alertSoundEnabled ? <Zap size={14} /> : <Shield size={14} />}
          </button>
          <Badge variant={cameras.length > 0 ? "success" : "warning"} pulse={cameras.length > 0}>
            {cameras.length} Active {cameras.length === 1 ? 'Camera' : 'Cameras'}
          </Badge>
        </div>
      </div>

      {/* Top stats row */}
      <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <GlassCard className="relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-white/40 font-medium uppercase tracking-wider">Total Crowd</p>
              <div className="mt-2">
                <AnimatedCounter value={totalPeople} className="text-3xl font-bold text-white" />
              </div>
              <div className="flex items-center gap-1 mt-2">
                <ArrowUpRight size={14} className="text-emerald-400" />
                <span className="text-xs text-emerald-400 font-medium">Live count</span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-primary-light/15">
              <Users size={20} className="text-accent" />
            </div>
          </div>
          <div className="absolute -bottom-2 -right-2 w-24 h-24 bg-primary-light/5 rounded-full blur-2xl" />
        </GlassCard>

        <GlassCard className="relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-white/40 font-medium uppercase tracking-wider">Active Cameras</p>
              <div className="mt-2">
                <AnimatedCounter value={cameras.length} className="text-3xl font-bold text-white" />
              </div>
              <div className="flex items-center gap-1 mt-2">
                <span className="text-xs text-white/40">{criticalZones} with high density</span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/15">
              <MapPin size={20} className="text-amber-400" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-white/40 font-medium uppercase tracking-wider">Active Alerts</p>
              <div className="mt-2">
                <AnimatedCounter value={criticalAlerts} className="text-3xl font-bold text-red-400" />
              </div>
              <div className="flex items-center gap-1 mt-2">
                <ArrowUpRight size={14} className="text-red-400" />
                <span className="text-xs text-red-400 font-medium">{liveAlerts.length} total</span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-red-500/15">
              <AlertTriangle size={20} className="text-red-400" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-white/40 font-medium uppercase tracking-wider">AI Predictions</p>
              <div className="mt-2">
                <AnimatedCounter value={predictions?.length || 0} className="text-3xl font-bold text-white" />
              </div>
              <div className="flex items-center gap-1 mt-2">
                <Zap size={14} className="text-accent" />
                <span className="text-xs text-accent font-medium">Active forecasts</span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-accent/15">
              <TrendingUp size={20} className="text-accent" />
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Middle row: Chart + Gauges */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Color-coded Crowd Trend Chart */}
        <motion.div variants={item} className="xl:col-span-2">
          <GlassCard hover={false}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-semibold text-white">Real-Time Crowd Trend</h3>
                <p className="text-xs text-white/30 mt-0.5">Color-coded by density • Updates every 5 seconds</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-[10px] text-white/40">Low (0-10)</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-[10px] text-white/40">Medium (11-25)</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-[10px] text-white/40">High (26+)</span>
                </div>
                <Badge variant="success" pulse>Live</Badge>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={historicalCounts} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="crowdGradientDynamic" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={getChartGradientColor(historicalCounts[historicalCounts.length - 1]?.count || 0)} stopOpacity={0.6}/>
                      <stop offset="95%" stopColor={getChartGradientColor(historicalCounts[historicalCounts.length - 1]?.count || 0)} stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis 
                    dataKey="time" 
                    tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} 
                    axisLine={false} 
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis 
                    tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} 
                    axisLine={false} 
                    tickLine={false}
                    domain={[0, 'auto']}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(5,13,20,0.95)',
                      border: '1px solid rgba(122,178,178,0.3)',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: 12,
                      backdropFilter: 'blur(8px)',
                    }}
                    formatter={(value: any) => {
                      let color = '#10b981';
                      let level = 'Low';
                      if (value >= 26) {
                        color = '#ef4444';
                        level = 'High';
                      } else if (value >= 11) {
                        color = '#f59e0b';
                        level = 'Medium';
                      }
                      return [
                        <span style={{ color }}>{value} people</span>,
                        `${level} Density`
                      ];
                    }}
                    labelFormatter={(label) => `Time: ${label}`}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke={getChartGradientColor(historicalCounts[historicalCounts.length - 1]?.count || 0)}
                    strokeWidth={2.5}
                    fill="url(#crowdGradientDynamic)"
                    dot={false}
                    activeDot={{ r: 6, fill: getChartGradientColor(historicalCounts[historicalCounts.length - 1]?.count || 0), stroke: "#fff", strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            {/* Dynamic density indicator */}
            <div className="mt-4 pt-3 border-t border-white/10">
              <div className="flex items-center justify-between text-[10px] text-white/30 mb-2">
                <span>Current Density Status</span>
                <span className={`font-medium ${
                  historicalCounts[historicalCounts.length - 1]?.count >= 26 ? 'text-red-400' :
                  historicalCounts[historicalCounts.length - 1]?.count >= 11 ? 'text-amber-400' :
                  'text-emerald-400'
                }`}>
                  {(() => {
                    const currentCount = historicalCounts[historicalCounts.length - 1]?.count || 0;
                    if (currentCount >= 26) return '⚠️ CRITICAL - High Density';
                    if (currentCount >= 11) return '⚠️ WARNING - Moderate Density';
                    return '✅ NORMAL - Low Density';
                  })()}
                </span>
              </div>
              <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, (historicalCounts[historicalCounts.length - 1]?.count || 0) / 40 * 100)}%`,
                    background: (() => {
                      const currentCount = historicalCounts[historicalCounts.length - 1]?.count || 0;
                      if (currentCount >= 26) return 'linear-gradient(90deg, #ef4444, #dc2626)';
                      if (currentCount >= 11) return 'linear-gradient(90deg, #f59e0b, #d97706)';
                      return 'linear-gradient(90deg, #10b981, #059669)';
                    })()
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-white/20 mt-1">
                <span>0</span>
                <span>10 (Low)</span>
                <span>25 (Medium)</span>
                <span>40+ (High)</span>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Density Gauges */}
        <motion.div variants={item}>
          <GlassCard hover={false} className="h-full">
            <h3 className="text-sm font-semibold text-white mb-6">System Health</h3>
            <div className="grid grid-cols-2 gap-6">
              <CircularGauge value={capacityPct} max={100} label="Capacity" color="yellow" />
              <CircularGauge value={cameras.length > 0 ? 92 : 0} max={100} label="AI Accuracy" color="green" />
              <CircularGauge value={avgDensityPct} max={100} label="Avg Density" color="accent" />
              <CircularGauge value={riskLevel} max={100} label="Risk Level" color="red" />
            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* Bottom row: Zone density + Alerts + Real-time Heatmap - Fixed Alignment */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Camera Density Chart */}
        <motion.div variants={item}>
          <GlassCard hover={false} className="h-[420px] flex flex-col">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-white">Camera Density</h3>
              <p className="text-[10px] text-white/30 mt-0.5">Real-time crowd density per camera</p>
            </div>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dynamicZoneDensity} layout="vertical" margin={{ left: 0, right: 0, top: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                  <XAxis 
                    type="number" 
                    tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} 
                    axisLine={false} 
                    tickLine={false}
                    domain={[0, 110]}
                  />
                  <YAxis 
                    dataKey="zone" 
                    type="category" 
                    tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} 
                    axisLine={false} 
                    tickLine={false} 
                    width={110}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(5,13,20,0.95)',
                      border: '1px solid rgba(122,178,178,0.2)',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: 12,
                    }}
                    formatter={(value: any, name: any, props: any) => {
                      const count = props.payload.count;
                      return [`${value}% (${count} people)`, 'Density'];
                    }}
                  />
                  <Bar dataKey="density" radius={[0, 6, 6, 0]} barSize={20}>
                    {dynamicZoneDensity.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.density >= 70 ? '#ef4444' : entry.density >= 40 ? '#f59e0b' : '#10b981'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </motion.div>

        {/* Live Alerts Panel - Dynamic from Backend */}
        <motion.div variants={item}>
          <GlassCard hover={false} className="h-[420px] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-white">Live Alerts</h3>
                <p className="text-[10px] text-white/30 mt-0.5">Real-time incident notifications</p>
              </div>
              <Badge variant={liveAlerts.filter(a => a.level === 'danger').length > 0 ? "danger" : "warning"} pulse={liveAlerts.length > 0}>
                {liveAlerts.length} Active
              </Badge>
            </div>
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-0">
              <div className="space-y-2.5">
                {liveAlerts.length > 0 ? (
                  liveAlerts.map((alert, idx) => (
                    <motion.div
                      key={`${alert.id}-${idx}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="p-3 rounded-xl bg-white/2 hover:bg-white/5 transition-all border-l-2"
                      style={{
                        borderLeftColor: alert.level === 'danger' ? '#ef4444' : alert.level === 'warning' ? '#f59e0b' : '#3b82f6'
                      }}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className={`p-1.5 rounded-lg flex-shrink-0 ${
                          alert.level === 'danger' ? 'bg-red-500/20' : 
                          alert.level === 'warning' ? 'bg-amber-500/20' : 'bg-blue-500/20'
                        }`}>
                          {alert.type === 'overcrowding' ? (
                            <Users size={14} className={alert.level === 'danger' ? 'text-red-400' : 'text-amber-400'} />
                          ) : (
                            <AlertTriangle size={14} className={alert.level === 'danger' ? 'text-red-400' : 'text-amber-400'} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-xs font-medium text-white/90 truncate">{alert.title}</p>
                            <Badge variant={alert.level === 'danger' ? 'danger' : 'warning'} className="text-[10px] px-1.5 py-0.5">
                              {alert.level === 'danger' ? 'CRITICAL' : 'WARNING'}
                            </Badge>
                          </div>
                          <p className="text-[10px] text-white/50 mt-1 line-clamp-2">{alert.description}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="inline-flex items-center gap-1 text-[9px] text-white/30">
                              <MapPin size={9} />
                              {typeof alert.zone === 'string' ? (alert.zone.length > 15 ? alert.zone.substring(0, 12) + '...' : alert.zone) : (alert.zone?.name || 'Unknown')}
                            </span>
                            <span className="text-[9px] text-white/20">•</span>
                            <span className="inline-flex items-center gap-1 text-[9px] text-white/30">
                              <Activity size={9} />
                              {new Date(alert.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                          </div>
                        </div>
                        {alert.level === 'danger' && (
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse flex-shrink-0 mt-1" />
                        )}
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Shield size={40} className="mx-auto text-white/15 mb-3" />
                    <p className="text-sm text-white/30">No active alerts</p>
                    <p className="text-[10px] text-white/20 mt-1">All systems operating normally</p>
                  </div>
                )}
              </div>
            </div>
            {liveAlerts.length > 0 && (
              <div className="mt-3 pt-2 border-t border-white/10">
                <p className="text-[9px] text-white/20 text-center">
                  Last updated: {new Date().toLocaleTimeString()}
                </p>
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* Real-time Heatmap */}
        <motion.div variants={item}>
          <GlassCard hover={false} className="h-[420px] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Radio size={14} className="text-accent animate-pulse" />
                  Real-Time Heatmap
                </h3>
                <p className="text-[10px] text-white/30 mt-0.5">Live density visualization</p>
              </div>
              <Eye size={14} className="text-white/30" />
            </div>
            <div className="relative rounded-xl overflow-hidden border border-white/[0.06] bg-black/20 flex-1 min-h-0">
              {heatmapGridData.length > 0 ? (
                <div 
                  className="grid w-full h-full"
                  style={{ 
                    gridTemplateColumns: `repeat(${heatmapGridData[0]?.length || 16}, 1fr)`,
                    aspectRatio: '1 / 1'
                  }}
                >
                  {heatmapGridData.flat().map((value, i) => (
                    <motion.div
                      key={`heatmap-${i}`}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.0005, duration: 0.2 }}
                      className="relative group transition-all duration-200"
                      style={{
                        background: getHeatmapCellColor(value),
                        boxShadow: value > 0.7 ? 'inset 0 0 8px rgba(239,68,68,0.3)' : 'none',
                      }}
                    >
                      {value > 0.7 && (
                        <div className="absolute inset-0 animate-ping opacity-30 rounded-sm"
                          style={{ background: 'rgba(239, 68, 68, 0.3)' }}
                        />
                      )}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-50 pointer-events-none">
                        <div className="px-2 py-1 rounded bg-black/90 border border-white/10 text-[9px] text-white whitespace-nowrap">
                          Density: {Math.round(value * 100)}%
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <Camera size={32} className="mx-auto text-white/15 mb-2" />
                    <p className="text-xs text-white/30">Waiting for data...</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Heatmap legend */}
            <div className="flex items-center justify-between mt-4 pt-2">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                  <span className="text-[9px] text-white/30">Low</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
                  <span className="text-[9px] text-white/30">Medium</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded-sm bg-red-500" />
                  <span className="text-[9px] text-white/30">High</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-16 h-2 rounded-sm bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500" />
                <span className="text-[8px] text-white/20">Scale →</span>
              </div>
            </div>
            
            {/* Real-time stats */}
            <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[8px] text-white/30">Live 1.5s</span>
              </div>
              <span className="text-[8px] text-white/30 font-mono">
                {totalPeople} people tracked
              </span>
            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* Custom scrollbar styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(122, 178, 178, 0.4);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(122, 178, 178, 0.6);
        }
      `}</style>
    </motion.div>
  );
}