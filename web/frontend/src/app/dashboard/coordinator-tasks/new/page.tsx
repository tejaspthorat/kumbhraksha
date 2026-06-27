"use client";

import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import CreateTaskForm from "@/components/tasks/CreateTaskForm";
import { useRouter } from "next/navigation";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function CreateCoordinatorTaskPage() {
  const router = useRouter();

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="mx-auto max-w-2xl space-y-6 px-4 py-6"
    >
      <motion.div variants={item} className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-bold text-ink">Create Task</h1>
        <Link
          href="/dashboard/coordinator-tasks"
          className="flex items-center gap-1.5 text-sm text-coral hover:text-coral/80 transition-colors"
        >
          <ArrowLeft size={14} />
          Back to board
        </Link>
      </motion.div>

      <motion.div variants={item}>
        <CreateTaskForm
          onCreated={() => router.push("/dashboard/coordinator-tasks")}
        />
      </motion.div>
    </motion.div>
  );
}
