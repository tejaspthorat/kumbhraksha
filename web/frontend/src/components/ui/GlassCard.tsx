'use client';

import { ReactNode } from 'react';
import clsx from 'clsx';
import { motion } from 'framer-motion';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  delay?: number;
  onClick?: () => void;
}

export default function GlassCard({ children, className, hover = true, glow = false, delay = 0, onClick }: GlassCardProps) {
  return (
    <motion.div
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={hover ? { scale: 1.02, y: -2 } : undefined}
      className={clsx(
        'rounded-2xl p-6',
        'bg-canvas',
        'border border-hairline',
        'transition-all duration-300',
        hover && 'hover:border-coral/30 hover:shadow-[0_2px_16px_rgba(20,20,19,0.05)]',
        glow && 'animate-pulse-glow',
        className
      )}
    >
      {children}
    </motion.div>
  );
}
