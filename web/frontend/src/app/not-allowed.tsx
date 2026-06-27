'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShieldAlert, ArrowRight } from 'lucide-react';

/**
 * Kept as a simple informational page. Authentication has been removed, so this
 * is no longer part of any access-control flow — the dashboard is open.
 */
export default function NotAllowed() {
  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="max-w-lg w-full"
      >
        <div className="card-canvas border border-hairline rounded-3xl p-8 md:p-12 text-center">
          <div className="flex justify-center mb-8">
            <div className="size-20 rounded-2xl bg-coral/10 flex items-center justify-center border border-coral/20">
              <ShieldAlert size={40} className="text-coral" />
            </div>
          </div>

          <h1 className="display-sm text-ink mb-4">Page unavailable</h1>
          <p className="text-muted mb-10 max-w-sm mx-auto">
            This page isn&apos;t part of the dashboard. Head back to the command center.
          </p>

          <Link
            href="/dashboard"
            className="btn-coral inline-flex items-center justify-center gap-2 h-11 px-6"
          >
            Open dashboard <ArrowRight size={18} />
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
