'use client';

import { useState } from 'react';
import {
  Mail,
  Phone,
  Building2,
  MapPin,
  Pencil,
  Activity,
  ClipboardList,
  Clock,
  Gauge,
  ShieldCheck,
  LogOut,
  Bell,
  Volume2,
  RefreshCw,
  Palette,
} from 'lucide-react';
import { PageHeader, StatePill } from '@/components/ui/Tactical';
import { Panel, PanelHeader } from '@/components/ui/Panel';
import { KpiTile } from '@/components/ui/KpiTile';
import { series } from '@/lib/demoSeries';

const CONTACT = [
  { icon: Mail, label: 'controlroom@nashik-iccc.gov.in' },
  { icon: Phone, label: '+91 712 555 0142' },
  { icon: Building2, label: 'Nashik ICCC' },
  { icon: MapPin, label: 'Trimbakeshwar Sector · Kumbh Mela' },
];

const RECENT = [
  { action: 'Acknowledged incident #4821 at Gate 2', when: '4m ago' },
  { action: 'Dispatched RES-11 to Zone B', when: '22m ago' },
  { action: 'Broadcast advisory to all citizen channels', when: '1h ago' },
  { action: 'Closed evacuation corridor C', when: '2h ago' },
];

const PERMISSIONS = ['Dispatch units', 'Broadcast alerts', 'Edit zones', 'View analytics', 'Manage staff'];

type Pref = { id: string; label: string; detail: string; icon: React.ComponentType<{ size?: number }>; on: boolean };

const INITIAL_PREFS: Pref[] = [
  { id: 'email', label: 'Email alerts', detail: 'Daily digest and critical escalations', icon: Mail, on: true },
  { id: 'push', label: 'Push notifications', detail: 'Real-time incident pushes to this device', icon: Bell, on: true },
  { id: 'sound', label: 'Sound on critical', detail: 'Audible chime for critical severity', icon: Volume2, on: false },
  { id: 'refresh', label: 'Auto-refresh', detail: 'Live-poll telemetry every 15 seconds', icon: RefreshCw, on: true },
];

export default function ProfilePage() {
  const [prefs, setPrefs] = useState<Pref[]>(INITIAL_PREFS);

  const toggle = (id: string) =>
    setPrefs((prev) => prev.map((p) => (p.id === id ? { ...p, on: !p.on } : p)));

  return (
    <div className="max-w-[1440px] mx-auto space-y-6">
      <PageHeader
        eyebrow="Account"
        title="Profile"
        description="Operator identity, activity and command preferences for this console session."
      >
        <StatePill tone="green" label="Authority Access" icon={ShieldCheck} />
      </PageHeader>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Identity */}
        <Panel className="p-5">
          <div className="flex flex-col items-center text-center">
            <div className="grid place-items-center size-24 rounded-2xl bg-coral text-on-primary font-heading text-3xl font-semibold tracking-tight">
              CR
            </div>
            <h2 className="mt-4 font-heading text-xl font-semibold tracking-tight text-ink">Control Room</h2>
            <p className="mt-0.5 text-[13px] text-muted">Authority Access · Nashik ICCC</p>
          </div>

          <div className="mt-5 space-y-2">
            {CONTACT.map((c) => (
              <div key={c.label} className="flex items-center gap-3 rounded-lg border border-hairline bg-surface-soft px-3 py-2.5">
                <span className="grid place-items-center size-7 rounded-md border border-hairline bg-surface-elevated text-muted shrink-0">
                  <c.icon size={14} />
                </span>
                <span className="text-[12px] text-body truncate">{c.label}</span>
              </div>
            ))}
          </div>

          <button className="mt-4 w-full inline-flex items-center justify-center gap-2 h-10 rounded-lg border border-hairline-strong bg-surface-soft text-[13px] font-medium text-body hover:text-ink transition-colors">
            <Pencil size={14} /> Edit profile
          </button>
        </Panel>

        {/* Right column */}
        <div className="xl:col-span-2 space-y-6">
          {/* Activity */}
          <Panel className="p-5">
            <PanelHeader title="Activity" subtitle="Operator engagement this cycle" icon={Activity} />
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
              <KpiTile label="Sessions" value="38" icon={Activity} accent="blue" delta={6} spark={series(71, 14, 30, 8)} />
              <KpiTile label="Actions today" value="124" icon={ClipboardList} accent="orange" delta={14} spark={series(72, 14, 90, 20)} />
              <KpiTile label="Cases handled" value="57" icon={ShieldCheck} accent="green" delta={9} spark={series(73, 14, 40, 12)} />
              <KpiTile label="Uptime" value="99.8" unit="%" icon={Gauge} accent="green" delta={0.3} spark={series(74, 14, 99, 1)} />
            </div>

            <div className="mt-5 space-y-2">
              {RECENT.map((r) => (
                <div key={r.action} className="flex items-center gap-3 rounded-lg border border-hairline bg-surface-soft px-3 py-2.5">
                  <span className="size-1.5 rounded-full bg-muted shrink-0" />
                  <p className="flex-1 min-w-0 text-[13px] text-body truncate">{r.action}</p>
                  <span className="tnum text-[11px] text-muted-soft shrink-0">{r.when}</span>
                </div>
              ))}
            </div>
          </Panel>

          {/* Preferences */}
          <Panel className="p-5">
            <PanelHeader title="Preferences" subtitle="Notification and refresh behaviour" icon={Bell} />
            <div className="mt-4 space-y-2">
              {prefs.map((p) => (
                <div key={p.id} className="flex items-center gap-3 rounded-lg border border-hairline bg-surface-soft px-3 py-2.5">
                  <span className="grid place-items-center size-7 rounded-md border border-hairline bg-surface-elevated text-muted shrink-0">
                    <p.icon size={14} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-ink">{p.label}</p>
                    <p className="text-[11px] text-muted-soft truncate">{p.detail}</p>
                  </div>
                  <button
                    onClick={() => toggle(p.id)}
                    role="switch"
                    aria-checked={p.on}
                    className={
                      'relative h-6 w-11 rounded-full border transition-colors shrink-0 ' +
                      (p.on ? 'border-accent-green/40 bg-accent-green/25' : 'border-hairline bg-surface-elevated')
                    }
                  >
                    <span
                      className={
                        'absolute top-0.5 size-4 rounded-full transition-all ' +
                        (p.on ? 'left-[22px] bg-accent-green' : 'left-0.5 bg-muted')
                      }
                    />
                  </button>
                </div>
              ))}

              <div className="flex items-center gap-3 rounded-lg border border-hairline bg-surface-soft px-3 py-2.5">
                <span className="grid place-items-center size-7 rounded-md border border-hairline bg-surface-elevated text-muted shrink-0">
                  <Palette size={14} />
                </span>
                <p className="flex-1 text-[12px] text-muted-soft">
                  Theme follows the system toggle in the top bar — light and dark are switched globally there.
                </p>
              </div>
            </div>
          </Panel>

          {/* Access & security */}
          <Panel className="p-5">
            <PanelHeader title="Access & security" subtitle="Role, permissions and session" icon={ShieldCheck} />
            <div className="mt-4 space-y-4">
              <div className="flex items-center gap-3 rounded-lg border border-hairline bg-surface-soft px-3 py-2.5">
                <span className="grid place-items-center size-7 rounded-md border border-hairline bg-surface-elevated text-muted shrink-0">
                  <Clock size={14} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-ink">Last login</p>
                  <p className="text-[11px] text-muted-soft">Today · 08:14 IST · 10.2.0.14</p>
                </div>
              </div>

              <div>
                <p className="caption-upper text-[10px] text-muted-soft mb-2">Role permissions</p>
                <div className="flex flex-wrap gap-2">
                  {PERMISSIONS.map((perm) => (
                    <span key={perm} className="inline-flex items-center gap-1.5 rounded-md border border-hairline bg-surface-soft px-2.5 h-7 text-[11px] font-medium text-body">
                      <ShieldCheck size={12} className="text-accent-green" />
                      {perm}
                    </span>
                  ))}
                </div>
              </div>

              <button className="w-full inline-flex items-center justify-center gap-2 h-10 rounded-lg border border-hairline-strong bg-surface-soft text-[13px] font-medium text-coral hover:text-coral-active transition-colors">
                <LogOut size={14} /> Sign out
              </button>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
