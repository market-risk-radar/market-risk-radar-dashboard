import { clsx } from 'clsx';

interface Props {
  label: string;
  value: string | number;
  sub?: string;
  trend?: 'up' | 'down' | 'neutral';
}

export default function StatCard({ label, value, sub, trend }: Props) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/8 bg-[linear-gradient(180deg,rgba(18,23,31,0.92),rgba(12,16,22,0.9))] p-4 shadow-[0_24px_60px_rgba(0,0,0,0.18)]">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/16 to-transparent" />
      <div
        className={clsx(
          'absolute right-0 top-0 h-16 w-16 rounded-full blur-2xl',
          trend === 'up' && 'bg-emerald-400/14',
          trend === 'down' && 'bg-red-400/12',
          trend === 'neutral' && 'bg-orange-400/10',
          !trend && 'bg-sky-400/10',
        )}
      />
      <p className="relative mb-1 font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">{label}</p>
      <p
        className={clsx(
          'relative text-2xl font-bold tracking-[-0.04em]',
          trend === 'up' && 'text-emerald-400',
          trend === 'down' && 'text-red-400',
          trend === 'neutral' && 'text-white',
          !trend && 'text-white',
        )}
      >
        {value}
      </p>
      {sub && <p className="relative mt-2 text-xs leading-relaxed text-zinc-500">{sub}</p>}
    </div>
  );
}
