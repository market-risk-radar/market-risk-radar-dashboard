import { api } from '@/lib/api';
import { clsx } from 'clsx';

function weightedAverage(
  rows: Array<{ eventCount: number; value: number | null }>,
): number | null {
  const valid = rows.filter((row) => row.value !== null && row.eventCount > 0);
  if (valid.length === 0) return null;

  const weightedSum = valid.reduce(
    (sum, row) => sum + row.eventCount * (row.value ?? 0),
    0,
  );
  const totalWeight = valid.reduce((sum, row) => sum + row.eventCount, 0);
  return totalWeight > 0 ? weightedSum / totalWeight : null;
}

function pctOrDash(v: number | null) {
  if (v === null) return <span className="text-zinc-600">—</span>;
  const pos = v >= 0;
  return (
    <span className={pos ? 'text-emerald-400' : 'text-red-400'}>
      {(pos ? '+' : '') + (v * 100).toFixed(1) + '%'}
    </span>
  );
}

function dmBar(v: number | null) {
  if (v === null) return <span className="text-zinc-600">—</span>;
  const pct = (v * 100).toFixed(1);
  const good = v >= 0.55;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-zinc-800 rounded-full h-1.5 max-w-24">
        <div
          className={clsx('h-1.5 rounded-full', good ? 'bg-emerald-500' : 'bg-zinc-500')}
          style={{ width: `${Math.min(v * 100, 100)}%` }}
        />
      </div>
      <span className={clsx('text-xs', good ? 'text-emerald-400' : 'text-zinc-400')}>{pct}%</span>
    </div>
  );
}

export default async function EventReturnsPage() {
  const stats = await api.signalStats().catch(() => []);
  const filled = stats.filter((s) => s.eventCount > 0);

  const totalEvents = filled.reduce((s, r) => s + r.eventCount, 0);
  const avgDm5d = weightedAverage(
    filled.map((row) => ({
      eventCount: row.eventCount,
      value: row.directionMatch5dRate,
    })),
  );
  const avgAlpha5d = weightedAverage(
    filled.map((row) => ({
      eventCount: row.eventCount,
      value: row.avgAlpha5d,
    })),
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Event Returns</h2>
        <p className="text-sm text-zinc-500 mt-0.5">이벤트 유형별 수익 통계 (event_return)</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">총 이벤트</p>
          <p className="text-2xl font-bold text-white">{totalEvents}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">평균 방향일치 5d</p>
          <p className={clsx('text-2xl font-bold', avgDm5d != null && avgDm5d >= 0.55 ? 'text-emerald-400' : 'text-zinc-300')}>
            {avgDm5d != null ? (avgDm5d * 100).toFixed(1) + '%' : '—'}
          </p>
          <p className="text-xs text-zinc-600 mt-0.5">G2 목표: ≥ 55%</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">평균 α 5d</p>
          <p className={clsx('text-2xl font-bold', avgAlpha5d != null && avgAlpha5d >= 0 ? 'text-emerald-400' : 'text-red-400')}>
            {avgAlpha5d != null ? (avgAlpha5d >= 0 ? '+' : '') + (avgAlpha5d * 100).toFixed(2) + '%' : '—'}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
        <p className="text-sm font-semibold text-zinc-300 mb-4">카테고리별 수익률</p>
        <div className="space-y-3 md:hidden">
          {filled
            .sort((a, b) => b.eventCount - a.eventCount)
            .map((s, i) => (
              <div key={i} className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-white">{s.category ?? '—'}</p>
                    {s.rawTags.length > 0 && (
                      <p className="text-xs text-zinc-600 line-clamp-2">
                        {s.rawTags.slice(0, 3).join(', ')}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-zinc-500 whitespace-nowrap">{s.eventCount}건</span>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 mb-1">방향일치 5d</p>
                  {dmBar(s.directionMatch5dRate)}
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-zinc-500">수익률 1d</p>
                    <div>{pctOrDash(s.avgRet1d)}</div>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500">수익률 5d</p>
                    <div>{pctOrDash(s.avgRet5d)}</div>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500">α 1d</p>
                    <div>{pctOrDash(s.avgAlpha1d)}</div>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500">α 5d</p>
                    <div>{pctOrDash(s.avgAlpha5d)}</div>
                  </div>
                </div>
              </div>
            ))}
        </div>
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-zinc-500 uppercase border-b border-zinc-800">
                <th className="text-left py-2 pr-4">카테고리</th>
                <th className="text-right py-2 pr-4">이벤트</th>
                <th className="py-2 pr-4">방향일치 5d</th>
                <th className="text-right py-2 pr-4">수익률 1d</th>
                <th className="text-right py-2 pr-4">수익률 5d</th>
                <th className="text-right py-2 pr-4">α 1d</th>
                <th className="text-right py-2">α 5d</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filled
                .sort((a, b) => b.eventCount - a.eventCount)
                .map((s, i) => (
                  <tr key={i} className="hover:bg-zinc-800/50">
                    <td className="py-3 pr-4">
                      <p className="font-medium text-white">{s.category ?? '—'}</p>
                      {s.rawTags.length > 0 && (
                        <p className="text-xs text-zinc-600 truncate max-w-40">
                          {s.rawTags.slice(0, 3).join(', ')}
                        </p>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-right text-zinc-300">{s.eventCount}</td>
                    <td className="py-3 pr-4 min-w-32">{dmBar(s.directionMatch5dRate)}</td>
                    <td className="py-3 pr-4 text-right">{pctOrDash(s.avgRet1d)}</td>
                    <td className="py-3 pr-4 text-right">{pctOrDash(s.avgRet5d)}</td>
                    <td className="py-3 pr-4 text-right">{pctOrDash(s.avgAlpha1d)}</td>
                    <td className="py-3 text-right">{pctOrDash(s.avgAlpha5d)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
