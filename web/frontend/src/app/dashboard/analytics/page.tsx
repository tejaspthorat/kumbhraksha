'use client';

import {
  Users,
  Timer,
  ShieldCheck,
  Target,
  Activity,
  ArrowLeftRight,
  Layers,
  TrendingUp,
} from 'lucide-react';
import { PageHeader, StatePill, SeverityTag } from '@/components/ui/Tactical';
import { Panel, PanelHeader } from '@/components/ui/Panel';
import { KpiTile } from '@/components/ui/KpiTile';
import { AreaTrend, MultiLine, BarMini } from '@/components/ui/Charts';
import { Sparkline } from '@/components/ui/Sparkline';
import { series, trendUp } from '@/lib/demoSeries';

const HOURS = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);

const crowd24 = trendUp(101, 24, 28, 92).map((y, i) => ({ x: HOURS[i], crowd: y }));

const flow = series(102, 24, 60, 26).map((entry, i) => {
  const exit = series(103, 24, 55, 22)[i];
  return { x: HOURS[i], entry, exit, net: entry - exit };
});

const incidentsByZone = [
  { x: 'Ramkund', incidents: 18 },
  { x: 'Gate 2', incidents: 11 },
  { x: 'Zone B', incidents: 27 },
  { x: 'Sadhugram', incidents: 9 },
  { x: 'Trimbak', incidents: 14 },
  { x: 'Gate 4', incidents: 7 },
];

const forecast = trendUp(105, 24, 40, 96).map((y, i) => ({ x: HOURS[i], density: y }));

const ZONES: {
  zone: string;
  density: string;
  spark: number[];
  level: 'critical' | 'high' | 'medium' | 'low';
}[] = [
  { zone: 'Ramkund Ghat', density: '4.2', spark: trendUp(111, 16, 30, 85), level: 'critical' },
  { zone: 'Zone B Corridor', density: '3.6', spark: trendUp(112, 16, 35, 78), level: 'high' },
  { zone: 'Trimbak Road', density: '2.4', spark: series(113, 16, 50, 18), level: 'medium' },
  { zone: 'Gate 2 Plaza', density: '2.1', spark: series(114, 16, 45, 16), level: 'medium' },
  { zone: 'Sadhugram', density: '1.3', spark: series(115, 16, 40, 12), level: 'low' },
  { zone: 'Gate 4 Approach', density: '0.9', spark: series(116, 16, 35, 10), level: 'low' },
];

const densityTone: Record<string, string> = {
  critical: 'text-accent-red',
  high: 'text-accent-orange',
  medium: 'text-accent-yellow',
  low: 'text-accent-green',
};

export default function AnalyticsPage() {
  return (
    <div className="max-w-[1440px] mx-auto space-y-6">
      <PageHeader
        eyebrow="Crowd Intelligence"
        title="Analytics"
        description="Historical and predictive crowd analytics across every zone — flow, dwell, density and incident telemetry distilled into a single calm command surface."
      >
        <StatePill tone="blue" label="Live · 24h window" icon={Activity} />
        <StatePill tone="green" label="Models nominal" icon={ShieldCheck} />
      </PageHeader>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiTile label="Peak crowd" value="1.42" unit="M" icon={Users} accent="orange" delta={8.4} invertDelta spark={trendUp(121, 14, 30, 80)} />
        <KpiTile label="Avg dwell time" value="38" unit="min" icon={Timer} accent="yellow" delta={-4.1} spark={series(122, 14, 40, 8)} />
        <KpiTile label="Incidents resolved" value="312" icon={ShieldCheck} accent="green" delta={6.2} spark={trendUp(123, 14, 40, 70)} />
        <KpiTile label="Prediction accuracy" value="94.6" unit="%" icon={Target} accent="blue" delta={1.3} spark={trendUp(124, 14, 80, 95)} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Panel className="p-5">
          <PanelHeader title="Crowd over 24 hours" subtitle="Aggregate footfall · all zones" icon={TrendingUp} />
          <div className="mt-4">
            <AreaTrend data={crowd24} dataKey="crowd" accent="orange" height={240} />
          </div>
        </Panel>

        <Panel className="p-5">
          <PanelHeader title="Entry vs exit flow" subtitle="Net occupancy delta per hour" icon={ArrowLeftRight} />
          <div className="mt-4">
            <MultiLine
              data={flow}
              series={[
                { key: 'entry', accent: 'green', name: 'Entries' },
                { key: 'exit', accent: 'blue', name: 'Exits' },
                { key: 'net', accent: 'orange', name: 'Net flow' },
              ]}
              height={240}
            />
          </div>
        </Panel>

        <Panel className="p-5">
          <PanelHeader title="Incidents by zone" subtitle="Last 24h · hotspot highlighted" icon={Activity} />
          <div className="mt-4">
            <BarMini data={incidentsByZone} dataKey="incidents" accent="orange" height={240} highlightMax />
          </div>
        </Panel>

        <Panel accent="blue" className="p-5">
          <PanelHeader title="Density forecast" subtitle="Projected m²/person · next 24h" icon={Layers} />
          <div className="mt-4">
            <AreaTrend data={forecast} dataKey="density" accent="blue" height={240} />
          </div>
        </Panel>
      </div>

      <Panel className="p-5">
        <PanelHeader title="Zone breakdown" subtitle="Live density, trend and severity" icon={Layers} />
        <div className="mt-4">
          <div className="grid grid-cols-[1.4fr_0.8fr_1fr_0.9fr] items-center gap-4 px-3 pb-2 caption-upper text-[10px] text-muted-soft">
            <span>Zone</span>
            <span className="text-right">Density</span>
            <span>Trend</span>
            <span className="text-right">Severity</span>
          </div>
          <div className="space-y-px">
            {ZONES.map((z) => (
              <div
                key={z.zone}
                className="grid grid-cols-[1.4fr_0.8fr_1fr_0.9fr] items-center gap-4 rounded-lg border border-hairline bg-surface-soft px-3 py-3"
              >
                <span className="text-[13px] font-medium text-ink truncate">{z.zone}</span>
                <span className={'tnum text-[13px] font-semibold text-right ' + densityTone[z.level]}>
                  {z.density}
                  <span className="text-muted-soft font-normal text-[11px]"> /m²</span>
                </span>
                <Sparkline data={z.spark} color={`var(--accent-${z.level === 'critical' ? 'red' : z.level === 'high' ? 'orange' : z.level === 'medium' ? 'yellow' : 'green'})`} width={110} height={28} />
                <div className="flex justify-end">
                  <SeverityTag level={z.level} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Panel>
    </div>
  );
}
