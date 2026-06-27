"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ListTodo,
  Plus,
  LayoutGrid,
  List,
  RefreshCw,
  Bell,
  Filter,
} from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import TaskBoard from "@/components/tasks/TaskBoard";
import CreateTaskForm from "@/components/tasks/CreateTaskForm";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function CoordinatorTasksPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6 px-4 py-6"
    >
      {/* Header */}
      <motion.div
        variants={item}
        className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-ink flex items-center gap-2">
            <ListTodo size={24} className="text-coral" />
            Task Board
          </h1>
          <p className="text-sm text-muted mt-1">
            Real-time coordinator task management — live updates from mobile
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Refresh */}
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            className="p-2.5 rounded-xl bg-surface-card border border-hairline hover:bg-surface-cream-strong transition-colors"
            title="Refresh tasks"
          >
            <RefreshCw size={16} className="text-muted" />
          </button>

          {/* Notifications */}
          <a
            href="/dashboard/coordinator-tasks/notifications"
            className="p-2.5 rounded-xl bg-surface-card border border-hairline hover:bg-surface-cream-strong transition-colors relative"
            title="Notifications"
          >
            <Bell size={16} className="text-muted" />
          </a>

          {/* Create task toggle */}
          <button
            onClick={() => setShowCreate(!showCreate)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              showCreate
                ? "bg-surface-cream-strong text-ink border border-hairline"
                : "bg-gradient-to-r from-coral/80 to-coral text-ink hover:from-coral hover:to-coral/90"
            }`}
          >
            {showCreate ? (
              <>
                <List size={16} /> Hide Form
              </>
            ) : (
              <>
                <Plus size={16} /> Create Task
              </>
            )}
          </button>
        </div>
      </motion.div>

      {/* Create Task Form (slide in/out) */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            key="form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <CreateTaskForm
              onCreated={() => {
                setShowCreate(false);
                setRefreshKey((k) => k + 1);
              }}
              onClose={() => setShowCreate(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Kanban Board */}
      <motion.div variants={item}>
        <TaskBoard key={refreshKey} />
      </motion.div>

      {/* Footer */}
      <motion.div variants={item} className="text-center">
        <p className="text-[10px] text-muted-soft flex items-center justify-center gap-2">
          <RefreshCw size={10} />
          Live updates from coordinator mobile app · Auto-refresh every 15s
        </p>
      </motion.div>
    </motion.div>
  );
}
