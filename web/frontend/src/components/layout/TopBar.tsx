'use client';

import { Bell, Search } from 'lucide-react';
import { useState } from 'react';
import { useAuth, SignInButton, UserButton } from '@clerk/nextjs';
import { Badge } from '@/components/ui/Badge';

const notifications = [
  { id: 1, text: 'New missing-person case opened near Ramkund, Panchavati', type: 'danger' as const, time: '2 min ago' },
  { id: 2, text: 'Sighting matched to Case #1247 (84% confidence)', type: 'info' as const, time: '5 min ago' },
  { id: 3, text: 'Zone B density crossed warning threshold', type: 'warning' as const, time: '8 min ago' },
  { id: 4, text: 'Field team reassigned to Gate 2 blind spot', type: 'success' as const, time: '12 min ago' },
];

export default function TopBar() {
  const { isSignedIn } = useAuth();
  const [showNotifs, setShowNotifs] = useState(false);

  return (
    <header className="relative z-50 h-16 flex items-center justify-between px-6 hairline-b bg-canvas/85 backdrop-blur-md">
      {/* Search */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <div className="flex items-center gap-2 px-3.5 h-10 rounded-lg border border-hairline bg-surface-soft w-full">
          <Search size={16} className="text-muted-soft" />
          <input
            type="text"
            placeholder="Search cases, sightings, zones…"
            className="bg-transparent text-sm text-ink placeholder:text-muted-soft outline-none w-full"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2 px-3 h-9 rounded-lg bg-surface-soft border border-hairline">
          <span className="size-1.5 rounded-full bg-success animate-[pulse-soft_2s_ease-in-out_infinite]" />
          <span className="text-xs text-body font-medium">Live</span>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative p-2 rounded-lg hover:bg-surface-soft transition-colors"
            aria-label="Notifications"
          >
            <Bell size={18} className="text-muted" />
            <span className="absolute top-1.5 right-1.5 size-2 bg-coral rounded-full ring-2 ring-canvas" />
          </button>

          {showNotifs && (
            <div className="absolute right-0 top-12 w-80 rounded-xl border border-hairline bg-canvas shadow-[0_8px_30px_rgba(20,20,19,0.1)] p-3 space-y-1 animate-fade-in">
              <h3 className="px-2 py-1.5 caption-upper text-muted">Notifications</h3>
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-surface-soft transition-colors"
                >
                  <Badge variant={n.type} className="mt-0.5 shrink-0">
                    {n.type}
                  </Badge>
                  <div className="flex-1">
                    <p className="text-[13px] text-body leading-snug">{n.text}</p>
                    <p className="text-[11px] text-muted-soft mt-0.5">{n.time}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center">
          {isSignedIn ? (
            <UserButton />
          ) : (
            <SignInButton mode="modal">
              <button className="btn-coral h-10 px-5">Sign in</button>
            </SignInButton>
          )}
        </div>
      </div>
    </header>
  );
}
