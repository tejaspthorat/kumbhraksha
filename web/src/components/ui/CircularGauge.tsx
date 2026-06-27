'use client';

import { motion } from 'framer-motion';
import clsx from 'clsx';

interface CircularGaugeProps {
  value: number;
  max: number;
  label: string;
  color?: 'green' | 'yellow' | 'red' | 'accent';
  size?: number;
}

const colorMap = {
  green: { stroke: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  yellow: { stroke: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  red: { stroke: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  accent: { stroke: '#7AB2B2', bg: 'rgba(122,178,178,0.1)' },
};

export default function CircularGauge({ value, max, label, color = 'accent', size = 140 }: CircularGaugeProps) {
  const percentage = Math.min((value / max) * 100, 100);
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  const colors = colorMap[color];

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth={8}
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={colors.stroke}
            strokeWidth={8}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
            style={{ filter: `drop-shadow(0 0 8px ${colors.stroke}40)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={clsx('text-2xl font-bold')} style={{ color: colors.stroke }}>
            {Math.round(percentage)}%
          </span>
        </div>
      </div>
      <span className="text-xs text-white/50 font-medium uppercase tracking-wider">{label}</span>
    </div>
  );
}
