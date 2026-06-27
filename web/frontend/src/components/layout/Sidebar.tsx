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
} from 'lucide-react';
import { useState } from 'react';
import { useChatStore } from '@/lib/chatStore';
import { Wordmark } from '@/components/brand/SpikeMark';

type NavItem = { name: string; href: string; icon: typeof LayoutDashboard };
type NavGroup = { label: string; items: NavItem[] };

const groups: NavGroup[] = [
  {
    label: 'Missing Persons',
    items: [
      { name: 'Live Operations', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Command Center', href: '/dashboard/missing', icon: Search },
      { name: 'Sighting Triage', href: '/dashboard/sightings', icon: ScanEye },
      { name: 'Alert Cascade', href: '/dashboard/alerts', icon: Radio },
      { name: 'CCTV Intelligence', href: '/dashboard/cameras', icon: Camera },
    ],
  },
  {
    label: 'Crowd Intelligence',
    items: [
      { name: 'Density Engine', href: '/dashboard/density', icon: Activity },
      { name: 'Zones', href: '/dashboard/zones', icon: MapPin },
      { name: 'Predictions', href: '/dashboard/predictions', icon: TrendingUp },
      { name: 'Heatmap', href: '/dashboard/heatmap', icon: Flame },
      { name: 'Decisions', href: '/dashboard/decisions', icon: Brain },
    ],
  },
  {
    label: 'Operations',
    items: [
      { name: 'Field Teams', href: '/dashboard/staff', icon: Users },
      { name: 'Coordinator Tasks', href: '/dashboard/coordinator-tasks', icon: ListTodo },
      { name: 'Staff Chat', href: '#chat', icon: MessageCircle },
      { name: 'Reports', href: '/dashboard/reports', icon: FileText },
      { name: 'Settings', href: '/dashboard/settings', icon: Settings },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const toggleChatPanel = useChatStore((s) => s.toggleChatPanel);

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg border border-hairline bg-canvas text-ink"
        aria-label="Toggle navigation"
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside
        className={clsx(
          'fixed left-0 top-0 h-full z-40 w-[260px] flex flex-col',
          'bg-surface-soft border-r border-hairline',
          'lg:translate-x-0 transition-transform',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Wordmark */}
        <div className="px-5 h-16 flex items-center hairline-b">
          <Link href="/" className="text-ink">
            <Wordmark />
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto scrollbar-thin py-5 px-3 space-y-6">
          {groups.map((group) => (
            <div key={group.label}>
              <p className="px-3 mb-2 caption-upper text-muted-soft">{group.label}</p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = pathname === item.href;
                  const isChat = item.href === '#chat';

                  const inner = (
                    <>
                      <item.icon size={17} className={isActive ? 'text-coral' : 'text-muted'} />
                      <span>{item.name}</span>
                      {isActive && (
                        <span className="ml-auto size-1.5 rounded-full bg-coral" />
                      )}
                    </>
                  );

                  const base =
                    'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors';
                  const state = isActive
                    ? 'bg-surface-cream-strong text-ink'
                    : 'text-body hover:bg-surface-card hover:text-ink';

                  if (isChat) {
                    return (
                      <button
                        key={item.href}
                        onClick={() => {
                          toggleChatPanel();
                          setOpen(false);
                        }}
                        className={clsx(base, state)}
                      >
                        {inner}
                      </button>
                    );
                  }
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={clsx(base, state)}
                    >
                      {inner}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Network status */}
        <div className="p-3 space-y-3 hairline-t">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-md bg-surface-card text-body text-sm">
            <Smartphone size={16} className="text-muted" />
            <span>Citizen app · separate build</span>
          </div>
          <div className="flex items-center gap-2 px-3">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-success opacity-75 animate-[pulse-soft_2s_ease-in-out_infinite]" />
              <span className="relative inline-flex rounded-full size-2 bg-success" />
            </span>
            <span className="text-xs text-muted">Network live · ICCC connected</span>
          </div>
        </div>
      </aside>

      {/* Mobile scrim */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-ink/20 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  );
}
