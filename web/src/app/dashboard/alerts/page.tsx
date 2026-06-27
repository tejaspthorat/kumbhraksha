'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, AlertTriangle, Shield, Zap, Users, Volume2, VolumeX, 
  Filter, Clock, MapPin, CheckCircle, RefreshCw, X, 
  TrendingUp, Activity, Eye, ChevronDown, ChevronUp,
  Calendar, Search, Download, MoreHorizontal, Play, Pause
} from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import Badge from '@/components/ui/BaseBadge';
import { useStore } from '@/lib/store';
import Skeleton from '@/components/ui/Skeleton';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';
import RefreshButton from '@/components/ui/RefreshButton';

type AlertType = 'overcrowding' | 'intrusion' | 'panic' | 'surge';
type AlertLevel = 'info' | 'warning' | 'danger';

interface Alert {
  id: number;
  type: AlertType;
  level: AlertLevel;
  title: string;
  description: string;
  zone: string | { name: string; [key: string]: any };
  time: string;
  resolved: boolean;
  camera_id?: number;
}

const typeIcons: Record<AlertType, typeof AlertTriangle> = {
  overcrowding: Users,
  intrusion: Shield,
  panic: Zap,
  surge: AlertTriangle,
};

const typeColors: Record<AlertType, string> = {
  overcrowding: 'text-red-400',
  intrusion: 'text-amber-400',
  panic: 'text-yellow-400',
  surge: 'text-orange-400',
};

const typeGradients: Record<AlertType, string> = {
  overcrowding: 'from-red-500/20 to-red-600/10',
  intrusion: 'from-amber-500/20 to-amber-600/10',
  panic: 'from-yellow-500/20 to-yellow-600/10',
  surge: 'from-orange-500/20 to-orange-600/10',
};

const levelConfig: Record<AlertLevel, { color: string; bg: string; border: string; icon: any }> = {
  danger: {
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    icon: AlertTriangle,
  },
  warning: {
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    icon: Activity,
  },
  info: {
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    icon: Bell,
  },
};

const container = { 
  hidden: { opacity: 0 }, 
  show: { opacity: 1, transition: { staggerChildren: 0.05 } } 
};

const item = { 
  hidden: { opacity: 0, y: 20 }, 
  show: { opacity: 1, y: 0 } 
};

function AlertsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <Skeleton className="h-8 w-24 rounded-full" />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <GlassCard key={i} className="text-center h-[112px]">
            <Skeleton className="h-8 w-8 mx-auto mb-2 rounded-lg" />
            <Skeleton className="h-6 w-12 mx-auto mb-1" />
            <Skeleton className="h-3 w-16 mx-auto" />
          </GlassCard>
        ))}
      </div>

      <div className="flex gap-2 items-center flex-wrap">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-8 w-24 rounded-lg" />
        <Skeleton className="h-8 w-32 rounded-lg" />
        <Skeleton className="h-8 w-28 rounded-lg" />
        <Skeleton className="ml-auto h-8 w-32 rounded-lg" />
      </div>

      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map(i => (
          <GlassCard key={i} className="h-[110px]">
            <div className="flex gap-4">
               <Skeleton className="h-12 w-12 rounded-xl" />
               <div className="flex-1 space-y-2">
                 <div className="flex gap-2">
                   <Skeleton className="h-4 w-40" />
                   <Skeleton className="h-4 w-16 rounded-full" />
                 </div>
                 <Skeleton className="h-3 w-full max-w-[400px]" />
                 <div className="flex gap-4">
                   <Skeleton className="h-2.5 w-24" />
                   <Skeleton className="h-2.5 w-16" />
                 </div>
               </div>
               <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}

export default function AlertsPage() {
  const { ready, fetchDashboardData } = useStore();
  const { status } = useRealtimeSync('Alert');
  const [filter, setFilter] = useState<'all' | AlertType>('all');
  const [soundOn, setSoundOn] = useState(true);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [newAlertIds, setNewAlertIds] = useState<number[]>([]);
  const [expandedAlert, setExpandedAlert] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [timeRange, setTimeRange] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [autoScroll, setAutoScroll] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previousAlertIds = useRef<Set<number>>(new Set());
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Initialize audio with the alert.mp3 file
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        // Create audio element with the public file
        audioRef.current = new Audio('/alert.mp3');
        audioRef.current.volume = 0.7;
        audioRef.current.preload = 'auto';
        
        // Test if audio can play
        audioRef.current.addEventListener('canplaythrough', () => {
          console.log('Alert sound loaded successfully from /alert.mp3');
        });
        
        audioRef.current.addEventListener('error', (e) => {
          console.error('Failed to load alert sound from /alert.mp3:', e);
          // Try alternative path
          audioRef.current = new Audio('/sounds/alert.mp3');
          audioRef.current.volume = 0.7;
        });
      } catch (error) {
        console.error('Error creating audio element:', error);
      }
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Play sound function with multiple fallback attempts
  const playAlertSound = useCallback(async () => {
    if (!soundOn) return;
    
    try {
      // Try to play the audio file
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          await playPromise;
          console.log('Alert sound played successfully');
          return;
        }
      }
      
      // Fallback: Create a new audio element with the file
      const fallbackAudio = new Audio('/alert.mp3');
      fallbackAudio.volume = 0.7;
      await fallbackAudio.play();
      console.log('Fallback alert sound played');
      
    } catch (error) {
      console.log('Audio file play failed, using Web Audio fallback:', error);
      
      // Final fallback: Web Audio API beep
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 880;
        gainNode.gain.value = 0.3;
        
        oscillator.start();
        gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.5);
        oscillator.stop(audioContext.currentTime + 0.5);
        
        if (audioContext.state === 'suspended') {
          await audioContext.resume();
        }
        console.log('Web Audio fallback beep played');
      } catch (webAudioError) {
        console.error('All sound methods failed:', webAudioError);
      }
    }
  }, [soundOn]);

  // Track when sound was last played to avoid spam
  const lastSoundTime = useRef<number>(0);
  const SOUND_COOLDOWN = 15000; // 15 seconds between sounds

  // Fetch alerts from backend
  const fetchAlerts = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:5000/api/alerts');
      if (response.ok) {
        const data = await response.json();
        
        // Check for new critical alerts
        const currentAlertIds = new Set<number>(data.map((a: Alert) => a.id));
        const newAlerts = data.filter((alert: Alert) => !previousAlertIds.current.has(alert.id));
        
        if (newAlerts.length > 0 && previousAlertIds.current.size > 0) {
          // Add animation for new alerts
          setNewAlertIds(newAlerts.map((a: Alert) => a.id));
          setTimeout(() => setNewAlertIds([]), 3000);
          
          // Auto-scroll to new alerts if enabled
          if (autoScroll && scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = 0;
          }
        }
        
        // Play sound if there are any unresolved overcrowding alerts (with cooldown)
        const hasActiveOvercrowding = data.some(
          (alert: Alert) => alert.type === 'overcrowding' && alert.level === 'danger' && !alert.resolved
        );
        if (hasActiveOvercrowding) {
          const now = Date.now();
          if (now - lastSoundTime.current >= SOUND_COOLDOWN) {
            lastSoundTime.current = now;
            playAlertSound();
          }
        }
        
        previousAlertIds.current = currentAlertIds;
        setAlerts(data);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  }, [playAlertSound, autoScroll]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:5000/api/alerts/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  // Resolve alert
  const resolveAlert = async (alertId: number) => {
    try {
      const response = await fetch(`http://localhost:5000/api/alerts/${alertId}/resolve`, {
        method: 'PUT',
      });
      if (response.ok) {
        setAlerts(prev => prev.map(alert => 
          alert.id === alertId ? { ...alert, resolved: true } : alert
        ));
      }
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  };

  // Initial fetch and polling
  useEffect(() => {
    fetchAlerts();
    fetchStats();
    
    const interval = setInterval(() => {
      fetchAlerts();
      fetchStats();
    }, 3000);
    
    return () => clearInterval(interval);
  }, [fetchAlerts, fetchStats]);

  // Filter alerts based on search and time range
  const filteredAlerts = alerts.filter(alert => {
    // Filter by type
    if (filter !== 'all' && alert.type !== filter) return false;
    
    // Filter by search term
    if (searchTerm && !alert.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !alert.description.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    
    // Filter by time range
    if (timeRange !== 'all') {
      const alertTime = new Date(alert.time);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      if (timeRange === 'today' && alertTime < today) return false;
      if (timeRange === 'week' && alertTime < weekAgo) return false;
      if (timeRange === 'month' && alertTime < monthAgo) return false;
    }
    
    return true;
  });

  const activeAlerts = alerts.filter(a => !a.resolved);
  const activeCount = activeAlerts.length;
  const criticalCount = activeAlerts.filter(a => a.level === 'danger').length;
  const warningCount = activeAlerts.filter(a => a.level === 'warning').length;

  // Get stats counts
  const overcrowdingCount = stats.by_type?.overcrowding || 0;
  const intrusionCount = stats.by_type?.intrusion || 0;
  const panicCount = stats.by_type?.panic || 0;
  const surgeCount = stats.by_type?.surge || 0;

  const getTimeAgo = (timeStr: string) => {
    const time = new Date(timeStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - time.getTime()) / 1000);
    
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Alert Center</h1>
          <p className="text-sm text-white/40 mt-1">Real-time threat detection and incident management</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`p-2.5 rounded-xl border transition-colors ${
              autoScroll ? 'bg-accent/20 border-accent/30 text-accent' : 'bg-white/4 border-white/6 text-white/40'
            }`}
            title={autoScroll ? "Auto-scroll On" : "Auto-scroll Off"}
          >
            {autoScroll ? <Play size={16} /> : <Pause size={16} />}
          </button>
          <button
            onClick={() => setSoundOn(!soundOn)}
            className={`p-2.5 rounded-xl border transition-colors ${
              soundOn ? 'bg-accent/20 border-accent/30 text-accent' : 'bg-white/4 border-white/6 text-white/40'
            }`}
            title={soundOn ? "Sound On" : "Sound Off"}
          >
            {soundOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
          <Badge variant="danger" pulse={activeCount > 0} className="px-4 py-2">
            {activeCount} Active {activeCount === 1 ? 'Alert' : 'Alerts'}
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard 
          className="text-center relative overflow-hidden group cursor-pointer hover:scale-[1.02] transition-transform"
          onClick={() => setFilter('overcrowding')}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/0 to-red-500/5 group-hover:opacity-100 opacity-0 transition-opacity" />
          <Users size={24} className="text-red-400 mx-auto mb-2" />
          <span className="text-2xl font-bold text-white">{overcrowdingCount}</span>
          <p className="text-xs text-white/40 mt-1">Overcrowding Events</p>
          {filter === 'overcrowding' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500" />
          )}
        </GlassCard>
        
        <GlassCard 
          className="text-center relative overflow-hidden group cursor-pointer hover:scale-[1.02] transition-transform"
          onClick={() => setFilter('intrusion')}
        >
          <Shield size={24} className="text-amber-400 mx-auto mb-2" />
          <span className="text-2xl font-bold text-white">{intrusionCount}</span>
          <p className="text-xs text-white/40 mt-1">Intrusion Alerts</p>
          {filter === 'intrusion' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500" />
          )}
        </GlassCard>
        
        <GlassCard 
          className="text-center relative overflow-hidden group cursor-pointer hover:scale-[1.02] transition-transform"
          onClick={() => setFilter('panic')}
        >
          <Zap size={24} className="text-yellow-400 mx-auto mb-2" />
          <span className="text-2xl font-bold text-white">{panicCount}</span>
          <p className="text-xs text-white/40 mt-1">Panic Events</p>
          {filter === 'panic' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-500" />
          )}
        </GlassCard>
        
        <GlassCard 
          className="text-center relative overflow-hidden group cursor-pointer hover:scale-[1.02] transition-transform"
          onClick={() => setFilter('surge')}
        >
          <TrendingUp size={24} className="text-orange-400 mx-auto mb-2" />
          <span className="text-2xl font-bold text-white">{surgeCount}</span>
          <p className="text-xs text-white/40 mt-1">Sudden Surges</p>
          {filter === 'surge' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" />
          )}
        </GlassCard>
      </motion.div>

      {/* Filters and Search */}
      <motion.div variants={item} className="flex flex-col md:flex-row items-start md:items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={14} className="text-white/30" />
          {(['all', 'overcrowding', 'intrusion', 'panic', 'surge'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === f 
                  ? 'bg-primary-light text-white shadow-lg' 
                  : 'bg-white/4 text-white/40 hover:text-white/70 hover:bg-white/8'
              }`}
            >
              {f === 'all' ? 'All Alerts' : f.charAt(0).toUpperCase() + f.slice(1)}
              {f !== 'all' && filter === f && (
                <span className="ml-2 text-[10px] opacity-70">
                  {alerts.filter(a => a.type === f && !a.resolved).length}
                </span>
              )}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-2 flex-wrap ml-auto">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              placeholder="Search alerts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-accent/50"
            />
          </div>
          
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-3 py-1.5 text-xs bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-accent/50"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
          </select>
          
          <button className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
            <Download size={14} className="text-white/40" />
          </button>
        </div>
      </motion.div>

      {/* Alert Stats Summary */}
      {activeCount > 0 && (
        <motion.div variants={item} className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-red-500/10 to-amber-500/10 border border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs text-white/60">Critical: {criticalCount}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-xs text-white/60">Warning: {warningCount}</span>
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <Eye size={12} className="text-white/30" />
            <span className="text-[10px] text-white/30">Auto-refresh every 3s</span>
          </div>
        </motion.div>
      )}

      {/* Alert List */}
      {(!ready || loading) ? (
        <AlertsSkeleton />
      ) : filteredAlerts.length === 0 ? (
        <motion.div variants={item}>
          <GlassCard className="text-center py-16">
            <Bell size={64} className="mx-auto text-white/20 mb-4" />
            <p className="text-white/40 text-lg">No alerts found</p>
            <p className="text-xs text-white/20 mt-2">
              {searchTerm || filter !== 'all' || timeRange !== 'all' 
                ? 'Try adjusting your filters' 
                : 'All systems are operating normally'}
            </p>
          </GlassCard>
        </motion.div>
      ) : (
        <div ref={scrollContainerRef} className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
          <AnimatePresence>
            {filteredAlerts.map((alert, index) => {
              const Icon = typeIcons[alert.type];
              const LevelIcon = levelConfig[alert.level].icon;
              const isNew = newAlertIds.includes(alert.id);
              const isExpanded = expandedAlert === alert.id;
              const timeAgo = getTimeAgo(alert.time);
              
              return (
                <motion.div 
                  key={alert.id} 
                  variants={item}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  layout
                >
                  <GlassCard 
                    hover={!alert.resolved} 
                    className={`${alert.resolved ? 'opacity-60' : ''} ${isNew ? 'ring-2 ring-accent/50 animate-pulse' : ''} relative overflow-hidden transition-all duration-300`}
                  >
                    {/* Background gradient */}
                    <div className={`absolute inset-0 bg-gradient-to-r ${typeGradients[alert.type]} opacity-50`} />
                    
                    {/* Glow effect for critical alerts */}
                    {!alert.resolved && alert.level === 'danger' && (
                      <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 via-red-500/10 to-red-500/0 animate-shimmer" />
                    )}
                    
                    <div className="relative p-4">
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div className={`p-3 rounded-xl ${levelConfig[alert.level].bg} border ${levelConfig[alert.level].border}`}>
                          <Icon size={24} className={typeColors[alert.type]} />
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <h3 className="text-base font-semibold text-white">{alert.title}</h3>
                            <Badge variant={alert.level === 'danger' ? 'danger' : alert.level === 'warning' ? 'warning' : 'info'}>
                              <LevelIcon size={10} className="inline mr-1" />
                              {alert.level.toUpperCase()}
                            </Badge>
                            {alert.resolved && (
                              <Badge variant="success">
                                <CheckCircle size={10} className="inline mr-1" />
                                Resolved
                              </Badge>
                            )}
                            {isNew && !alert.resolved && (
                              <Badge variant="info" className="animate-pulse">
                                NEW
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-sm text-white/60 mb-3">{alert.description}</p>
                          
                          <div className="flex items-center gap-4 flex-wrap">
                            <span className="inline-flex items-center gap-1.5 text-xs text-white/40">
                              <MapPin size={12} /> 
                              {typeof alert.zone === 'object' ? alert.zone.name : alert.zone}
                            </span>
                            <span className="inline-flex items-center gap-1.5 text-xs text-white/40">
                              <Clock size={12} /> 
                              {new Date(alert.time).toLocaleString()} ({timeAgo})
                            </span>
                            {alert.camera_id && (
                              <span className="inline-flex items-center gap-1.5 text-xs text-white/40">
                                <Eye size={12} /> 
                                Camera #{alert.camera_id}
                              </span>
                            )}
                          </div>
                          
                          {/* Expanded content */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-4 pt-4 border-t border-white/10"
                              >
                                <div className="grid grid-cols-2 gap-3 text-xs">
                                  <div className="p-2 rounded-lg bg-white/5">
                                    <p className="text-white/40 mb-1">Alert ID</p>
                                    <p className="text-white font-mono">#{alert.id}</p>
                                  </div>
                                  <div className="p-2 rounded-lg bg-white/5">
                                    <p className="text-white/40 mb-1">Severity Score</p>
                                    <p className="text-white font-bold">
                                      {alert.level === 'danger' ? '85/100' : alert.level === 'warning' ? '55/100' : '25/100'}
                                    </p>
                                  </div>
                                  <div className="p-2 rounded-lg bg-white/5 col-span-2">
                                    <p className="text-white/40 mb-1">Recommended Action</p>
                                    <p className="text-white">
                                      {alert.type === 'overcrowding' 
                                        ? 'Deploy additional staff to manage crowd flow and open emergency exits if necessary.'
                                        : alert.type === 'intrusion'
                                        ? 'Security team to investigate unauthorized access immediately.'
                                        : 'Monitor situation and prepare evacuation protocols.'}
                                    </p>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex flex-col gap-2">
                          {!alert.resolved && (
                            <button
                              onClick={() => resolveAlert(alert.id)}
                              className="p-2 rounded-lg bg-green-500/10 hover:bg-green-500/20 transition-colors group"
                              title="Resolve Alert"
                            >
                              <CheckCircle size={18} className="text-green-400 group-hover:scale-110 transition-transform" />
                            </button>
                          )}
                          <button
                            onClick={() => setExpandedAlert(isExpanded ? null : alert.id)}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                          >
                            {isExpanded ? <ChevronUp size={18} className="text-white/60" /> : <ChevronDown size={18} className="text-white/60" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
      
      {/* Footer */}
      {!loading && alerts.length > 0 && (
        <motion.div variants={item} className="text-center">
          <p className="text-[10px] text-white/20 flex items-center justify-center gap-2">
            <RefreshCw size={10} className={status === 'connected' ? 'animate-spin' : ''} />
            Real-time updates every 3 seconds • {filteredAlerts.length} alerts shown
            {filter !== 'all' && ` • Filtered by: ${filter}`}
            {searchTerm && ` • Searching: "${searchTerm}"`}
          </p>
        </motion.div>
      )}
      
      {/* Custom scrollbar styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(122, 178, 178, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(122, 178, 178, 0.5);
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </motion.div>
  );
}