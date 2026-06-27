'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, X, Check, AlertTriangle, Calendar, MapPin, User, Loader2 } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';

// ── Types ────────────────────────────────────────────────────────────────

interface Staff {
  id: number;
  name: string;
  email: string | null;
  zoneId: number;
}

interface EventRow {
  id: string;
  name: string;
}

interface CreateTaskFormProps {
  onCreated?: () => void;
  onClose?: () => void;
}

const PRIORITIES = [
  { value: 'LOW', label: 'Low', color: 'text-green-400', bg: 'bg-green-500/15', border: 'border-green-500/30' },
  { value: 'MEDIUM', label: 'Medium', color: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/30' },
  { value: 'HIGH', label: 'High', color: 'text-orange-400', bg: 'bg-orange-500/15', border: 'border-orange-500/30' },
  { value: 'CRITICAL', label: 'Critical', color: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/30' },
];

// ── Component ────────────────────────────────────────────────────────────

export default function CreateTaskForm({ onCreated, onClose }: CreateTaskFormProps) {
  const [coordinators, setCoordinators] = useState<Staff[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    assignedToId: '',
    eventId: '',
    deadline: '',
    locationLabel: '',
  });

  // Load coordinators and events
  useEffect(() => {
    Promise.all([
      fetch('/api/staff').then(r => r.ok ? r.json() : []).catch(() => []),
      fetch('/api/events').then(r => r.ok ? r.json() : []).catch(() => []),
    ]).then(([staffData, eventData]) => {
      setCoordinators(staffData);
      setEvents(eventData);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.title.trim()) {
      setError('Title is required');
      return;
    }
    if (!form.assignedToId) {
      setError('Please select a coordinator');
      return;
    }
    if (!form.eventId) {
      setError('Please select an event');
      return;
    }

    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        priority: form.priority,
        assignedToId: Number(form.assignedToId),
        eventId: form.eventId,
        locationLabel: form.locationLabel.trim() || undefined,
      };
      if (form.deadline) {
        body.deadline = new Date(form.deadline).toISOString();
      }

      const res = await fetch('/api/coordinator-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to create task');
        return;
      }

      setSuccess(true);
      setForm({
        title: '', description: '', priority: 'MEDIUM',
        assignedToId: '', eventId: '', deadline: '', locationLabel: '',
      });

      setTimeout(() => {
        setSuccess(false);
        onCreated?.();
      }, 1500);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <GlassCard hover={false} className="relative">
        {/* Close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg bg-surface-soft hover:bg-surface-elevated transition-colors"
          >
            <X size={16} className="text-muted" />
          </button>
        )}

        <h3 className="text-lg font-semibold text-ink mb-4 flex items-center gap-2">
          <Plus size={18} className="text-accent" />
          Create New Task
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-muted mb-1.5">
              Task Title *
            </label>
            <input
              value={form.title}
              onChange={e => updateField('title', e.target.value)}
              placeholder="e.g. Set up crowd barrier at Gate A"
              required
              maxLength={200}
              className="w-full px-3 py-2.5 rounded-xl bg-surface-soft border border-hairline text-ink text-sm placeholder-muted-soft focus:outline-none focus:border-accent/50 transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-muted mb-1.5">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={e => updateField('description', e.target.value)}
              placeholder="Optional details for the coordinator..."
              rows={3}
              maxLength={2000}
              className="w-full px-3 py-2.5 rounded-xl bg-surface-soft border border-hairline text-ink text-sm placeholder-muted-soft focus:outline-none focus:border-accent/50 transition-colors resize-none"
            />
          </div>

          {/* Priority selector */}
          <div>
            <label className="block text-xs font-medium text-muted mb-1.5">
              Priority
            </label>
            <div className="flex gap-2">
              {PRIORITIES.map(p => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => updateField('priority', p.value)}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    form.priority === p.value
                      ? `${p.bg} ${p.color} ${p.border} scale-[1.02]`
                      : 'bg-surface-soft border-hairline text-muted hover:bg-surface-elevated'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Event */}
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">
                Event *
              </label>
              <select
                value={form.eventId}
                onChange={e => updateField('eventId', e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-xl bg-surface-soft border border-hairline text-ink text-sm focus:outline-none focus:border-accent/50 transition-colors"
              >
                <option value="">Select event…</option>
                {events.map(ev => (
                  <option key={ev.id} value={ev.id}>
                    {ev.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Coordinator */}
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5 flex items-center gap-1">
                <User size={12} /> Assign To *
              </label>
              <select
                value={form.assignedToId}
                onChange={e => updateField('assignedToId', e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-xl bg-surface-soft border border-hairline text-ink text-sm focus:outline-none focus:border-accent/50 transition-colors"
              >
                <option value="">Select coordinator…</option>
                {coordinators.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}{c.email ? ` (${c.email})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Deadline */}
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5 flex items-center gap-1">
                <Calendar size={12} /> Deadline
              </label>
              <input
                type="datetime-local"
                value={form.deadline}
                onChange={e => updateField('deadline', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-surface-soft border border-hairline text-ink text-sm focus:outline-none focus:border-accent/50 transition-colors"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5 flex items-center gap-1">
                <MapPin size={12} /> Location
              </label>
              <input
                value={form.locationLabel}
                onChange={e => updateField('locationLabel', e.target.value)}
                placeholder="e.g. Gate A, Section B"
                className="w-full px-3 py-2.5 rounded-xl bg-surface-soft border border-hairline text-ink text-sm placeholder-muted-soft focus:outline-none focus:border-accent/50 transition-colors"
              />
            </div>
          </div>

          {/* Error message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs"
            >
              <AlertTriangle size={14} />
              {error}
            </motion.div>
          )}

          {/* Success message */}
          {success && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs"
            >
              <Check size={14} />
              Task created and assigned successfully!
            </motion.div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-accent/80 to-accent text-on-primary font-semibold text-sm flex items-center justify-center gap-2 hover:from-accent hover:to-accent/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus size={16} />
                Assign Task
              </>
            )}
          </button>
        </form>
      </GlassCard>
    </motion.div>
  );
}
