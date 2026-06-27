'use client';

import { motion } from 'framer-motion';
import { MapPin, Users, ArrowUpRight, ArrowDownRight, Shield, AlertTriangle, Eye } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import Badge from '@/components/ui/BaseBadge';
import AnimatedCounter from '@/components/ui/AnimatedCounter';
import { useStore } from '@/lib/store';
import Skeleton from '@/components/ui/Skeleton';



const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

function ZonesSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <GlassCard key={i} className="h-[84px]">
            <Skeleton className="h-3 w-16 mb-2" />
            <Skeleton className="h-8 w-12" />
          </GlassCard>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <GlassCard key={i} className="h-[285px]">
            <div className="flex justify-between items-start mb-6">
              <div className="flex gap-2">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-12" />
                </div>
              </div>
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-2 w-full mb-8 rounded-full" />
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[1, 2, 3].map(j => <Skeleton key={j} className="h-12 w-full rounded-lg" />)}
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-5 w-24 rounded-lg" />
              <Skeleton className="h-5 w-20 rounded-lg" />
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}

export default function ZonesPage() {
  const { zones, ready } = useStore();
  
  if (!ready) return <ZonesSkeleton />;
  const totalCurrent = zones.reduce((s, z) => s + z.people, 0);
  const criticalZones = zones.filter((z: any) => z.level === 'danger').length;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Zone Intelligence</h1>
        <p className="text-sm text-muted mt-1">Track specific areas with entry/exit counting and smart detection</p>
      </div>

      {/* Summary stats */}
      <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard>
          <p className="text-xs text-muted uppercase tracking-wider">Total Zones</p>
          <AnimatedCounter value={zones.length} className="text-2xl font-bold text-ink mt-1" />
        </GlassCard>
        <GlassCard>
          <p className="text-xs text-muted uppercase tracking-wider">People Inside</p>
          <AnimatedCounter value={totalCurrent} className="text-2xl font-bold text-coral mt-1" />
        </GlassCard>
        <GlassCard>
          <p className="text-xs text-muted uppercase tracking-wider">Critical Zones</p>
          <AnimatedCounter value={criticalZones} className="text-2xl font-bold text-red-600 mt-1" />
        </GlassCard>
        <GlassCard>
          <p className="text-xs text-muted uppercase tracking-wider">Queue Detected</p>
          <AnimatedCounter value={zones.filter((z: any) => (z.density || 0) > 3.0).length} className="text-2xl font-bold text-amber-600 mt-1" />
        </GlassCard>
      </motion.div>

      {/* Zone cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {zones.map((zone: any) => {
          const capacity = (zone.area || 50) * 4;
          return (
          <motion.div key={zone.id} variants={item}>
            <GlassCard className="h-full">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-coral" />
                  <div>
                    <h3 className="text-sm font-semibold text-ink">{zone.name}</h3>
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] text-coral/70 font-medium uppercase">{zone.floorName || 'Default Floor'}</span>
                       <span className="text-[10px] text-muted-soft">{zone.area || 0} m²</span>
                    </div>
                  </div>
                </div>
                <Badge variant={zone.level || 'success'}>{zone.level || 'success'}</Badge>
              </div>

              {/* Capacity bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-muted-soft">Capacity</span>
                  <span className="text-[10px] text-muted">{zone.people}/{capacity}</span>
                </div>
                <div className="h-1.5 rounded-full bg-surface-soft overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((zone.people / capacity) * 100, 100)}%` }}
                    transition={{ duration: 1 }}
                    className="h-full rounded-full"
                    style={{
                      background: zone.level === 'danger' ? '#ef4444' : zone.level === 'warning' ? '#f59e0b' : '#10b981'
                    }}
                  />
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center p-2 rounded-lg bg-surface-soft">
                  <ArrowUpRight size={12} className="text-emerald-600 mx-auto mb-1" />
                  <span className="text-xs font-bold text-ink">{Math.floor((zone.people || 0) * 0.8)}</span>
                  <p className="text-[9px] text-muted-soft">Entries</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-surface-soft">
                  <ArrowDownRight size={12} className="text-blue-600 mx-auto mb-1" />
                  <span className="text-xs font-bold text-ink">{Math.floor((zone.people || 0) * 0.2)}</span>
                  <p className="text-[9px] text-muted-soft">Exits</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-surface-soft">
                  <Users size={12} className="text-coral mx-auto mb-1" />
                  <span className="text-xs font-bold text-ink">{(zone.density || 0).toFixed(1)}</span>
                  <p className="text-[9px] text-muted-soft">p/m²</p>
                </div>
              </div>

              {/* Smart detection badges */}
              <div className="flex items-center gap-2">
                {zone.queue && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/10 text-amber-600 text-[10px] font-medium">
                    <Eye size={10} /> Queue Detected
                  </span>
                )}
                {zone.restricted && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-red-500/10 text-red-600 text-[10px] font-medium">
                    <Shield size={10} /> Restricted
                  </span>
                )}
                {zone.level === 'danger' && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-red-500/10 text-red-600 text-[10px] font-medium">
                    <AlertTriangle size={10} /> Over Capacity
                  </span>
                )}
              </div>
            </GlassCard>
          </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
