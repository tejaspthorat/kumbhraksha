'use client';

import { motion } from 'framer-motion';
import { Activity, Gauge, Settings, Zap, Info, TrendingUp, TrendingDown } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import Badge from '@/components/ui/BaseBadge';
import AnimatedCounter from '@/components/ui/AnimatedCounter';
import CircularGauge from '@/components/ui/CircularGauge';
import { useStore } from '@/lib/store';



const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function DensityPage() {
  const { densityData, thresholds } = useStore();
  const avgDensity = densityData.length 
    ? (densityData.reduce((s: number, z: any) => s + (z.density || 0), 0) / densityData.length).toFixed(2)
    : "0.00";
  const totalPeople = densityData.reduce((s: number, z: any) => s + z.currentCount, 0);
  const lowDensityCount = densityData.filter((z: any) => z.fillPercent < (z.threshold || 50)).length;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Smart Density Engine</h1>
        <p className="text-sm text-muted mt-1">Scientific crowd density analysis with adaptive thresholds</p>
      </div>

      {/* Formula banner */}
      <motion.div variants={item}>
        <GlassCard hover={false} className="relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="p-4 rounded-2xl bg-accent/10">
              <Gauge size={32} className="text-coral" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-lg font-semibold text-ink mb-2">Density Formula</h3>
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-surface-card border border-hairline font-mono">
                <span className="text-coral font-bold text-lg">ρ</span>
                <span className="text-muted-soft">=</span>
                <span className="text-ink">People Count</span>
                <span className="text-muted-soft">/</span>
                <span className="text-ink">Area (m²)</span>
              </div>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-soft uppercase tracking-wider mb-1">Current Average</p>
              <span className="text-3xl font-bold text-coral">{avgDensity}</span>
              <span className="text-sm text-muted-soft ml-1">p/m²</span>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Stats */}
      <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary-light/15">
              <Activity size={20} className="text-coral" />
            </div>
            <div>
              <p className="text-xs text-muted uppercase tracking-wider">Total Detected</p>
              <AnimatedCounter value={totalPeople} className="text-2xl font-bold text-ink" />
            </div>
          </div>
        </GlassCard>
        <GlassCard>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-red-500/15">
              <TrendingUp size={20} className="text-red-600" />
            </div>
            <div>
              <p className="text-xs text-muted uppercase tracking-wider">Peak Density</p>
              <span className="text-2xl font-bold text-red-600">
                {densityData.length ? Math.max(...densityData.map((z: any) => z.fillPercent)).toFixed(1) : 0}
              </span>
              <span className="text-sm text-muted-soft ml-1">% filled</span>
            </div>
          </div>
        </GlassCard>
        <GlassCard>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-emerald-500/15">
              <TrendingDown size={20} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-muted uppercase tracking-wider">Low Density Zones</p>
              <span className="text-2xl font-bold text-emerald-600">{lowDensityCount}</span>
              <span className="text-sm text-muted-soft ml-1">zones</span>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Classification + Zones */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Classification */}
        <motion.div variants={item}>
          <GlassCard hover={false} className="h-full">
            <h3 className="text-sm font-semibold text-ink mb-4 flex items-center gap-2">
              <Info size={14} className="text-coral" />
              Classification Levels
            </h3>
            <div className="space-y-3">
              {thresholds.map(t => (
                <div key={t.level} className={`flex items-center justify-between p-4 rounded-xl ${t.bg} border border-hairline`}>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ background: t.color }} />
                    <span className="text-sm font-medium text-ink">{t.level}</span>
                  </div>
                  <span className="text-xs text-muted">{t.range}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 rounded-xl bg-surface-soft border border-hairline">
              <div className="flex items-center gap-2 mb-2">
                <Settings size={14} className="text-muted" />
                <span className="text-xs font-medium text-muted">Adaptive Mode</span>
              </div>
              <p className="text-[11px] text-muted-soft">Thresholds auto-adjust based on venue type and historical patterns.</p>
            </div>
          </GlassCard>
        </motion.div>

        {/* Zone metrics */}
        <motion.div variants={item} className="xl:col-span-2">
          <GlassCard hover={false} className="h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-ink">Zone-by-Zone Density</h3>
              <Badge variant="default">
                <Zap size={10} /> Live
              </Badge>
            </div>
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center gap-4 px-3 text-[10px] text-muted-soft uppercase tracking-wider font-semibold">
                <div className="w-40">Zone & Floor</div>
                <div className="w-24">Type</div>
                <div className="flex-1">Saturation</div>
                <div className="w-20 text-center">Threshold</div>
                <div className="w-24 text-right">Occupancy</div>
                <div className="w-20 text-right">Status</div>
              </div>

              {densityData.map((z: any) => (
                <div key={z.zoneId} className="flex items-center gap-4 p-3 rounded-xl bg-surface-soft hover:bg-surface-card transition-colors group">
                  <div className="w-40 shrink-0">
                    <div className="text-sm font-medium text-ink group-hover:text-coral transition-colors">{z.zoneName}</div>
                    <div className="text-[10px] text-muted-soft truncate">{z.floorName || 'Default Floor'}</div>
                  </div>
                  
                  <div className="w-24 shrink-0">
                    <div className="text-[10px] px-2 py-0.5 rounded-md bg-surface-soft text-muted w-fit">
                      {z.type || 'General'}
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="h-1.5 rounded-full bg-surface-card overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${z.fillPercent}%` }}
                        transition={{ duration: 1, delay: 0.3 }}
                        className="h-full rounded-full"
                        style={{
                          background: z.fillPercent > (z.threshold || 90) ? '#ef4444' : z.fillPercent > (z.threshold ? z.threshold * 0.8 : 75) ? '#f59e0b' : '#10b981'
                        }}
                      />
                    </div>
                  </div>

                  <div className="w-20 text-center">
                    <span className="text-xs font-mono text-muted">{z.threshold || 85}%</span>
                  </div>

                  <div className="w-24 text-right">
                    <div className="text-sm font-bold text-ink">{z.currentCount} / {z.maxCapacity}</div>
                    <div className="text-[9px] text-muted-soft">{(z.density || 0).toFixed(2)} p/m²</div>
                  </div>

                  <div className="w-20 flex justify-end">
                    <Badge variant={z.status === 'critical' ? 'danger' : z.status === 'warning' ? 'warning' : 'success'}>
                      {z.fillPercent.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </motion.div>
  );
}
