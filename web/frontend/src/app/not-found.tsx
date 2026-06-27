'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-light/10 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-[120px] -z-10" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full text-center"
      >
        <div className="relative inline-block mb-8">
          <motion.h1
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="display-xl leading-none text-ink opacity-15"
          >
            404
          </motion.h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-px w-full bg-linear-to-r from-transparent via-coral/50 to-transparent" />
          </div>
        </div>

        <h2 className="display-sm text-ink mb-4">Lost in the Crowd?</h2>
        <p className="text-muted mb-10 text-lg">
          The page you are looking for has either been moved or doesn&apos;t exist in our current monitoring grid.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 bg-coral text-on-primary px-8 py-3.5 rounded-full font-semibold shadow-lg shadow-coral/20 hover:bg-coral-active transition-all hover:scale-105 active:scale-95"
          >
            <Home size={18} />
            Home
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 bg-surface-soft hover:bg-surface-card text-ink px-8 py-3.5 rounded-full font-semibold border border-hairline transition-all hover:scale-105 active:scale-95"
          >
            <ArrowLeft size={18} />
            Dashboard
          </Link>
        </div>
      </motion.div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center mask-[radial-gradient(ellipse_at_center,transparent_20%,black)] pointer-events-none opacity-20 -z-20" />
    </div>
  );
}
