import { api, type SignalTagStats } from '@/lib/api';
import { clsx } from 'clsx';
export const dynamic = 'force-dynamic';

const MIN_SAMPLE_EVENTS = 50;
function weightedAverage(
  rows: Array<{ weight: number; value: number | null }>,
): number | null {
  const valid = rows.filter((row) => row.value !== null && row.weight > 0);
  if (valid.length === 0) return null;

  const weightedSum = valid.reduce(
    (sum, row) => sum + row.weight * (row.value ?? 0),
    0,
  );
  const totalWeight = valid.reduce((sum, row) => sum + row.weight, 0);
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

function dmBar(v: number | null, pass: boolean) {
  if (v === null) return <span className="text-zinc-600">—</span>;
  const pct = (v * 100).toFixed(1);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-zinc-800 rounded-full h-1.5 max-w-24">
        <div
          className={clsx('h-1.5 rounded-full', pass ? 'bg-emerald-500' : 'bg-zinc-500')}
          style={{ width: `${Math.min(v * 100, 100)}%` }}
        />
      </div>
      <span className={clsx('text-xs', pass ? 'text-emerald-400' : 'text-zinc-400')}>{pct}%</span>
    </div>
  );
}

function sampleStatus(filledCount: number): 'ok' | 'low' {
  return filledCount >= MIN_SAMPLE_EVENTS ? 'ok' : 'low';
}

function sampleBadge(filledCount: number) {
  const status = sampleStatus(filledCount);
  return (
    <span
      className={clsx(
        'text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap',
        status === 'ok' ? 'bg-emerald-900 text-emerald-300' : 'bg-amber-900 text-amber-300',
      )}
    >
      {status === 'ok' ? '표본 충분' : '표본 부족'}
    </span>
  );
}

function rawTagChips(tags: string[], limit = 5) {
  const visible = tags.slice(0, limit);
  return (
    <div className="flex flex-wrap gap-1.5">
      {visible.map((tag) => (
        <span
          key={tag}
          className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300"
        >
          {tag}
        </span>
      ))}
      {tags.length > limit && (
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-500">
          +{tags.length - limit}
        </span>
      )}
    </div>
  );
}

function categoryLabel(category: string | null) {
  return category ?? '미분류/기타';
}

function compareSignalTagStats(a: SignalTagStats, b: SignalTagStats) {
  const g2Score = (row: SignalTagStats) => {
    if (row.g2Pass) return 2;
    if (row.g2Eligible) return 1;
    return 0;
  };

  return (
    g2Score(b) - g2Score(a) ||
    b.filledCount - a.filledCount ||
    b.eventCount - a.eventCount ||
    categoryLabel(a.category).localeCompare(categoryLabel(b.category))
  );
}

export default async function EventReturnsPage() {
  const statsResult = await api.signalStats()
    .then((value) => ({ ok: true as const, value }))
    .catch(() => ({ ok: false as const, value: [] }));
  const stats = statsResult.value;
  const filled = stats.filter((s) => s.eventCount > 0);
  const sortedFilled = [...filled].sort(compareSignalTagStats);
  const eligibleSummaryRows = filled.filter(
    (s) => s.g2Eligible,
  );

  const totalEvents = filled.reduce((s, r) => s + r.eventCount, 0);
  const avgAlphaDm5d = weightedAverage(
    eligibleSummaryRows.map((row) => ({
      weight: row.filledCount,
      value: row.alphaDirectionMatch5dRate,
    })),
  );
  const avgAlpha5d = weightedAverage(
    eligibleSummaryRows.map((row) => ({
      weight: row.filledCount,
      value: row.avgAlpha5d,
    })),
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
        <div className="rounded-[28px] border border-white/8 bg-[linear-gradient(135deg,rgba(18,24,32,0.9),rgba(10,13,18,0.88))] px-6 py-6 shadow-[0_32px_80px_rgba(0,0,0,0.24)]">
          <p className="font-mono text-[11px] uppercase tracking-[0.26em] text-orange-200/70">Event Returns</p>
          <h2 className="mt-3 text-3xl font-bold text-white">Category return matrix</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">
            event_return 기반 카테고리별 수익률과 방향일치율을 표본 기준과 함께 검토하는 화면.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">Events</p>
            <p className="mt-2 text-3xl font-bold text-white">{totalEvents}</p>
            <p className="mt-1 text-xs text-zinc-500">집계 포함 총 이벤트 수</p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">Eligible</p>
            <p className="mt-2 text-3xl font-bold text-white">{eligibleSummaryRows.length}</p>
            <p className="mt-1 text-xs text-zinc-500">filled 50건 기준 통과 카테고리 수</p>
          </div>
        </div>
      </div>

      {!statsResult.ok && (
        <div className="bg-red-950/30 border border-red-900 rounded-lg p-4 text-sm text-red-200">
          event_return 통계를 불러오지 못했습니다. API 연결 또는 접근 제어 상태를 확인하세요.
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-white/8 bg-[linear-gradient(180deg,rgba(18,23,31,0.92),rgba(12,16,22,0.9))] p-4 shadow-[0_24px_60px_rgba(0,0,0,0.18)]">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">총 이벤트</p>
            <p className="text-2xl font-bold text-white">{totalEvents}</p>
          </div>
        <div className="rounded-2xl border border-white/8 bg-[linear-gradient(180deg,rgba(18,23,31,0.92),rgba(12,16,22,0.9))] p-4 shadow-[0_24px_60px_rgba(0,0,0,0.18)]">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">평균 α방향일치 5d</p>
          <p className={clsx('text-2xl font-bold', eligibleSummaryRows.some((row) => row.g2Pass) ? 'text-emerald-400' : 'text-zinc-300')}>
            {avgAlphaDm5d != null ? (avgAlphaDm5d * 100).toFixed(1) + '%' : '—'}
          </p>
          <p className="text-xs text-zinc-600 mt-0.5">
            G2 목표: α방향일치 5d ≥ 45% / 표준 카테고리 + filled 50건 이상만 반영
          </p>
        </div>
        <div className="rounded-2xl border border-white/8 bg-[linear-gradient(180deg,rgba(18,23,31,0.92),rgba(12,16,22,0.9))] p-4 shadow-[0_24px_60px_rgba(0,0,0,0.18)]">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">평균 α 5d</p>
          <p className={clsx('text-2xl font-bold', avgAlpha5d != null && avgAlpha5d >= 0 ? 'text-emerald-400' : 'text-red-400')}>
            {avgAlpha5d != null ? (avgAlpha5d >= 0 ? '+' : '') + (avgAlpha5d * 100).toFixed(2) + '%' : '—'}
          </p>
          <p className="text-xs text-zinc-600 mt-0.5">
            표준 카테고리 + 표본 50건 이상만 반영
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(17,22,29,0.9),rgba(10,14,19,0.92))] p-5 shadow-[0_28px_70px_rgba(0,0,0,0.2)]">
        <div className="mb-4">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-zinc-500 mb-2">Return Table</p>
          <p className="text-sm font-semibold text-zinc-300">카테고리별 수익률</p>
          <p className="text-xs text-zinc-600 mt-0.5">filledCount 50건 미만 카테고리는 표본 부족으로 표시한다.</p>
          <p className="text-xs text-zinc-600 mt-0.5">대표 태그는 해당 카테고리로 정규화된 원시 event tag 예시이며, 미분류/기타는 상위 미매핑 tag 예시다.</p>
        </div>
        {filled.length === 0 && (
          <div className="text-sm text-zinc-600 py-8 text-center">표시할 event_return 통계가 없습니다</div>
        )}
        {filled.length > 0 && <div className="space-y-3 md:hidden">
          {sortedFilled.map((s, i) => (
              <div
                key={i}
                className={clsx(
                  'rounded-lg border p-4 space-y-3',
                  sampleStatus(s.filledCount) === 'ok'
                    ? 'border-zinc-800 bg-zinc-950/60'
                    : 'border-amber-800/80 bg-amber-950/20',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-white">{categoryLabel(s.category)}</p>
                      {sampleBadge(s.filledCount)}
                    </div>
                    {s.rawTags.length > 0 && <div className="mt-2">{rawTagChips(s.rawTags, 4)}</div>}
                  </div>
                  <span className="text-xs text-zinc-500 whitespace-nowrap">event {s.eventCount} / filled {s.filledCount}</span>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 mb-1">α방향일치 5d</p>
                  {dmBar(s.alphaDirectionMatch5dRate, s.g2Pass)}
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
        </div>}
        {filled.length > 0 && <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-zinc-500 uppercase border-b border-zinc-800">
                <th className="text-left py-2 pr-4">카테고리</th>
                <th className="text-left py-2 pr-4">대표 태그</th>
                <th className="text-right py-2 pr-4">이벤트</th>
                <th className="py-2 pr-4">α방향일치 5d</th>
                <th className="text-right py-2 pr-4">수익률 1d</th>
                <th className="text-right py-2 pr-4">수익률 5d</th>
                <th className="text-right py-2 pr-4">α 1d</th>
                <th className="text-right py-2">α 5d</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {sortedFilled.map((s, i) => (
                  <tr key={i} className="hover:bg-zinc-800/50">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-white">{categoryLabel(s.category)}</p>
                        {sampleBadge(s.filledCount)}
                      </div>
                    </td>
                    <td className="py-3 pr-4 min-w-52">
                      {s.rawTags.length > 0 ? rawTagChips(s.rawTags, 5) : <span className="text-zinc-600 text-xs">—</span>}
                    </td>
                    <td className="py-3 pr-4 text-right text-zinc-300">{s.eventCount} / {s.filledCount}</td>
                    <td className="py-3 pr-4 min-w-32">{dmBar(s.alphaDirectionMatch5dRate, s.g2Pass)}</td>
                    <td className="py-3 pr-4 text-right">{pctOrDash(s.avgRet1d)}</td>
                    <td className="py-3 pr-4 text-right">{pctOrDash(s.avgRet5d)}</td>
                    <td className="py-3 pr-4 text-right">{pctOrDash(s.avgAlpha1d)}</td>
                    <td className="py-3 text-right">{pctOrDash(s.avgAlpha5d)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>}
      </div>
    </div>
  );
}
