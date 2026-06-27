'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Play,
  SlidersHorizontal,
  Activity,
  Gauge,
  Clock,
  Siren,
  AlertTriangle,
  DoorOpen,
} from 'lucide-react';
import { PageHeader, StatePill, SeverityTag } from '@/components/ui/Tactical';
import { Panel, PanelHeader } from '@/components/ui/Panel';
import { MultiLine, BarMini } from '@/components/ui/Charts';
import { trendUp } from '@/lib/demoSeries';

const SCENARIOS = [
  { id: 'peak-snan', label: 'Peak Snan', seed: 201 },
  { id: 'entry-surge', label: 'Trimbak entry surge', seed: 202 },
  { id: 'rain-evac', label: 'Rain evacuation', seed: 203 },
];

const STEPS = Array.from({ length: 16 }, (_, i) => `${i * 5}m`);

function projection(seed: number, crowd: number, exitCap: number) {
  const peak = 60 + crowd * 0.35;
  const density = trendUp(seed, 16, 30, peak);
  const capacity = 70 + exitCap * 0.25;
  return density.map((d, i) => ({
    x: STEPS[i],
    density: d,
    capacity: Math.round(capacity),
  }));
}

const bottlenecks = (seed: number) =>
  ['Ramkund', 'Trimbak Entry', 'Godavari Ghat', 'Tapovan Exit', 'Sadhugram', 'Bridge Ramp'].map((g, i) => ({
    x: g,
    load: trendUp(seed + i, 6, 30, 90)[i],
  }));

function RangeInput({
  label,
  value,
  setValue,
  min,
  max,
  step = 1,
  unit,
}: {
  label: string;
  value: number;
  setValue: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[12px] text-body">{label}</span>
        <span className="tnum text-[12px] font-semibold text-ink">
          {value.toLocaleString('en-IN')}
          {unit && <span className="text-muted-soft font-normal"> {unit}</span>}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        className="w-full accent-coral h-1.5 cursor-pointer"
      />
    </div>
  );
}

export default function SimulationPage() {
  const [scenario, setScenario] = useState(SCENARIOS[0]);
  const [crowd, setCrowd] = useState(120000);
  const [exitCap, setExitCap] = useState(60);
  const [weather, setWeather] = useState(30);
  const [hasRun, setHasRun] = useState(false);
  const [runKey, setRunKey] = useState(0);

  const data = projection(scenario.seed, crowd / 1000, exitCap);
  const gates = bottlenecks(scenario.seed);

  const maxDensity = Math.max(...data.map((d) => d.density));
  const clearance = Math.round(40 + (crowd / 1000) * 0.4 - exitCap * 0.3 + weather * 0.5);
  const evacEta = Math.round(clearance * 0.7 + weather * 0.4);
  const risk = Math.min(100, Math.round(maxDensity * 0.6 + weather * 0.5 - exitCap * 0.2));
  const riskLevel: 'critical' | 'high' | 'medium' | 'low' =
    risk > 80 ? 'critical' : risk > 60 ? 'high' : risk > 40 ? 'medium' : 'low';

  const results = [
    { label: 'Clearance time', value: `${clearance}`, unit: 'min', icon: Clock, accent: 'orange' },
    { label: 'Max density', value: maxDensity.toFixed(1), unit: '/m²', icon: Gauge, accent: 'yellow' },
    { label: 'Evacuation ETA', value: `${evacEta}`, unit: 'min', icon: Siren, accent: 'blue' },
    { label: 'Risk score', value: `${risk}`, unit: '/100', icon: AlertTriangle, accent: 'red' },
  ] as const;

  const accentColor: Record<string, string> = {
    orange: 'var(--accent-orange)',
    yellow: 'var(--accent-yellow)',
    blue: 'var(--accent-blue)',
    red: 'var(--accent-red)',
  };

  function run() {
    setHasRun(true);
    setRunKey((k) => k + 1);
  }

  return (
    <div className="max-w-[1440px] mx-auto space-y-6">
      <PageHeader
        eyebrow="Predictive Ops"
        title="Simulation"
        description="Model crowd surges and evacuation outcomes before they happen — tune the scenario, run the engine, and read projected density, bottlenecks and clearance time."
      >
        <StatePill tone={hasRun ? 'green' : 'muted'} label={hasRun ? 'Last run complete' : 'Idle'} icon={Activity} />
      </PageHeader>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Controls */}
        <Panel className="p-5 xl:col-span-1">
          <PanelHeader title="Scenario controls" subtitle="Tune inputs, then run" icon={SlidersHorizontal} />
          <div className="mt-4 space-y-5">
            <div>
              <p className="caption-upper text-[10px] text-muted-soft mb-2">Scenario</p>
              <div className="flex flex-col gap-2">
                {SCENARIOS.map((s) => {
                  const active = s.id === scenario.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setScenario(s)}
                      className={
                        'text-left text-[13px] px-3 h-10 rounded-lg border transition-colors ' +
                        (active
                          ? 'border-coral/40 bg-coral/10 text-coral'
                          : 'border-hairline bg-surface-soft text-body hover:text-ink')
                      }
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4 pt-1">
              <RangeInput label="Crowd size" value={crowd} setValue={setCrowd} min={10000} max={500000} step={5000} unit="people" />
              <RangeInput label="Exit capacity" value={exitCap} setValue={setExitCap} min={10} max={100} unit="k/hr" />
              <RangeInput label="Weather severity" value={weather} setValue={setWeather} min={0} max={100} unit="/100" />
            </div>

            <button
              onClick={run}
              className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-lg bg-coral text-on-primary text-[13px] font-medium hover:bg-coral-active transition-colors"
            >
              <Play size={15} /> Run simulation
            </button>
          </div>
        </Panel>

        {/* Results */}
        <div className="xl:col-span-2 space-y-6">
          <motion.div
            key={runKey}
            initial={hasRun ? { opacity: 0, y: 10 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="grid grid-cols-2 md:grid-cols-4 gap-3"
          >
            {results.map((r, i) => (
              <motion.div
                key={r.label}
                initial={hasRun ? { opacity: 0, scale: 0.96 } : false}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: hasRun ? i * 0.05 : 0 }}
                className="relative overflow-hidden rounded-xl border border-hairline bg-surface-card p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="caption-upper text-[10px] text-muted-soft">{r.label}</span>
                  <span
                    className="grid place-items-center size-7 rounded-md border border-hairline bg-surface-soft"
                    style={{ color: accentColor[r.accent] }}
                  >
                    <r.icon size={14} />
                  </span>
                </div>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="tnum text-2xl font-semibold text-ink">{r.value}</span>
                  <span className="text-xs text-muted">{r.unit}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <Panel className="p-5">
            <PanelHeader
              title="Projected density vs capacity"
              subtitle={`${scenario.label} · 80 min horizon`}
              icon={Activity}
              action={<SeverityTag level={riskLevel} />}
            />
            <div className="mt-4">
              <MultiLine
                key={runKey}
                data={data}
                series={[
                  { key: 'density', accent: 'orange', name: 'Projected density' },
                  { key: 'capacity', accent: 'blue', name: 'Safe capacity' },
                ]}
                height={240}
              />
            </div>
          </Panel>

          <Panel accent={riskLevel === 'critical' ? 'red' : 'none'} className="p-5">
            <PanelHeader title="Predicted bottlenecks by gate" subtitle="Peak load · worst gate highlighted" icon={DoorOpen} />
            <div className="mt-4">
              <BarMini key={runKey} data={gates} dataKey="load" accent="orange" height={220} highlightMax />
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
