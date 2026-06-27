import { RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { RealtimeStatus } from '@/hooks/useRealtimeSync';

interface RefreshButtonProps {
  onRefresh: () => Promise<void>;
  status?: RealtimeStatus;
  className?: string;
}

export default function RefreshButton({ onRefresh, status = 'disconnected', className }: RefreshButtonProps) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setTimeout(() => setRefreshing(false), 600);
    }
  };

  const statusColors = {
    connected: 'bg-emerald-400',
    reconnecting: 'bg-amber-400',
    disconnected: 'bg-red-400',
  };

  return (
    <div className={clsx("flex items-center gap-3", className)}>
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/3 border border-white/6">
        <div className={clsx("w-1.5 h-1.5 rounded-full", statusColors[status])} />
        <span className="text-[10px] text-white/40 font-medium uppercase">
          {status}
        </span>
      </div>
      <button
        onClick={handleRefresh}
        disabled={refreshing}
        className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-all active:scale-95 disabled:opacity-50"
      >
        <motion.div
          animate={refreshing ? { rotate: 360 } : { rotate: 0 }}
          transition={refreshing ? { repeat: Infinity, duration: 1, ease: "linear" } : {}}
        >
          <RefreshCw size={14} />
        </motion.div>
      </button>
    </div>
  );
}
