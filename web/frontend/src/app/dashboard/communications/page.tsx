'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Radio,
  Stethoscope,
  Shield,
  Users,
  Megaphone,
  Send,
  Paperclip,
  Hash,
  Activity,
  Clock,
  MessageSquare,
} from 'lucide-react';
import { PageHeader, StatePill, SeverityTag, StatusDot } from '@/components/ui/Tactical';
import { Panel, PanelHeader } from '@/components/ui/Panel';

type Tone = 'green' | 'orange' | 'red' | 'blue' | 'yellow' | 'muted';

type Channel = {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  tone: Tone;
  unread: number;
};

type Message = {
  id: number;
  sender: string;
  role: string;
  time: string;
  body: string;
  self?: boolean;
};

const CHANNELS: Channel[] = [
  { id: 'all', name: 'All Units', icon: Radio, tone: 'orange', unread: 3 },
  { id: 'medical', name: 'Medical', icon: Stethoscope, tone: 'green', unread: 0 },
  { id: 'police-a', name: 'Police Zone A', icon: Shield, tone: 'blue', unread: 5 },
  { id: 'police-b', name: 'Police Zone B', icon: Shield, tone: 'blue', unread: 0 },
  { id: 'volunteers', name: 'Volunteers', icon: Users, tone: 'yellow', unread: 1 },
  { id: 'citizen', name: 'Citizen Broadcast', icon: Megaphone, tone: 'red', unread: 0 },
];

const SEED: Record<string, Message[]> = {
  all: [
    { id: 1, sender: 'Control Room', role: 'Command', time: '09:42', body: 'All units, holding pattern at Ramkund. Crowd index climbing — stay alert.' },
    { id: 2, sender: 'POL-04', role: 'Police', time: '09:43', body: 'Copy. Gate 2 secured, two channels open for outflow.' },
    { id: 3, sender: 'MED-01', role: 'Medical', time: '09:45', body: 'Medical staged at Ramkund. Ready for dispatch.', self: true },
    { id: 4, sender: 'Control Room', role: 'Command', time: '09:47', body: 'Acknowledged MED-01. Forecast shows surge in 12 min near Trimbak Rd.' },
  ],
  medical: [
    { id: 1, sender: 'MED-03', role: 'Medical', time: '09:30', body: 'Sadhugram post fully stocked. Two stretchers free.' },
    { id: 2, sender: 'Control Room', role: 'Command', time: '09:38', body: 'Good. Keep one ambulance on standby for Zone B.' },
    { id: 3, sender: 'MED-01', role: 'Medical', time: '09:41', body: 'Standby confirmed.', self: true },
  ],
  'police-a': [
    { id: 1, sender: 'POL-04', role: 'Police', time: '09:20', body: 'Zone A barricades in place. Foot traffic nominal.' },
    { id: 2, sender: 'POL-07', role: 'Police', time: '09:33', body: 'Minor bottleneck at Gate 2, deploying two officers.' },
    { id: 3, sender: 'Control Room', role: 'Command', time: '09:35', body: 'Copy POL-07. Camera CAM-02 watching the lane.' },
  ],
  'police-b': [
    { id: 1, sender: 'Control Room', role: 'Command', time: '09:15', body: 'Zone B quiet. Maintain current posture.' },
    { id: 2, sender: 'RES-11', role: 'Rescue', time: '09:29', body: 'Rescue enroute Zone B, ETA 2 min.', self: true },
  ],
  volunteers: [
    { id: 1, sender: 'VOL-22', role: 'Volunteer', time: '09:10', body: 'Water distribution underway at Gate 4.' },
    { id: 2, sender: 'Control Room', role: 'Command', time: '09:12', body: 'Thanks VOL-22. Direct lost pilgrims to the help desk.' },
  ],
  citizen: [
    { id: 1, sender: 'Control Room', role: 'Broadcast', time: '09:00', body: 'Citizens: please use designated routes near Ramkund. Follow volunteer guidance.', self: true },
  ],
};

const TARGETS = ['All units', 'Medical', 'Police', 'Volunteers', 'Citizens'];

const roleTone: Record<string, string> = {
  Command: 'text-accent-orange border-accent-orange/30 bg-accent-orange/10',
  Medical: 'text-accent-green border-accent-green/30 bg-accent-green/10',
  Police: 'text-accent-blue border-accent-blue/30 bg-accent-blue/10',
  Rescue: 'text-accent-yellow border-accent-yellow/30 bg-accent-yellow/10',
  Volunteer: 'text-accent-yellow border-accent-yellow/30 bg-accent-yellow/10',
  Broadcast: 'text-accent-red border-accent-red/30 bg-accent-red/10',
};

const STATS = [
  { label: 'Active responders', value: '24', icon: Activity, accent: 'var(--accent-green)' },
  { label: 'Messages today', value: '312', icon: MessageSquare, accent: 'var(--accent-blue)' },
  { label: 'Avg response', value: '48s', icon: Clock, accent: 'var(--accent-orange)' },
];

export default function CommunicationsPage() {
  const [activeId, setActiveId] = useState('all');
  const [threads, setThreads] = useState<Record<string, Message[]>>(SEED);
  const [draft, setDraft] = useState('');
  const [target, setTarget] = useState('All units');
  const [broadcast, setBroadcast] = useState('');

  const activeChannel = CHANNELS.find((c) => c.id === activeId)!;
  const messages = threads[activeId] ?? [];

  const sendMessage = () => {
    const body = draft.trim();
    if (!body) return;
    setThreads((prev) => {
      const list = prev[activeId] ?? [];
      const next: Message = {
        id: (list.at(-1)?.id ?? 0) + 1,
        sender: 'MED-01',
        role: 'Medical',
        time: 'now',
        body,
        self: true,
      };
      return { ...prev, [activeId]: [...list, next] };
    });
    setDraft('');
  };

  const totalUnread = useMemo(() => CHANNELS.reduce((a, c) => a + c.unread, 0), []);

  return (
    <div className="max-w-[1440px] mx-auto space-y-6">
      <PageHeader
        eyebrow="Operations"
        title="Communications"
        description="Coordinate every responder channel and push citizen broadcasts from one tactical comms console."
      >
        <StatePill tone="green" label="24 responders" icon={Users} />
        <StatePill tone="orange" label={`${totalUnread} unread`} icon={Radio} />
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Channel list */}
        <Panel className="lg:col-span-3 p-4">
          <PanelHeader title="Channels" subtitle="Responder + citizen" icon={Hash} />
          <div className="mt-4 space-y-1.5">
            {CHANNELS.map((c) => {
              const active = c.id === activeId;
              return (
                <button
                  key={c.id}
                  onClick={() => setActiveId(c.id)}
                  className={
                    'w-full flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors ' +
                    (active
                      ? 'border-coral/40 bg-coral/10'
                      : 'border-hairline bg-surface-soft hover:border-hairline-strong')
                  }
                >
                  <StatusDot tone={c.tone} />
                  <span className={'flex-1 min-w-0 text-[13px] font-medium truncate ' + (active ? 'text-ink' : 'text-body')}>
                    {c.name}
                  </span>
                  {c.unread > 0 && (
                    <span className="tnum text-[10px] font-semibold min-w-5 h-5 px-1.5 grid place-items-center rounded-full bg-coral text-on-primary">
                      {c.unread}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </Panel>

        {/* Message thread */}
        <Panel className="lg:col-span-6 p-0 flex flex-col" elevated>
          <div className="p-5 border-b border-hairline">
            <PanelHeader
              title={activeChannel.name}
              subtitle={`${messages.length} messages`}
              icon={activeChannel.icon}
              action={<StatusDot tone={activeChannel.tone} />}
            />
          </div>
          <div className="flex-1 min-h-[360px] max-h-[520px] overflow-y-auto p-5 space-y-4">
            {messages.map((m, i) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.2) }}
                className={'flex flex-col gap-1 ' + (m.self ? 'items-end' : 'items-start')}
              >
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-medium text-ink">{m.sender}</span>
                  <span className={'text-[10px] px-1.5 py-0.5 rounded border font-medium ' + (roleTone[m.role] ?? 'text-muted border-hairline bg-surface-soft')}>
                    {m.role}
                  </span>
                  <span className="tnum text-[10px] text-muted-soft font-mono">{m.time}</span>
                </div>
                <p
                  className={
                    'max-w-[80%] text-[13px] leading-relaxed rounded-xl px-3.5 py-2.5 border ' +
                    (m.self
                      ? 'bg-coral/10 border-coral/30 text-ink'
                      : 'bg-surface-soft border-hairline text-body')
                  }
                >
                  {m.body}
                </p>
              </motion.div>
            ))}
          </div>
          {/* Composer */}
          <div className="p-4 border-t border-hairline">
            <div className="flex items-end gap-2">
              <button
                aria-label="Attach file"
                className="grid place-items-center size-10 shrink-0 rounded-lg border border-hairline bg-surface-soft text-muted hover:text-ink transition-colors"
              >
                <Paperclip size={16} />
              </button>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                rows={1}
                placeholder={`Message ${activeChannel.name}…`}
                className="flex-1 resize-none rounded-lg border border-hairline bg-surface-soft px-3 py-2.5 text-[13px] text-ink placeholder:text-muted-soft outline-none focus:border-coral/40"
              />
              <button
                onClick={sendMessage}
                disabled={!draft.trim()}
                className="inline-flex items-center gap-2 h-10 px-4 shrink-0 rounded-lg bg-coral text-on-primary text-[13px] font-medium disabled:opacity-40 hover:bg-coral-active transition-colors"
              >
                <Send size={14} /> Send
              </button>
            </div>
          </div>
        </Panel>

        {/* Broadcast + stats */}
        <div className="lg:col-span-3 space-y-6">
          <Panel accent="orange" className="p-5">
            <PanelHeader title="Broadcast" subtitle="Quick push to channels" icon={Megaphone} />
            <div className="mt-4 space-y-3">
              <div className="flex flex-wrap gap-2">
                {TARGETS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTarget(t)}
                    className={
                      'text-[12px] px-3 h-8 rounded-lg border transition-colors ' +
                      (t === target
                        ? 'border-coral/40 bg-coral/10 text-coral'
                        : 'border-hairline bg-surface-soft text-body hover:text-ink')
                    }
                  >
                    {t}
                  </button>
                ))}
              </div>
              <textarea
                value={broadcast}
                onChange={(e) => setBroadcast(e.target.value)}
                rows={3}
                placeholder="Compose broadcast message…"
                className="w-full rounded-lg border border-hairline bg-surface-soft p-3 text-[13px] text-ink placeholder:text-muted-soft outline-none focus:border-coral/40 resize-none"
              />
              <div className="flex items-center justify-between">
                <SeverityTag level="high" />
                <button
                  disabled={!broadcast.trim()}
                  className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-coral text-on-primary text-[13px] font-medium disabled:opacity-40 hover:bg-coral-active transition-colors"
                >
                  <Send size={14} /> Send
                </button>
              </div>
            </div>
          </Panel>

          <Panel className="p-5">
            <PanelHeader title="Channel stats" subtitle="Live comms metrics" icon={Activity} />
            <div className="mt-4 space-y-2.5">
              {STATS.map((s) => (
                <div
                  key={s.label}
                  className="flex items-center gap-3 rounded-lg border border-hairline bg-surface-soft px-3 py-2.5"
                >
                  <span
                    className="grid place-items-center size-9 rounded-lg border border-hairline bg-surface-card shrink-0"
                    style={{ color: s.accent }}
                  >
                    <s.icon size={16} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="caption-upper text-[10px] text-muted-soft">{s.label}</p>
                    <p className="tnum text-lg font-semibold text-ink leading-tight">{s.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
