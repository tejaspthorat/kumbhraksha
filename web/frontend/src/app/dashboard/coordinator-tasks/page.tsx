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
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ListTodo size={24} className="text-accent" />
            Task Board
          </h1>
          <p className="text-sm text-white/40 mt-1">
            Real-time coordinator task management — live updates from mobile
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Refresh */}
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.07] transition-colors"
            title="Refresh tasks"
          >
            <RefreshCw size={16} className="text-white/40" />
          </button>

          {/* Notifications */}
          <a
            href="/dashboard/coordinator-tasks/notifications"
            className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.07] transition-colors relative"
            title="Notifications"
          >
            <Bell size={16} className="text-white/40" />
          </a>

          {/* Create task toggle */}
          <button
            onClick={() => setShowCreate(!showCreate)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              showCreate
                ? "bg-white/10 text-white border border-white/20"
                : "bg-gradient-to-r from-accent/80 to-accent text-white hover:from-accent hover:to-accent/90"
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
        <p className="text-[10px] text-white/20 flex items-center justify-center gap-2">
          <RefreshCw size={10} />
          Live updates from coordinator mobile app · Auto-refresh every 15s
        </p>
      </motion.div>
    </motion.div>
  );
}
