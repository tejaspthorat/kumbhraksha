'use client';

import { motion } from 'framer-motion';
import { TrendingUp, ArrowRight, Clock, AlertTriangle, Zap, Navigation, Target, BarChart3 } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import Badge from '@/components/ui/BaseBadge';
import { useStore } from '@/lib/store';



import Skeleton from '@/components/ui/Skeleton';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function PredictionsPage() {
  const { aiPredictions: predictions, flowData, groqLoading, groqError } = useStore();
  
  const criticalAlerts = predictions.filter((p: any) => p.timeToOvercrowd !== null && p.timeToOvercrowd < 10).length;
  const avgConfidence = Math.round(predictions.length ? predictions.reduce((s, p: any) => s + p.confidence, 0) / predictions.length : 0);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Predictive Engine</h1>
        <p className="text-sm text-white/40 mt-1">AI-powered crowd flow forecasting and congestion prediction</p>
      </div>

      {/* Summary */}
      <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <GlassCard>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-accent/15"><Zap size={20} className="text-accent" /></div>
            <div>
              <p className="text-xs text-white/40">Active Forecasts</p>
              <span className="text-2xl font-bold text-white">{predictions.length}</span>
            </div>
          </div>
        </GlassCard>
        <GlassCard>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-red-500/15"><AlertTriangle size={20} className="text-red-400" /></div>
            <div>
              <p className="text-xs text-white/40">Critical Alerts</p>
              <span className="text-2xl font-bold text-red-400">{criticalAlerts}</span>
            </div>
          </div>
        </GlassCard>
        <GlassCard>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-emerald-500/15"><Target size={20} className="text-emerald-400" /></div>
            <div>
              <p className="text-xs text-white/40">Avg Confidence</p>
              <span className="text-2xl font-bold text-emerald-400">{avgConfidence}%</span>
            </div>
          </div>
        </GlassCard>
        <GlassCard>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-500/15"><BarChart3 size={20} className="text-blue-400" /></div>
            <div>
              <p className="text-xs text-white/40">Models Active</p>
              <span className="text-2xl font-bold text-blue-400">3</span>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Predictions + Flow */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Prediction Cards */}
        <motion.div variants={item}>
          <GlassCard hover={false} className="h-full">
            <h3 className="text-sm font-semibold text-white mb-4">Congestion Forecasts</h3>
            <div className="space-y-3">
              {groqLoading && predictions.length === 0 ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
                </div>
              ) : groqError ? (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-3">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                  <p>AI Engine Error: {groqError}</p>
                </div>
              ) : predictions.length === 0 ? (
                <div className="p-4 text-center text-sm text-white/40">No predictions generated yet. Waiting for enough density data...</div>
              ) : predictions.map(p => (
                <motion.div
                  key={p.zoneId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-accent/15 hover:bg-white/[0.04] transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-white">{p.zoneName}</span>
                        <Badge variant={p.timeToOvercrowd !== null && p.timeToOvercrowd < 10 ? 'danger' : p.timeToOvercrowd !== null && p.timeToOvercrowd < 20 ? 'warning' : 'success'}>
                          {p.timeToOvercrowd !== null && p.timeToOvercrowd < 10 ? 'Critical' : p.timeToOvercrowd !== null ? 'Warning' : 'Safe'}
                        </Badge>
                      </div>
                      <p className="text-xs text-white/50">{p.predictedCount} predicted count</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        {p.timeToOvercrowd !== null && p.timeToOvercrowd < 10 ? (
                           <AlertTriangle size={12} className="text-red-400" />
                        ) : (
                           <Clock size={12} className="text-white/30" />
                        )}
                        <span className={`text-xs font-bold ${p.timeToOvercrowd !== null && p.timeToOvercrowd < 10 ? 'text-red-400' : 'text-accent'}`}>
                          {p.timeToOvercrowd !== null ? `in ${p.timeToOvercrowd}m` : 'Stable'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Confidence bar */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${p.confidence}%` }}
                          transition={{ duration: 1, delay: 0.5 }}
                          className="h-full rounded-full bg-accent"
                        />
                      </div>
                    </div>
                    <span className="text-xs font-bold text-white/60">{p.confidence}%</span>
                  </div>

                  {/* Movement info */}
                  <div className="flex items-center gap-4 mt-3">
                    <span className={`text-[10px] font-medium ${p.trend === 'rising' ? 'text-red-400' : p.trend === 'falling' ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {p.trend === 'rising' ? '↑ Rising' : p.trend === 'falling' ? '↓ Falling' : '→ Stable'}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        {/* Flow Visualization */}
        <motion.div variants={item}>
          <GlassCard hover={false} className="h-full">
            <h3 className="text-sm font-semibold text-white mb-4">Movement Flow</h3>
            <div className="space-y-4">
              {flowData.map((f, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02]">
                  <div className="w-20 text-xs font-medium text-white/60 text-right">{f.from}</div>
                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 h-1 rounded-full bg-white/[0.05] overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(f.flow / 50) * 100}%` }}
                        transition={{ duration: 1, delay: i * 0.15 }}
                        className="h-full rounded-full bg-gradient-to-r from-primary-light to-accent"
                      />
                    </div>
                    <ArrowRight size={14} className="text-accent/50" />
                  </div>
                  <div className="w-20 text-xs font-medium text-white/60">{f.to}</div>
                  <div className="w-12 text-right">
                    <span className="text-xs font-bold text-white">{f.flow}</span>
                    <span className="text-[10px] text-white/30">/min</span>
                  </div>
                  <TrendingUp size={14} className={f.trend === 'up' ? 'text-red-400' : f.trend === 'down' ? 'text-emerald-400' : 'text-amber-400'} />
                </div>
              ))}
            </div>

            {/* Tech info */}
            <div className="mt-6 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <h4 className="text-xs font-semibold text-white/50 mb-2">AI Models Active</h4>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="px-3 py-1 rounded-lg bg-accent/10 text-accent text-[10px] font-medium">Optical Flow</span>
                <span className="px-3 py-1 rounded-lg bg-accent/10 text-accent text-[10px] font-medium">Kalman Filter</span>
                <span className="px-3 py-1 rounded-lg bg-accent/10 text-accent text-[10px] font-medium">DeepSORT</span>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </motion.div>
  );
}
