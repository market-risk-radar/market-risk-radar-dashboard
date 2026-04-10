import { api } from '@/lib/api';
import { clsx } from 'clsx';

const DIRECTION_COLOR = {
  '+': 'text-emerald-400',
  '-': 'text-red-400',
};

const CATEGORY_COLOR: Record<string, string> = {
  EARNINGS_BEAT:     'bg-emerald-900 text-emerald-300',
  EARNINGS_MISS:     'bg-red-900 text-red-300',
  CONTRACT_WIN:      'bg-blue-900 text-blue-300',
  CONTRACT_LOSS:     'bg-orange-900 text-orange-300',
  GUIDANCE_UP:       'bg-teal-900 text-teal-300',
  GUIDANCE_DOWN:     'bg-amber-900 text-amber-300',
  REGULATORY_ACTION: 'bg-rose-900 text-rose-300',
  DILUTION:          'bg-purple-900 text-purple-300',
};

function categoryBadge(cat: string) {
  return (
    <span
      className={clsx(
        'text-xs px-2 py-0.5 rounded-full font-medium',
        CATEGORY_COLOR[cat] ?? 'bg-zinc-800 text-zinc-300',
      )}
    >
      {cat}
    </span>
  );
}

function pctOrDash(v: number | null) {
  if (v === null) return '—';
  return (v >= 0 ? '+' : '') + (v * 100).toFixed(1) + '%';
}

export default async function SignalsPage() {
  const [candidates, stats] = await Promise.all([
    api.signalCandidates(50).catch(() => []),
    api.signalStats().catch(() => []),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Signals</h2>
        <p className="text-sm text-zinc-500 mt-0.5">signal_candidate 목록 및 카테고리 통계</p>
      </div>

      {/* Stats by category */}
      {stats.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
          <p className="text-sm font-semibold text-zinc-300 mb-4">카테고리별 통계</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-zinc-500 uppercase border-b border-zinc-800">
                  <th className="text-left py-2 pr-4">카테고리</th>
                  <th className="text-right py-2 pr-4">이벤트</th>
                  <th className="text-right py-2 pr-4">방향일치 1d</th>
                  <th className="text-right py-2 pr-4">방향일치 5d</th>
                  <th className="text-right py-2 pr-4">α 1d</th>
                  <th className="text-right py-2">α 5d</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {stats.map((s, i) => (
                  <tr key={i} className="hover:bg-zinc-800/50">
                    <td className="py-2.5 pr-4">
                      {s.category ? categoryBadge(s.category) : <span className="text-zinc-600">—</span>}
                    </td>
                    <td className="py-2.5 pr-4 text-right text-zinc-300">{s.eventCount}</td>
                    <td className="py-2.5 pr-4 text-right text-zinc-300">{pctOrDash(s.directionMatch1dRate)}</td>
                    <td className="py-2.5 pr-4 text-right text-zinc-300">{pctOrDash(s.directionMatch5dRate)}</td>
                    <td className={clsx('py-2.5 pr-4 text-right', s.avgAlpha1d != null && s.avgAlpha1d >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                      {pctOrDash(s.avgAlpha1d)}
                    </td>
                    <td className={clsx('py-2.5 text-right', s.avgAlpha5d != null && s.avgAlpha5d >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                      {pctOrDash(s.avgAlpha5d)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Candidate list */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
        <p className="text-sm font-semibold text-zinc-300 mb-4">
          최근 시그널 후보 ({candidates.length}건)
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-zinc-500 uppercase border-b border-zinc-800">
                <th className="text-left py-2 pr-4">종목</th>
                <th className="text-left py-2 pr-4">카테고리</th>
                <th className="text-right py-2 pr-4">방향</th>
                <th className="text-right py-2 pr-4">Confidence</th>
                <th className="text-right py-2 pr-4">Signal Score</th>
                <th className="text-right py-2">날짜</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {candidates.map((c) => (
                <tr key={c.id} className="hover:bg-zinc-800/50">
                  <td className="py-2.5 pr-4">
                    <p className="font-medium text-white">{c.name}</p>
                    <p className="text-xs text-zinc-500">{c.ticker}</p>
                  </td>
                  <td className="py-2.5 pr-4">{categoryBadge(c.category)}</td>
                  <td className={clsx('py-2.5 pr-4 text-right font-bold', DIRECTION_COLOR[c.impactDirection])}>
                    {c.impactDirection === '+' ? '▲' : '▼'}
                  </td>
                  <td className="py-2.5 pr-4 text-right text-zinc-300">
                    {(c.confidence * 100).toFixed(0)}%
                  </td>
                  <td className="py-2.5 pr-4 text-right text-zinc-300">{c.signalScore}</td>
                  <td className="py-2.5 text-right text-zinc-500 text-xs">{c.signalDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
