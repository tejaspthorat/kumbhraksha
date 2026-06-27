'use client';

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const ACCENT: Record<string, string> = {
  orange: '#ff801f',
  blue: '#3b9eff',
  green: '#11ff99',
  yellow: '#ffc53d',
  red: '#ff2047',
  mute: '#a1a4a5',
};

const axisProps = {
  stroke: 'var(--muted-soft)',
  tick: { fill: 'var(--muted-soft)', fontSize: 11, fontFamily: 'var(--font-mono)' },
  tickLine: false,
  axisLine: false,
} as const;

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-hairline bg-surface-elevated/95 backdrop-blur px-3 py-2 shadow-xl">
      {label != null && <p className="text-[10px] text-muted-soft mb-1 font-mono uppercase tracking-wider">{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} className="tnum text-[12px] text-ink flex items-center gap-2">
          <span className="size-2 rounded-full" style={{ background: p.color || p.fill }} />
          {p.name}: <span className="font-semibold">{p.value?.toLocaleString?.('en-IN') ?? p.value}</span>
        </p>
      ))}
    </div>
  );
}

type Datum = Record<string, number | string>;

export function AreaTrend({
  data,
  dataKey,
  xKey = 'x',
  accent = 'orange',
  height = 200,
}: {
  data: Datum[];
  dataKey: string;
  xKey?: string;
  accent?: keyof typeof ACCENT;
  height?: number;
}) {
  const color = ACCENT[accent];
  const id = `area-${dataKey}-${accent}`;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--hairline)" vertical={false} />
        <XAxis dataKey={xKey} {...axisProps} />
        <YAxis {...axisProps} width={40} />
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'var(--hairline-strong)' }} />
        <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} fill={`url(#${id})`} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function MultiLine({
  data,
  series,
  xKey = 'x',
  height = 220,
}: {
  data: Datum[];
  series: { key: string; accent: keyof typeof ACCENT; name?: string }[];
  xKey?: string;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--hairline)" vertical={false} />
        <XAxis dataKey={xKey} {...axisProps} />
        <YAxis {...axisProps} width={40} />
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'var(--hairline-strong)' }} />
        {series.map((s) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.name ?? s.key}
            stroke={ACCENT[s.accent]}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function BarMini({
  data,
  dataKey,
  xKey = 'x',
  accent = 'blue',
  height = 200,
  highlightMax = false,
}: {
  data: Datum[];
  dataKey: string;
  xKey?: string;
  accent?: keyof typeof ACCENT;
  height?: number;
  highlightMax?: boolean;
}) {
  const color = ACCENT[accent];
  const max = highlightMax ? Math.max(...data.map((d) => Number(d[dataKey]))) : null;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--hairline)" vertical={false} />
        <XAxis dataKey={xKey} {...axisProps} />
        <YAxis {...axisProps} width={40} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--hairline)' }} />
        <Bar dataKey={dataKey} radius={[4, 4, 0, 0]}>
          {data.map((d, i) => (
            <Cell
              key={i}
              fill={highlightMax && Number(d[dataKey]) === max ? ACCENT.red : color}
              fillOpacity={highlightMax && Number(d[dataKey]) === max ? 1 : 0.7}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export { ACCENT as chartAccents };
