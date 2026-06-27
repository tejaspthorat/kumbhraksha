'use client';

import { motion } from 'framer-motion';
import { Cpu, Zap, Thermometer, Battery, Wifi, HardDrive, Gauge, Activity, Clock } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import Badge from '@/components/ui/BaseBadge';
import CircularGauge from '@/components/ui/CircularGauge';
import { useStore } from '@/lib/store';



const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function EdgeAIPage() {
  const { devices } = useStore();
  const online = devices.filter((d: any) => d.status === 'online').length;
  const avgFps = online > 0 ? Math.round(devices.filter((d: any) => d.status === 'online').reduce((s: number, d: any) => s + d.fps, 0) / online) : 0;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Edge AI Nodes</h1>
        <p className="text-sm text-white/40 mt-1">Monitor edge devices running YOLOv8 inference on low-power hardware</p>
      </div>

      {/* Stats */}
      <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-emerald-500/15"><Cpu size={20} className="text-emerald-400" /></div>
            <div>
              <p className="text-xs text-white/40">Nodes Online</p>
              <span className="text-2xl font-bold text-white">{online}/{devices.length}</span>
            </div>
          </div>
        </GlassCard>
        <GlassCard>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-accent/15"><Gauge size={20} className="text-accent" /></div>
            <div>
              <p className="text-xs text-white/40">Avg FPS</p>
              <span className="text-2xl font-bold text-accent">{avgFps}</span>
            </div>
          </div>
        </GlassCard>
        <GlassCard>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-500/15"><Activity size={20} className="text-blue-400" /></div>
            <div>
              <p className="text-xs text-white/40">Avg Latency</p>
              <span className="text-2xl font-bold text-blue-400">42ms</span>
            </div>
          </div>
        </GlassCard>
        <GlassCard>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-purple-500/15"><Zap size={20} className="text-purple-400" /></div>
            <div>
              <p className="text-xs text-white/40">AI Model</p>
              <span className="text-sm font-bold text-white">YOLOv8n</span>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Device Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {devices.map(device => (
          <motion.div key={device.id} variants={item}>
            <GlassCard className={`h-full ${device.status === 'offline' ? 'opacity-50' : ''}`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-white">{device.name}</h3>
                  <p className="text-[10px] text-white/30 mt-0.5">{device.model} • {device.location}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={device.status === 'online' ? 'success' : 'danger'} pulse={device.status === 'online'}>
                    {device.status}
                  </Badge>
                </div>
              </div>

              {device.status === 'online' ? (
                <>
                  {/* Performance gauges */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <CircularGauge value={device.cpuUsage} max={100} label="CPU" color={device.cpuUsage > 80 ? 'red' : 'accent'} size={90} />
                    <CircularGauge value={device.memUsage} max={100} label="Memory" color={device.memUsage > 80 ? 'yellow' : 'green'} size={90} />
                    <CircularGauge value={device.power} max={100} label="Power" color="accent" size={90} />
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white/[0.02]">
                      <Gauge size={14} className="text-accent" />
                      <div>
                        <p className="text-[10px] text-white/30">FPS</p>
                        <span className="text-sm font-bold text-white">{device.fps}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white/[0.02]">
                      <Activity size={14} className="text-blue-400" />
                      <div>
                        <p className="text-[10px] text-white/30">Latency</p>
                        <span className="text-sm font-bold text-white">{device.latency}ms</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white/[0.02]">
                      <Thermometer size={14} className="text-amber-400" />
                      <div>
                        <p className="text-[10px] text-white/30">Temp</p>
                        <span className="text-sm font-bold text-white">{device.temp}°C</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white/[0.02]">
                      <Clock size={14} className="text-emerald-400" />
                      <div>
                        <p className="text-[10px] text-white/30">Uptime</p>
                        <span className="text-sm font-bold text-white">{device.uptime}</span>
                      </div>
                    </div>
                  </div>

                  {/* AI Model */}
                  <div className="mt-3 p-2.5 rounded-lg bg-white/[0.02] flex items-center gap-2">
                    <Zap size={12} className="text-accent" />
                    <span className="text-[10px] text-white/40">Model: </span>
                    <span className="text-xs font-medium text-accent">{device.aiModel}</span>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-40 text-white/20 text-sm">
                  Device is offline
                </div>
              )}
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
