'use client';

import { motion } from 'framer-motion';
import { Brain, Zap, XCircle, AlertTriangle, TrendingUp, DoorOpen, ShieldAlert, Check, RefreshCw } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import Badge from '@/components/ui/BaseBadge';
import { useStore } from '@/lib/store';
import Skeleton from '@/components/ui/Skeleton';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const ActionIcons = {
  stop_entry: XCircle,
  limit_entry: AlertTriangle,
  redirect: TrendingUp,
  open_zone: DoorOpen,
  alert_staff: ShieldAlert,
};

export default function DecisionsPage() {
  const { aiSuggestions: suggestions, decisions, refreshGroqInsights, groqLoading, groqError } = useStore();

  const sortedDecisions = [...(decisions || [])].sort((a, b) => {
    const urgencies: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
    return urgencies[b.urgency] - urgencies[a.urgency];
  });

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Decision Engine</h1>
          <p className="text-sm text-muted mt-1">Automated actions & suggestions based on real-time YOLO detections</p>
        </div>
        <button
          onClick={refreshGroqInsights}
          disabled={groqLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent/20 hover:bg-accent/30 text-coral transition-colors disabled:opacity-50"
        >
          <RefreshCw size={16} className={groqLoading ? "animate-spin" : ""} />
          Refresh Insights
        </button>
      </div>

      {/* Decisions Panel */}
      <h2 className="text-sm font-semibold text-ink mb-3 flex items-center gap-2">
        <Zap size={16} className="text-coral" />
        AI Automated Decisions
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {groqLoading && decisions.length === 0 ? (
          [1, 2].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)
        ) : groqError ? (
          <div className="md:col-span-2 p-4 rounded-xl bg-accent-red/10 border border-accent-red/20 text-accent-red text-sm flex items-start gap-3">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <p>AI Engine Error: {groqError}</p>
          </div>
        ) : sortedDecisions.length > 0 ? (
          sortedDecisions.map((decision) => {
            const Icon = ActionIcons[decision.actionType as keyof typeof ActionIcons] || Check;
            return (
              <motion.div key={decision.id} variants={item}>
                <GlassCard hover={false} className="border border-accent/20">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl shrink-0 bg-accent/15">
                      <Icon size={24} className="text-coral" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-ink">{decision.decision}</span>
                        <Badge variant={decision.urgency === 'critical' || decision.urgency === 'high' ? 'danger' : 'warning'}>
                          {decision.urgency}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted mb-2">
                        Type: <span className="text-ink font-mono">{decision.actionType}</span>
                      </p>
                      <div className="flex gap-2">
                        {decision.affectedZones.map(z => (
                          <span key={z} className="px-2 py-1 bg-surface-soft rounded-lg text-xs text-body">{z}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            );
          })
        ) : (
          <p className="text-xs text-muted-soft">No critical decisions triggered.</p>
        )}
      </div>

      {/* Suggestions Panel */}
      <h2 className="text-sm font-semibold text-ink mt-8 mb-3 flex items-center gap-2">
        <Brain size={16} className="text-primary-light" />
        AI Manager Suggestions
      </h2>
      <div className="space-y-3">
        {groqLoading && suggestions.length === 0 ? (
          [1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)
        ) : groqError ? (
          <div className="p-4 rounded-xl bg-accent-red/10 border border-accent-red/20 text-accent-red text-sm flex items-start gap-3">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <p>Failed to load suggestions: {groqError}</p>
          </div>
        ) : suggestions.length > 0 ? (
          suggestions.map((suggestion) => (
            <motion.div key={suggestion.id} variants={item}>
              <GlassCard hover={false}>
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Badge variant={suggestion.priority === 'critical' ? 'danger' : suggestion.priority === 'high' ? 'warning' : 'info'}>
                        {suggestion.priority}
                      </Badge>
                      <span className="text-sm font-semibold text-ink">{suggestion.action}</span>
                    </div>
                    <div className="text-xs text-muted mt-2 italic">"{suggestion.reason}"</div>
                    <div className="flex items-center gap-2 mt-2">
                      {suggestion.affectedZones.map(z => (
                        <span key={z} className="text-[10px] text-muted-soft bg-primary-dark rounded-md px-2 py-0.5 border border-hairline">
                          {z}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))
        ) : (
          <p className="text-xs text-muted-soft">No current suggestions.</p>
        )}
      </div>
    </motion.div>
  );
}
