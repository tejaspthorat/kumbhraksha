'use client';

import {
  Bell,
  Search,
  Cpu,
  CloudSun,
  Siren,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/Badge';
import { StatusDot } from '@/components/ui/Tactical';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { useUiStore } from '@/lib/uiStore';

const notifications = [
  { id: 1, text: 'New missing-person case opened near Ramkund, Panchavati', type: 'danger' as const, time: '2 min ago' },
  { id: 2, text: 'Sighting matched to Case #1247 (84% confidence)', type: 'info' as const, time: '5 min ago' },
  { id: 3, text: 'Zone B density crossed warning threshold', type: 'warning' as const, time: '8 min ago' },
  { id: 4, text: 'Field team reassigned to Gate 2 blind spot', type: 'success' as const, time: '12 min ago' },
];

function LiveClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  if (!now) return <span className="tnum text-[13px] text-body w-[64px]">--:--:--</span>;
  return (
    <span className="tnum text-[13px] text-body tabular-nums">
      {now.toLocaleTimeString('en-IN', { hour12: false })}
    </span>
  );
}

export default function TopBar() {
  const [showNotifs, setShowNotifs] = useState(false);
  const emergency = useUiStore((s) => s.emergencyMode);
  const toggleEmergency = useUiStore((s) => s.toggleEmergency);

  return (
    <header className="sticky top-0 z-30 h-16 flex items-center justify-between gap-3 px-4 lg:px-6 hairline-b bg-canvas/80 backdrop-blur-xl">
      {/* Left: current event + search */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Link
          href="/dashboard"
          className="hidden md:flex items-center gap-2 pl-9 lg:pl-0 shrink-0"
        >
          <span className="grid place-items-center size-7 rounded-md bg-coral/12 text-coral">
            <Sparkles size={14} />
          </span>
          <div className="leading-tight">
            <p className="text-[11px] text-muted-soft caption-upper">Active Event</p>
            <p className="text-[12px] font-medium text-ink">Nashik Kumbh 2027</p>
          </div>
        </Link>

        <div className="flex items-center gap-2 px-3 h-10 rounded-lg border border-hairline bg-surface-soft w-full max-w-md ml-9 md:ml-3">
          <Search size={16} className="text-muted-soft shrink-0" />
          <input
            type="text"
            placeholder="Search cases, sightings, zones, cameras…"
            className="bg-transparent text-[13px] text-ink placeholder:text-muted-soft outline-none w-full"
          />
          <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 h-5 rounded border border-hairline text-[10px] text-muted-soft font-mono">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right cluster */}
      <div className="flex items-center gap-2">
        {/* Weather */}
        <div className="hidden xl:flex items-center gap-1.5 px-2.5 h-9 rounded-lg border border-hairline bg-surface-soft text-[12px] text-body">
          <CloudSun size={15} className="text-accent-yellow" />
          <span className="tnum">31°C</span>
          <span className="text-muted-soft">Clear</span>
        </div>

        {/* Time */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 h-9 rounded-lg border border-hairline bg-surface-soft">
          <LiveClock />
        </div>

        {/* AI status */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 h-9 rounded-lg border border-hairline bg-surface-soft">
          <Cpu size={14} className="text-accent-green" />
          <span className="text-[12px] font-medium text-body">AI</span>
          <StatusDot tone="green" />
        </div>

        {/* Emergency mode */}
        <motion.button
          whileTap={{ scale: 0.94 }}
          onClick={toggleEmergency}
          aria-pressed={emergency}
          className={
            'grid place-items-center size-9 rounded-lg border transition-colors ' +
            (emergency
              ? 'border-accent-red/50 bg-accent-red/15 text-accent-red animate-[pulse-soft_1.4s_ease-in-out_infinite]'
              : 'border-hairline bg-surface-soft text-muted hover:text-accent-red hover:border-accent-red/40')
          }
          title="Toggle emergency mode"
        >
          <Siren size={16} />
        </motion.button>

        <ThemeToggle />

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifs((v) => !v)}
            className="relative grid place-items-center size-9 rounded-lg border border-hairline bg-surface-soft text-muted hover:text-ink transition-colors"
            aria-label="Notifications"
          >
            <Bell size={16} />
            <span className="absolute top-1.5 right-1.5 size-2 bg-accent-red rounded-full ring-2 ring-canvas" />
          </button>

          <AnimatePresence>
            {showNotifs && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowNotifs(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.97 }}
                  transition={{ duration: 0.16 }}
                  className="absolute right-0 top-12 z-50 w-80 rounded-xl border border-hairline bg-surface-card/95 backdrop-blur-xl shadow-2xl p-2"
                >
                  <div className="flex items-center justify-between px-2 py-1.5">
                    <h3 className="caption-upper text-[10px] text-muted">Notifications</h3>
                    <Link href="/dashboard/notifications" className="text-[11px] link-coral" onClick={() => setShowNotifs(false)}>
                      View all
                    </Link>
                  </div>
                  {notifications.map((n) => (
                    <div key={n.id} className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-surface-soft transition-colors">
                      <Badge variant={n.type} className="mt-0.5 shrink-0">{n.type}</Badge>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] text-body leading-snug">{n.text}</p>
                        <p className="text-[10px] text-muted-soft mt-0.5">{n.time}</p>
                      </div>
                    </div>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* User */}
        <Link href="/dashboard/profile" className="flex items-center gap-2 pl-1 group">
          <div className="size-9 rounded-full bg-coral text-on-primary grid place-items-center text-[13px] font-semibold ring-1 ring-hairline">
            CR
          </div>
          <div className="hidden xl:block leading-tight">
            <p className="text-[12px] font-medium text-ink">Control Room</p>
            <p className="text-[10px] text-muted-soft">Authority access</p>
          </div>
          <ChevronDown size={14} className="hidden xl:block text-muted-soft group-hover:text-muted" />
        </Link>
      </div>
    </header>
  );
}
