'use client';

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { PortfolioNav } from '@/lib/api';

export interface NavDataset {
  key: string;
  label: string;
  color: string;
  data: PortfolioNav[];
}

interface Props {
  datasets: NavDataset[];
}

function fmt(v: number) {
  return (v / 1_000_000).toFixed(1) + 'M';
}

function fmtDate(d: string) {
  return d.slice(5); // MM-DD
}

export default function NavChart({ datasets }: Props) {
  const sortedDatasets = datasets.map((dataset) => ({
    ...dataset,
    data: [...dataset.data].sort((a, b) => a.navDate.localeCompare(b.navDate)),
  }));

  const dateMap = new Map<string, Record<string, string | number>>();
  for (const dataset of sortedDatasets) {
    for (const point of dataset.data) {
      const existing = dateMap.get(point.navDate) ?? { navDate: point.navDate };
      existing[dataset.key] = Number(point.totalNav);
      dateMap.set(point.navDate, existing);
    }
  }

  const merged = [...dateMap.values()].sort((a, b) =>
    String(a.navDate).localeCompare(String(b.navDate)),
  );

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={merged} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <defs>
          {sortedDatasets.map((dataset) => (
            <linearGradient key={dataset.key} id={`navGrad-${dataset.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={dataset.color} stopOpacity={0.24} />
              <stop offset="95%" stopColor={dataset.color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
        <XAxis
          dataKey="navDate"
          tickFormatter={fmtDate}
          tick={{ fill: '#71717a', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tickFormatter={fmt}
          tick={{ fill: '#71717a', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={48}
        />
        <Tooltip
          contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }}
          labelStyle={{ color: '#a1a1aa', fontSize: 12 }}
          formatter={(v, name) => [
            (Number(v ?? 0) / 1_000_000).toFixed(2) + 'M',
            String(name ?? 'NAV'),
          ]}
        />
        {sortedDatasets.map((dataset) => (
          <Area
            key={dataset.key}
            type="monotone"
            dataKey={dataset.key}
            name={dataset.label}
            stroke={dataset.color}
            strokeWidth={2}
            fill={`url(#navGrad-${dataset.key})`}
            dot={false}
            connectNulls
            activeDot={{ r: 4, fill: dataset.color }}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
