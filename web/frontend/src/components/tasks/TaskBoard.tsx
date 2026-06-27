'use client';

import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock, MapPin, User, AlertTriangle, CheckCircle,
  Loader, HelpCircle, ChevronDown, ChevronUp,
} from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import Badge from '@/components/ui/BaseBadge';

// ── Types ────────────────────────────────────────────────────────────────

interface TaskUpdate {
  id: string;
  status: string;
  note: string | null;
  timestamp: string;
  staff: { id: number; name: string };
}

interface CoordinatorTask {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  deadline: string | null;
  locationLabel: string | null;
  completedAt: string | null;
  createdAt: string;
  assignedTo: { id: number; name: string; email: string | null; avatar?: string };
  event: { id: string; name: string };
  updates: TaskUpdate[];
}

// ── Constants ────────────────────────────────────────────────────────────

const COLUMNS = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'NEEDS_HELP'] as const;

const COLUMN_CONFIG: Record<string, {
  label: string;
  icon: typeof Clock;
  gradient: string;
  border: string;
  badge: 'warning' | 'info' | 'success' | 'danger';
}> = {
  PENDING: {
    label: 'Pending',
    icon: Clock,
    gradient: 'from-amber-500/10 to-amber-600/5',
    border: 'border-amber-500/20',
    badge: 'warning',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    icon: Loader,
    gradient: 'from-blue-500/10 to-blue-600/5',
    border: 'border-blue-500/20',
    badge: 'info',
  },
  COMPLETED: {
    label: 'Completed',
    icon: CheckCircle,
    gradient: 'from-emerald-500/10 to-emerald-600/5',
    border: 'border-emerald-500/20',
    badge: 'success',
  },
  NEEDS_HELP: {
    label: 'Needs Help',
    icon: HelpCircle,
    gradient: 'from-red-500/10 to-red-600/5',
    border: 'border-red-500/20',
    badge: 'danger',
  },
};

const PRIORITY_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  CRITICAL: { color: 'text-red-400', bg: 'bg-red-500/20', label: '● Critical' },
  HIGH:     { color: 'text-orange-400', bg: 'bg-orange-500/15', label: '● High' },
  MEDIUM:   { color: 'text-amber-400', bg: 'bg-amber-500/15', label: '● Medium' },
  LOW:      { color: 'text-green-400', bg: 'bg-green-500/15', label: '● Low' },
};

// ── Helpers ──────────────────────────────────────────────────────────────

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ── Component ────────────────────────────────────────────────────────────

export default function TaskBoard({ eventId }: { eventId?: string }) {
  const [tasks, setTasks] = useState<CoordinatorTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [flashIds, setFlashIds] = useState<Set<string>>(new Set());

  // Fetch tasks from the Next.js API
  const loadTasks = useCallback(async () => {
    try {
      const url = eventId
        ? `/api/coordinator-tasks?eventId=${eventId}`
        : '/api/coordinator-tasks';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    loadTasks();

    // Real-time update from coordinator mobile actions via socket
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
    if (!socketUrl) return;

    const socket: Socket = io(socketUrl, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
    });

    // Listen for task status updates from coordinator mobile
    socket.on('task:updated', ({ taskId, status, completedAt }: {
      taskId: string;
      status: string;
      completedAt?: string | null;
    }) => {
      setTasks(prev =>
        prev.map(t =>
          t.id === taskId ? { ...t, status, completedAt: completedAt ?? null } : t
        )
      );
      // Flash animation
      setFlashIds(prev => new Set(prev).add(taskId));
      setTimeout(() => {
        setFlashIds(prev => {
          const next = new Set(prev);
          next.delete(taskId);
          return next;
        });
      }, 2000);
    });

    // Listen for newly assigned tasks
    socket.on('task:assigned', (newTask: CoordinatorTask) => {
      setTasks(prev => [newTask, ...prev]);
      setFlashIds(prev => new Set(prev).add(newTask.id));
      setTimeout(() => {
        setFlashIds(prev => {
          const next = new Set(prev);
          next.delete(newTask.id);
          return next;
        });
      }, 2000);
    });

    return () => {
      socket.disconnect();
    };
  }, [loadTasks]);

  // Also poll every 15s as a fallback for socket issues
  useEffect(() => {
    const interval = setInterval(loadTasks, 15000);
    return () => clearInterval(interval);
  }, [loadTasks]);

  const tasksByStatus = (status: string) =>
    tasks.filter(t => t.status === status);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {COLUMNS.map(col => (
          <div key={col} className="space-y-3">
            <div className="h-8 bg-white/5 rounded-lg animate-pulse" />
            <div className="h-32 bg-white/[0.03] rounded-xl animate-pulse" />
            <div className="h-28 bg-white/[0.03] rounded-xl animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {COLUMNS.map(col => {
        const config = COLUMN_CONFIG[col];
        const colTasks = tasksByStatus(col);
        const ColIcon = config.icon;

        return (
          <motion.div
            key={col}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            {/* Column header */}
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r ${config.gradient} border ${config.border}`}>
              <ColIcon size={16} className="text-white/60" />
              <span className="text-sm font-semibold text-white/80">
                {config.label}
              </span>
              <Badge variant={config.badge} className="ml-auto text-[10px] px-2 py-0.5">
                {colTasks.length}
              </Badge>
            </div>

            {/* Task cards */}
            <div className="space-y-2 min-h-[80px]">
              <AnimatePresence>
                {colTasks.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-8 text-xs text-white/20"
                  >
                    No tasks
                  </motion.div>
                ) : (
                  colTasks.map(task => {
                    const priorityCfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.MEDIUM;
                    const isExpanded = expandedId === task.id;
                    const isFlashing = flashIds.has(task.id);

                    return (
                      <motion.div
                        key={task.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                      >
                        <GlassCard
                          hover
                          className={`!p-3 cursor-pointer ${isFlashing ? 'ring-2 ring-accent/50 animate-pulse' : ''}`}
                          onClick={() => setExpandedId(isExpanded ? null : task.id)}
                        >
                          {/* Priority badge */}
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${priorityCfg.bg} ${priorityCfg.color}`}>
                              {priorityCfg.label}
                            </span>
                            {task.priority === 'CRITICAL' && (
                              <AlertTriangle size={12} className="text-red-400 animate-pulse" />
                            )}
                          </div>

                          {/* Title */}
                          <h4 className="text-sm font-semibold text-white mb-1 line-clamp-2">
                            {task.title}
                          </h4>

                          {/* Assignee */}
                          <div className="flex items-center gap-1.5 text-[11px] text-white/40 mb-1">
                            <User size={11} />
                            <span>{task.assignedTo?.name || 'Unassigned'}</span>
                          </div>

                          {/* Deadline */}
                          {task.deadline && (
                            <div className="flex items-center gap-1.5 text-[11px] text-orange-400/80">
                              <Clock size={11} />
                              <span>
                                {new Date(task.deadline).toLocaleDateString()} ·{' '}
                                {timeAgo(task.deadline)}
                              </span>
                            </div>
                          )}

                          {/* Location */}
                          {task.locationLabel && (
                            <div className="flex items-center gap-1.5 text-[11px] text-blue-400/70 mt-1">
                              <MapPin size={11} />
                              <span>{task.locationLabel}</span>
                            </div>
                          )}

                          {/* Expand toggle */}
                          <div className="flex justify-end mt-1">
                            {isExpanded ? (
                              <ChevronUp size={14} className="text-white/30" />
                            ) : (
                              <ChevronDown size={14} className="text-white/30" />
                            )}
                          </div>

                          {/* Expanded: description + timeline */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                                  {task.description && (
                                    <p className="text-xs text-white/50 leading-relaxed">
                                      {task.description}
                                    </p>
                                  )}
                                  <div className="text-[10px] text-white/30">
                                    Event: {task.event?.name || '—'}
                                  </div>
                                  <div className="text-[10px] text-white/30">
                                    Created {timeAgo(task.createdAt)}
                                  </div>

                                  {/* Status update timeline */}
                                  {task.updates && task.updates.length > 0 && (
                                    <div className="mt-2 space-y-1.5">
                                      <span className="text-[10px] font-medium text-white/40">
                                        Recent updates
                                      </span>
                                      {task.updates.slice(0, 3).map(u => (
                                        <div
                                          key={u.id}
                                          className="flex items-start gap-2 text-[10px]"
                                        >
                                          <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1 flex-shrink-0" />
                                          <div className="text-white/40">
                                            <span className="text-white/60 font-medium">
                                              {u.staff?.name}
                                            </span>
                                            {' → '}
                                            {u.status.replace('_', ' ')}
                                            {u.note && (
                                              <span className="text-white/30">
                                                {' '}— {u.note}
                                              </span>
                                            )}
                                            <div className="text-white/20 mt-0.5">
                                              {timeAgo(u.timestamp)}
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </GlassCard>
                      </motion.div>
                    );
                  })
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
