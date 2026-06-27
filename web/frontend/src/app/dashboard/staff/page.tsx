'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  MapPin, 
  MessageSquare, 
  Bell, 
  Shield, 
  Phone, 
  Clock, 
  CheckCircle, 
  Search, 
  Plus, 
  Trash2, 
  Edit2, 
  ClipboardPlus,
  Layers,
  Filter,
  LayoutDashboard
} from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import Badge from '@/components/ui/BaseBadge';
import { useStore } from '@/lib/store';
import Skeleton from '@/components/ui/Skeleton';
import AddStaffModal from '@/components/ui/AddStaffModal';
import { deleteStaff } from '@/app/actions/staff';
import { useState, useEffect } from 'react';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';
import RefreshButton from '@/components/ui/RefreshButton';
import { assignTask, deleteTask } from '@/app/actions/tasks';
import clsx from 'clsx';
import { useFloorPlanStore, useActiveFloor } from '@/lib/floorPlanStore';
import FloorPlanCanvas from '@/components/floor-plan/FloorPlanCanvas';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

function StaffSkeleton() {
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
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <GlassCard hover={false} className="xl:col-span-2 h-[480px]">
          <Skeleton className="h-5 w-40 mb-4" />
          <Skeleton className="h-[380px] w-full" />
        </GlassCard>
        <GlassCard hover={false} className="h-[480px]">
          <Skeleton className="h-5 w-32 mb-4" />
          <div className="space-y-3">
             {[1, 2, 3, 4, 5].map(i => (
              <GlassCard key={i} className="p-3 bg-white/2">
                <Skeleton className="h-3 w-12 mb-2" />
                <Skeleton className="h-4 w-full mb-1.5" />
                <Skeleton className="h-3 w-16" />
              </GlassCard>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

export default function StaffPage() {
  const { staff, tasks, ready, fetchDashboardData } = useStore();
  const { status } = useRealtimeSync('Staff');
  useRealtimeSync('StaffTask');
  
  // Floor Plan Store integration
  const { 
    floors, 
    activeFloorId, 
    setActiveFloor, 
    loadFromStorage,
    setActiveTool
  } = useFloorPlanStore();
  
  const activeFloor = useActiveFloor();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Initialize floor plan once
  useEffect(() => {
    loadFromStorage();
    setActiveTool('select');
  }, [loadFromStorage, setActiveTool]);

  // Task assignment form state
  const [taskForm, setTaskForm] = useState({
    text: '',
    staffId: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    time: 'Now'
  });
  const [isAssigning, setIsAssigning] = useState(false);
  const [isDeletingTask, setIsDeletingTask] = useState<number | null>(null);

  const filteredStaff = staff.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.role.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  if (!ready) return <StaffSkeleton />;

  const handleAssignTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.text || !taskForm.staffId || isAssigning) return;

    const selectedStaff = staff.find(s => s.id === Number(taskForm.staffId));
    if (!selectedStaff) return;

    setIsAssigning(true);
    try {
      await assignTask({
        ...taskForm,
        staffId: Number(taskForm.staffId),
        assignee: selectedStaff.name
      });
      setShowTaskModal(false);
      setTaskForm({ text: '', staffId: '', priority: 'medium', time: 'Now' });
    } catch (err: any) {
      console.error(err);
      alert(err.message);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleTaskDelete = async (id: number) => {
    setIsDeletingTask(id);
    try {
      await deleteTask(id);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsDeletingTask(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to remove this staff member?')) {
      try {
        await deleteStaff(id);
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">Staff Management</h1>
          <p className="text-sm text-muted mt-1">Coordinate, assign, and track field personnel in real-time</p>
        </div>
        <div className="flex items-center gap-4">
          <RefreshButton onRefresh={fetchDashboardData} status={status} />
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-linear-to-r from-coral to-accent-light text-ink font-medium hover:shadow-lg transition-all"
          >
            <Plus size={16} />
            Add Staff
          </button>
        </div>
      </div>

      <AddStaffModal 
        isOpen={showAddModal || !!editingStaff} 
        onClose={() => { setShowAddModal(false); setEditingStaff(null); }} 
        editData={editingStaff}
      />

      {/* Stats */}
      <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard>
          <p className="text-xs text-muted uppercase tracking-wider">Total Staff</p>
          <span className="text-2xl font-bold text-ink">{staff.length}</span>
        </GlassCard>
        <GlassCard>
          <p className="text-xs text-muted uppercase tracking-wider">On Duty</p>
          <span className="text-2xl font-bold text-emerald-600">{staff.filter(s => s.status === 'active').length}</span>
        </GlassCard>
        <GlassCard>
          <p className="text-xs text-muted uppercase tracking-wider">On Break</p>
          <span className="text-2xl font-bold text-amber-600">{staff.filter(s => s.status === 'break').length}</span>
        </GlassCard>
        <GlassCard>
          <p className="text-xs text-muted uppercase tracking-wider">Active Tasks</p>
          <span className="text-2xl font-bold text-coral">{tasks.length}</span>
        </GlassCard>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Staff Visualizer */}
        <motion.div variants={item} className="xl:col-span-3">
          <GlassCard hover={false} className="h-[600px] flex flex-col p-0 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-hairline bg-surface-soft">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center text-coral">
                    <Layers size={16} />
                  </div>
                  <h3 className="text-sm font-semibold text-ink">Live Floor View</h3>
                </div>
                <div className="h-4 w-[1px] bg-surface-cream-strong" />
                <div className="flex gap-1 bg-surface-soft p-1 rounded-xl border border-hairline">
                  {floors.map(f => (
                    <button
                      key={f.id}
                      onClick={() => setActiveFloor(f.id)}
                      className={clsx(
                        "px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                        activeFloorId === f.id ? "bg-accent text-ink" : "text-muted hover:text-body hover:bg-surface-soft"
                      )}
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="success" pulse>{activeFloor?.name || 'Loading'}</Badge>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-soft border border-hairline text-[10px] font-medium text-body">
                  <Filter size={12} />
                  Visualization Only
                </div>
              </div>
            </div>
            <div className="flex-1 relative bg-[#0a1520]">
              <FloorPlanCanvas />
              <div className="absolute top-4 left-4 p-3 rounded-xl glass-strong border border-hairline pointer-events-none z-20">
                <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-2">Legend</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    <span className="text-[10px] text-body">Staff on Duty</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="text-[10px] text-body">On Break</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-soft">
                    <div className="w-2 h-2 rounded-full bg-purple-500 opacity-50" />
                    <span className="text-[10px]">Zone Density</span>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Task notifications */}
        <motion.div variants={item} className="xl:col-span-1">
          <GlassCard hover={false} className="h-[600px] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-ink">Task Queue</h3>
              <div className="flex items-center gap-2">
                <Badge variant="default">{tasks.length}</Badge>
                <button
                  onClick={() => setShowTaskModal(true)}
                  className="p-1 px-2 rounded-lg bg-accent/20 text-coral hover:bg-accent/30 transition-colors flex items-center gap-1.5"
                >
                  <ClipboardPlus size={14} />
                  <span className="text-[10px] font-bold uppercase">Assign</span>
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
              {tasks.map(t => (
                <div key={t.id} className="p-3 rounded-xl bg-white/2 border border-hairline">
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant={t.priority as any}>{t.priority}</Badge>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-soft">{t.time}</span>
                      <button 
                        onClick={() => handleTaskDelete(t.id)}
                        disabled={isDeletingTask === t.id}
                        className="p-1 rounded hover:bg-red-500/10 transition-colors group/task"
                      >
                        <Trash2 size={10} className={clsx("text-white/10 group-hover/task:text-red-600", isDeletingTask === t.id && "animate-pulse")} />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-body mb-1.5">{t.text}</p>
                  <span className="text-[10px] text-coral font-medium">{t.assignee}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* Staff table */}
      <motion.div variants={item}>
        <GlassCard hover={false}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-semibold text-ink">Staff Directory</h3>
            <div className="relative">
              <input
                type="text"
                placeholder="Search staff..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-1.5 rounded-lg bg-surface-soft border border-hairline text-xs text-ink placeholder-white/20 focus:outline-none focus:border-accent w-64"
              />
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-soft" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-[10px] text-muted-soft uppercase tracking-wider border-b border-hairline">
                  <th className="pb-3 pr-4">Staff</th>
                  <th className="pb-3 pr-4">Personnel Role</th>
                  <th className="pb-3 pr-4">Assigned Zone</th>
                  <th className="pb-3 pr-4">Current Status</th>
                  <th className="pb-3 pr-4">Active Tasks</th>
                  <th className="pb-3">Activity</th>
                  <th className="pb-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaff.map(s => (
                  <tr key={s.id} className="border-b border-hairline hover:bg-white/2 transition-colors">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-linear-to-br from-primary-light to-coral flex items-center justify-center text-[10px] font-bold text-ink">
                          {s.avatar}
                        </div>
                        <span className="text-sm font-medium text-body-strong">{s.name}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-xs text-muted">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium">{s.role}</span>
                        <span className="text-[10px] text-muted-soft">{s.staffRole}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="inline-flex items-center gap-1 text-xs text-muted">
                        <MapPin size={10} /> {typeof s.zone === 'object' ? s.zone?.name : (s.zone || 'Unassigned')}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <Badge variant={s.status === 'active' ? 'success' : 'warning'} pulse={s.status === 'active'}>
                        {s.status}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4 text-xs font-medium text-body">{s.tasks}</td>
                    <td className="py-3 text-xs text-muted-soft">{s.lastSeen}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => setEditingStaff(s)}
                          className="p-1.5 rounded-lg hover:bg-surface-soft transition-colors group"
                        >
                          <Edit2 size={13} className="text-muted-soft group-hover:text-coral" />
                        </button>
                        <button 
                          onClick={() => handleDelete(s.id)}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors group"
                        >
                          <Trash2 size={13} className="text-muted-soft group-hover:text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </motion.div>

      {/* Task Assignment Modal */}
      <AnimatePresence>
        {showTaskModal && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowTaskModal(false)}
              className="absolute inset-0 bg-[#040a10]/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-md glass-strong rounded-3xl p-8 overflow-hidden z-110"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-coral to-accent-light" />
              <h2 className="text-xl font-bold text-ink mb-6">Assign New Task</h2>
              <form onSubmit={handleAssignTask} className="space-y-5">
                <div>
                  <label className="block text-[10px] font-bold text-muted uppercase tracking-widest mb-2">Description</label>
                  <textarea
                    required
                    value={taskForm.text}
                    onChange={e => setTaskForm({ ...taskForm, text: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-surface-soft border border-hairline text-ink placeholder-muted-soft focus:outline-none focus:border-coral resize-none h-24 text-sm"
                    placeholder="Describe the task..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-muted uppercase tracking-widest mb-2">Assignee</label>
                    <select
                      required
                      value={taskForm.staffId}
                      onChange={e => setTaskForm({ ...taskForm, staffId: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-surface-soft border border-hairline text-ink text-sm focus:outline-none focus:border-coral"
                    >
                      <option value="">Select Staff</option>
                      {staff.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-muted uppercase tracking-widest mb-2">Time Estimate</label>
                    <input
                      type="text"
                      value={taskForm.time}
                      onChange={e => setTaskForm({ ...taskForm, time: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-surface-soft border border-hairline text-ink text-sm focus:outline-none focus:border-coral"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-muted uppercase tracking-widest mb-2">Priority</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['low', 'medium', 'high'] as const).map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setTaskForm({ ...taskForm, priority: p })}
                        className={clsx(
                          "py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border",
                          taskForm.priority === p 
                            ? "bg-accent/20 border-accent text-coral" 
                            : "bg-surface-soft border-hairline text-muted hover:bg-surface-cream-strong"
                        )}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowTaskModal(false)}
                    className="flex-1 px-4 py-3 rounded-xl bg-surface-soft text-body font-bold text-sm hover:bg-surface-cream-strong transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isAssigning}
                    className="flex-1 px-4 py-3 rounded-xl bg-linear-to-r from-coral to-accent-light text-ink font-bold text-sm hover:shadow-lg disabled:opacity-50 disabled:shadow-none transition-all"
                  >
                    {isAssigning ? 'Assigning...' : 'Assign'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
