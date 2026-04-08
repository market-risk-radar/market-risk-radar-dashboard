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

interface Props {
  data: PortfolioNav[];
}

function fmt(v: number) {
  return (v / 1_000_000).toFixed(1) + 'M';
}

function fmtDate(d: string) {
  return d.slice(5); // MM-DD
}

export default function NavChart({ data }: Props) {
  const sorted = [...data].sort((a, b) => a.navDate.localeCompare(b.navDate));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={sorted} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="navGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
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
          formatter={(v) => [(Number(v ?? 0) / 1_000_000).toFixed(2) + 'M', 'NAV']}
        />
        <Area
          type="monotone"
          dataKey="totalNav"
          stroke="#3b82f6"
          strokeWidth={2}
          fill="url(#navGrad)"
          dot={false}
          activeDot={{ r: 4, fill: '#3b82f6' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
