'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import {
  LayoutDashboard,
  Camera,
  MapPin,
  FileText,
  Settings,
  Activity,
  Brain,
  Users,
  Flame,
  TrendingUp,
  MessageCircle,
  ListTodo,
  X,
  Menu,
  Search,
  ScanEye,
  Radio,
  Smartphone,
  Command,
  BarChart3,
  Siren,
  FlaskConical,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChatStore } from '@/lib/chatStore';
import { useUiStore } from '@/lib/uiStore';
import { Wordmark, SpikeMark } from '@/components/brand/SpikeMark';
import { StatusDot } from '@/components/ui/Tactical';

type NavItem = { name: string; href: string; icon: typeof LayoutDashboard; badge?: number };
type NavGroup = { label: string; items: NavItem[] };

const groups: NavGroup[] = [
  {
    label: 'Command',
    items: [
      { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Command Center', href: '/dashboard/command-center', icon: Command },
      { name: 'Missing Persons', href: '/dashboard/missing', icon: Search },
      { name: 'Sighting Triage', href: '/dashboard/sightings', icon: ScanEye },
      { name: 'Alert Cascade', href: '/dashboard/alerts', icon: Radio, badge: 3 },
    ],
  },
  {
    label: 'Crowd Intelligence',
    items: [
      { name: 'Live Monitoring', href: '/dashboard/density', icon: Activity },
      { name: 'Heatmap', href: '/dashboard/heatmap', icon: Flame },
      { name: 'Cameras', href: '/dashboard/cameras', icon: Camera },
      { name: 'Zones', href: '/dashboard/zones', icon: MapPin },
      { name: 'Predictions', href: '/dashboard/predictions', icon: TrendingUp },
      { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
      { name: 'Decisions', href: '/dashboard/decisions', icon: Brain },
    ],
  },
  {
    label: 'Operations',
    items: [
      { name: 'Responders', href: '/dashboard/staff', icon: Users },
      { name: 'Coordinator Tasks', href: '/dashboard/coordinator-tasks', icon: ListTodo },
      { name: 'Communications', href: '/dashboard/communications', icon: MessageCircle },
      { name: 'Simulation', href: '/dashboard/simulation', icon: FlaskConical },
      { name: 'Reports', href: '/dashboard/reports', icon: FileText },
      { name: 'Emergency Mode', href: '/dashboard/emergency', icon: Siren },
      { name: 'Settings', href: '/dashboard/settings', icon: Settings },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const toggleChatPanel = useChatStore((s) => s.toggleChatPanel);
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);

  const width = collapsed ? 'w-[72px]' : 'w-[260px]';

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed top-3.5 left-4 z-50 lg:hidden grid place-items-center size-10 rounded-lg border border-hairline bg-surface-card text-ink"
        aria-label="Toggle navigation"
      >
        {open ? <X size={18} /> : <Menu size={18} />}
      </button>

      <aside
        className={clsx(
          'fixed left-0 top-0 h-full z-40 flex flex-col',
          'bg-surface-card/80 backdrop-blur-xl border-r border-hairline',
          'transition-[width,transform] duration-300 ease-out',
          width,
          'lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Wordmark + collapse */}
        <div className={clsx('h-16 flex items-center hairline-b', collapsed ? 'justify-center px-0' : 'px-5 justify-between')}>
          <Link href="/" className="text-ink min-w-0" onClick={() => setOpen(false)}>
            {collapsed ? (
              <SpikeMark className="size-6 text-coral" />
            ) : (
              <Wordmark />
            )}
          </Link>
          {!collapsed && (
            <button
              onClick={toggleSidebar}
              className="hidden lg:grid place-items-center size-7 rounded-md text-muted hover:text-ink hover:bg-surface-soft transition-colors"
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose size={16} />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto scrollbar-thin py-4 px-2.5 space-y-5">
          {groups.map((group) => (
            <div key={group.label}>
              {!collapsed && (
                <p className="px-2.5 mb-2 caption-upper text-[10px] text-muted-soft">{group.label}</p>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = pathname === item.href;
                  const isEmergency = item.href === '/dashboard/emergency';

                  const content = (
                    <>
                      <item.icon
                        size={18}
                        className={clsx(
                          'shrink-0 transition-colors',
                          isActive ? 'text-coral' : isEmergency ? 'text-accent-red/80' : 'text-muted group-hover:text-ink'
                        )}
                      />
                      {!collapsed && <span className="truncate">{item.name}</span>}
                      {!collapsed && item.badge && (
                        <span className="ml-auto tnum text-[10px] font-semibold text-accent-red bg-accent-red/10 px-1.5 py-0.5 rounded">
                          {item.badge}
                        </span>
                      )}
                      {!collapsed && isActive && !item.badge && (
                        <span className="ml-auto size-1.5 rounded-full bg-coral" />
                      )}
                      {isActive && (
                        <motion.span
                          layoutId="nav-active"
                          className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-r bg-coral"
                        />
                      )}
                    </>
                  );

                  const base = clsx(
                    'group relative w-full flex items-center rounded-lg text-[13px] font-medium transition-colors',
                    collapsed ? 'justify-center h-10' : 'gap-3 px-2.5 py-2'
                  );
                  const state = isActive
                    ? 'bg-surface-elevated text-ink'
                    : 'text-body hover:bg-surface-soft hover:text-ink';

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={clsx(base, state)}
                      title={collapsed ? item.name : undefined}
                    >
                      {content}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Staff chat panel trigger (slide-over, not a route) */}
          <div className="px-0">
            <button
              onClick={() => {
                toggleChatPanel();
                setOpen(false);
              }}
              className={clsx(
                'group w-full flex items-center rounded-lg text-[13px] font-medium text-body hover:bg-surface-soft hover:text-ink transition-colors',
                collapsed ? 'justify-center h-10' : 'gap-3 px-2.5 py-2'
              )}
              title={collapsed ? 'Staff Chat' : undefined}
            >
              <MessageCircle size={18} className="shrink-0 text-muted group-hover:text-ink" />
              {!collapsed && <span>Staff Chat</span>}
            </button>
          </div>
        </nav>

        {/* Footer */}
        <div className="p-2.5 space-y-2 hairline-t">
          {collapsed ? (
            <button
              onClick={toggleSidebar}
              className="hidden lg:grid place-items-center w-full h-10 rounded-lg text-muted hover:text-ink hover:bg-surface-soft transition-colors"
              aria-label="Expand sidebar"
            >
              <PanelLeftOpen size={16} />
            </button>
          ) : (
            <>
              <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-surface-soft text-body text-[12px]">
                <Smartphone size={15} className="text-muted shrink-0" />
                <span className="truncate">Citizen app · separate build</span>
              </div>
              <div className="flex items-center gap-2 px-2.5">
                <StatusDot tone="green" />
                <span className="text-[11px] text-muted truncate">Network live · ICCC connected</span>
              </div>
            </>
          )}
        </div>
      </aside>

      {/* Mobile scrim */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
