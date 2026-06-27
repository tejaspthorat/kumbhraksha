'use client';

import { Moon, Sun } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from './ThemeProvider';

/**
 * Compact dark/light switch for the TopBar. Mission-command dark is default;
 * light restores the warm cream "editorial" theme.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <motion.button
      type="button"
      onClick={toggleTheme}
      whileTap={{ scale: 0.92 }}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      className={
        'relative grid place-items-center size-9 rounded-lg border border-hairline ' +
        'bg-surface-soft text-muted hover:text-ink hover:border-hairline-strong transition-colors ' +
        (className ?? '')
      }
    >
      <motion.span
        key={theme}
        initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
        animate={{ rotate: 0, opacity: 1, scale: 1 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="grid place-items-center"
      >
        {isDark ? <Moon size={16} /> : <Sun size={16} />}
      </motion.span>
    </motion.button>
  );
}
