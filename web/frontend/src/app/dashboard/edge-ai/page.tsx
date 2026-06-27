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
        <h1 className="text-2xl font-bold text-ink">Edge AI Nodes</h1>
        <p className="text-sm text-muted mt-1">Monitor edge devices running YOLOv8 inference on low-power hardware</p>
      </div>

      {/* Stats */}
      <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-accent-green/15"><Cpu size={20} className="text-accent-green" /></div>
            <div>
              <p className="text-xs text-muted">Nodes Online</p>
              <span className="text-2xl font-bold text-ink">{online}/{devices.length}</span>
            </div>
          </div>
        </GlassCard>
        <GlassCard>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-accent/15"><Gauge size={20} className="text-coral" /></div>
            <div>
              <p className="text-xs text-muted">Avg FPS</p>
              <span className="text-2xl font-bold text-coral">{avgFps}</span>
            </div>
          </div>
        </GlassCard>
        <GlassCard>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-accent-blue/15"><Activity size={20} className="text-accent-blue" /></div>
            <div>
              <p className="text-xs text-muted">Avg Latency</p>
              <span className="text-2xl font-bold text-accent-blue">42ms</span>
            </div>
          </div>
        </GlassCard>
        <GlassCard>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-accent-orange/15"><Zap size={20} className="text-accent-orange" /></div>
            <div>
              <p className="text-xs text-muted">AI Model</p>
              <span className="text-sm font-bold text-ink">YOLOv8n</span>
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
                  <h3 className="text-sm font-semibold text-ink">{device.name}</h3>
                  <p className="text-[10px] text-muted-soft mt-0.5">{device.model} • {device.location}</p>
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
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-surface-soft">
                      <Gauge size={14} className="text-coral" />
                      <div>
                        <p className="text-[10px] text-muted-soft">FPS</p>
                        <span className="text-sm font-bold text-ink">{device.fps}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-surface-soft">
                      <Activity size={14} className="text-accent-blue" />
                      <div>
                        <p className="text-[10px] text-muted-soft">Latency</p>
                        <span className="text-sm font-bold text-ink">{device.latency}ms</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-surface-soft">
                      <Thermometer size={14} className="text-accent-orange" />
                      <div>
                        <p className="text-[10px] text-muted-soft">Temp</p>
                        <span className="text-sm font-bold text-ink">{device.temp}°C</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-surface-soft">
                      <Clock size={14} className="text-accent-green" />
                      <div>
                        <p className="text-[10px] text-muted-soft">Uptime</p>
                        <span className="text-sm font-bold text-ink">{device.uptime}</span>
                      </div>
                    </div>
                  </div>

                  {/* AI Model */}
                  <div className="mt-3 p-2.5 rounded-lg bg-surface-soft flex items-center gap-2">
                    <Zap size={12} className="text-coral" />
                    <span className="text-[10px] text-muted">Model: </span>
                    <span className="text-xs font-medium text-coral">{device.aiModel}</span>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-40 text-muted-soft text-sm">
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
