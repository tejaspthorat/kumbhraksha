'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import {
  LayoutDashboard,
  Camera,
  MapPin,
  Bell,
  FileText,
  Settings,
  Activity,
  Brain,
  Shield,
  Users,
  Flame,
  Cpu,
  PenTool,
  TrendingUp,
  MessageCircle,
  ListTodo,
  X,
  Menu,
  LogOut,
} from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { logout } from '@/lib/logout';
import { useChatStore } from '@/lib/chatStore';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Live Cameras', href: '/dashboard/cameras', icon: Camera },
  { name: 'Density Engine', href: '/dashboard/density', icon: Activity },
  { name: 'Zones', href: '/dashboard/zones', icon: MapPin },
  { name: 'Predictions', href: '/dashboard/predictions', icon: TrendingUp },
  { name: 'Alerts', href: '/dashboard/alerts', icon: Bell },
  { name: 'Decisions', href: '/dashboard/decisions', icon: Brain },
  { name: 'Staff', href: '/dashboard/staff', icon: Users },
  { name: 'Coordinator tasks', href: '/dashboard/coordinator-tasks', icon: ListTodo },
  { name: 'Staff Chat', href: '#chat', icon: MessageCircle },
  { name: 'Heatmap', href: '/dashboard/heatmap', icon: Flame },
  // { name: 'Edge AI', href: '/dashboard/edge-ai', icon: Cpu },
  { name: 'Reports', href: '/dashboard/reports', icon: FileText },
  { name: 'Room Designer', href: '/dashboard/room-designer', icon: PenTool },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const toggleChatPanel = useChatStore((s) => s.toggleChatPanel);

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-xl glass"
      >
        {collapsed ? <X size={20} /> : <Menu size={20} />}
      </button>

      <AnimatePresence>
        <motion.aside
          initial={{ x: -280 }}
          animate={{ x: 0 }}
          className={clsx(
            'fixed left-0 top-0 h-full z-40',
            'w-[260px] flex flex-col',
            'bg-[#040a10]/90 backdrop-blur-2xl',
            'border-r border-white/6',
            'lg:translate-x-0',
            !collapsed && 'max-lg:hidden'
          )}
        >
          {/* Logo */}
          <div className="px-6 py-6 flex items-center gap-3 border-b border-white/6">
            <div className="w-9 h-9 rounded-xl bg-linear-to-br from-primary-light to-accent flex items-center justify-center">
              <Shield size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight">CrowdAI</h1>
              <p className="text-[10px] text-white/40 font-medium uppercase tracking-widest">Command Center</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const isChatLink = item.href === '#chat';

              if (isChatLink) {
                return (
                  <button
                    key={item.href}
                    onClick={() => { toggleChatPanel(); setCollapsed(false); }}
                    className={clsx(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                      'text-white/50 hover:text-white/80 hover:bg-white/4'
                    )}
                  >
                    <item.icon size={18} />
                    <span>{item.name}</span>
                  </button>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setCollapsed(false)}
                  className={clsx(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-primary-light/15 text-accent border border-accent/15'
                      : 'text-white/50 hover:text-white/80 hover:bg-white/4'
                  )}
                >
                  <item.icon size={18} className={isActive ? 'text-accent' : ''} />
                  <span>{item.name}</span>
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_8px_rgba(122,178,178,0.6)]" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* System status */}
          <div className="p-4 mx-3 mb-4 rounded-xl bg-white/3 border border-white/6">
            <div className="flex items-center gap-2 mb-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              <span className="text-xs text-white/60 font-medium">System Online</span>
            </div>
            <p className="text-[10px] text-white/30">v2.0 • AI Engine Active</p>
          </div>

          {/* Logout button
          <div className="px-3 pb-6">
            <button
              onClick={() => logout()}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400/60 hover:text-red-400 hover:bg-red-400/10 transition-all duration-200"
            >
              <LogOut size={18} />
              <span>Sign Out</span>
            </button>
          </div> */}
        </motion.aside>
      </AnimatePresence>
    </>
  );
}
