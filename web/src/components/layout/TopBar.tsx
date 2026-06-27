'use client';

import { Bell, Search, ChevronDown, Wifi, WifiOff } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Badge from '@/components/ui/BaseBadge';
import { useAuth, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs';


//Add AI based notifications using GROQ API
const notifications = [
  { id: 1, text: 'Zone A density exceeded threshold', type: 'danger' as const, time: '2 min ago' },
  { id: 2, text: 'Camera 3 reconnected', type: 'success' as const, time: '5 min ago' },
  { id: 3, text: 'Predictive alert: Zone B congestion', type: 'warning' as const, time: '8 min ago' },
  { id: 4, text: 'Staff reassigned to Gate 2', type: 'info' as const, time: '12 min ago' },
];

export default function TopBar() {
  const { isSignedIn } = useAuth();
  const [showNotifs, setShowNotifs] = useState(false);
  const [connected] = useState(true);

  return (
    <header className="relative z-100 h-16 flex items-center justify-between px-6 border-b border-white/6 bg-[#040a10]/60 backdrop-blur-xl">
      {/* Search */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/4 border border-white/6 w-full">
          <Search size={15} className="text-white/30" />
          <input
            type="text"
            placeholder="Search zones, cameras, alerts..."
            className="bg-transparent text-sm text-white/80 placeholder:text-white/25 outline-none w-full"
          />
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-4">
        {/* Connection status */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/3">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-emerald-400 font-medium tracking-tight">Live System</span>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative p-2 rounded-xl hover:bg-white/5 transition-colors"
          >
            <Bell size={18} className="text-white/60" />
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#040a10]" />
          </button>

          <AnimatePresence>
            {showNotifs && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                className="absolute right-0 top-12 w-80 rounded-2xl glass-strong p-4 space-y-3 z-50"
              >
                <h3 className="text-sm font-semibold text-white/80">Notifications</h3>
                {notifications.map((n) => (
                  <div key={n.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/4 transition-colors">
                    <Badge variant={n.type} pulse>{n.type}</Badge>
                    <div className="flex-1">
                      <p className="text-xs text-white/70">{n.text}</p>
                      <p className="text-[10px] text-white/30 mt-0.5">{n.time}</p>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="px-3 py-1.5 leading-none flex items-center">
          {isSignedIn ? (
            <UserButton />
          ) : (
            <div className="flex gap-4">
              <SignInButton mode="modal">
                <button className="text-sm text-white/60 hover:text-white transition-colors">Sign In</button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="bg-linear-to-r from-primary-light to-accent text-white rounded-full font-medium text-sm h-10 px-5 shadow-lg shadow-primary-light/10 hover:shadow-primary-light/20 transition-all">
                  Sign Up
                </button>
              </SignUpButton>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
