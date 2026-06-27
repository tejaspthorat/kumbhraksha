'use client';

import { motion } from 'framer-motion';
import { Settings, Monitor, Bell, Shield, Palette, Database, Cpu, Globe } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import Badge from '@/components/ui/BaseBadge';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const settingSections = [
  {
    title: 'Display',
    icon: Monitor,
    settings: [
      { name: 'Dark Mode', description: 'Use dark theme throughout dashboard', enabled: true },
      { name: 'Animations', description: 'Enable UI motion and transitions', enabled: true },
      { name: 'Compact Mode', description: 'Reduce padding for denser layout', enabled: false },
    ],
  },
  {
    title: 'Notifications',
    icon: Bell,
    settings: [
      { name: 'Alert Sounds', description: 'Play audio on critical alerts', enabled: true },
      { name: 'Desktop Notifications', description: 'Push notifications in browser', enabled: true },
      { name: 'SMS Alerts', description: 'Send SMS via Twilio on critical events', enabled: false },
    ],
  },
  {
    title: 'AI Engine',
    icon: Cpu,
    settings: [
      { name: 'Auto Predictions', description: 'Automatically run predictive models', enabled: true },
      { name: 'Adaptive Thresholds', description: 'Auto-adjust density thresholds', enabled: true },
      { name: 'Edge Processing', description: 'Offload AI to edge devices', enabled: false },
    ],
  },
  {
    title: 'Security',
    icon: Shield,
    settings: [
      { name: 'Two-Factor Auth', description: 'Require 2FA for all logins', enabled: false },
      { name: 'Session Timeout', description: 'Auto-logout after 30 min inactivity', enabled: true },
      { name: 'Audit Logging', description: 'Log all user actions', enabled: true },
    ],
  },
];

export default function SettingsPage() {
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-white/40 mt-1">Configure system preferences and behavior</p>
      </div>

      {/* System info */}
      <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <GlassCard>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-accent/15"><Globe size={20} className="text-accent" /></div>
            <div>
              <p className="text-xs text-white/40">Version</p>
              <span className="text-sm font-bold text-white">v2.0.0</span>
            </div>
          </div>
        </GlassCard>
        <GlassCard>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-emerald-500/15"><Database size={20} className="text-emerald-400" /></div>
            <div>
              <p className="text-xs text-white/40">Database</p>
              <Badge variant="success">Connected</Badge>
            </div>
          </div>
        </GlassCard>
        <GlassCard>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-500/15"><Cpu size={20} className="text-blue-400" /></div>
            <div>
              <p className="text-xs text-white/40">AI Engine</p>
              <Badge variant="success">Active</Badge>
            </div>
          </div>
        </GlassCard>
        <GlassCard>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-purple-500/15"><Palette size={20} className="text-purple-400" /></div>
            <div>
              <p className="text-xs text-white/40">Theme</p>
              <span className="text-sm font-bold text-white">Dark</span>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Settings sections */}
      {settingSections.map(section => (
        <motion.div key={section.title} variants={item}>
          <GlassCard hover={false}>
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 rounded-xl bg-white/[0.04]">
                <section.icon size={18} className="text-accent" />
              </div>
              <h3 className="text-sm font-semibold text-white">{section.title}</h3>
            </div>
            <div className="space-y-4">
              {section.settings.map(s => (
                <div key={s.name} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.03] transition-colors">
                  <div>
                    <p className="text-sm font-medium text-white/80">{s.name}</p>
                    <p className="text-xs text-white/30 mt-0.5">{s.description}</p>
                  </div>
                  <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${s.enabled ? 'bg-accent' : 'bg-white/10'}`}>
                    <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${s.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      ))}
    </motion.div>
  );
}
