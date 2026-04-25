import { api, type SignalTagStats } from '@/lib/api';
import { clsx } from 'clsx';
export const dynamic = 'force-dynamic';

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

const MIN_SAMPLE_EVENTS = 50;

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

function categoryCell(category: string | null) {
  if (category === null) {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-zinc-900 text-zinc-400">
        미분류/기타
      </span>
    );
  }

  return categoryBadge(category);
}

function categoryLabel(category: string | null) {
  return category ?? '미분류/기타';
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

function g2Badge(g2Eligible: boolean, g2Pass: boolean) {
  if (!g2Eligible) {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap bg-zinc-800 text-zinc-400">
        G2 대기
      </span>
    );
  }

  if (g2Pass) {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap bg-emerald-900 text-emerald-300">
        G2 통과
      </span>
    );
  }

  return (
    <span className="text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap bg-amber-900 text-amber-300">
      G2 미통과
    </span>
  );
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

function pctOrDash(v: number | null | undefined) {
  if (v == null) return '—';
  return (v >= 0 ? '+' : '') + (v * 100).toFixed(1) + '%';
}

function alphaTextColor(v: number | null | undefined) {
  if (v == null) return 'text-zinc-500';
  return v >= 0 ? 'text-emerald-400' : 'text-red-400';
}

function rsiDisplay(v: number | null) {
  if (v === null) return '—';
  return v.toFixed(1);
}

function rsiTextColor(v: number | null) {
  if (v === null) return 'text-zinc-500';
  if (v >= 70) return 'text-red-400';
  if (v <= 30) return 'text-emerald-400';
  return 'text-zinc-300';
}

function volRatioDisplay(v: number | null) {
  if (v === null) return '—';
  return v.toFixed(1) + 'x';
}

function volRatioTextColor(v: number | null) {
  if (v === null) return 'text-zinc-500';
  if (v >= 2) return 'text-orange-400';
  return 'text-zinc-300';
}

function high52wDisplay(v: number | null) {
  if (v === null) return '—';
  return (v * 100).toFixed(1) + '%';
}

function formatSignalDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('ko-KR', {
    timeZone: 'Asia/Seoul',
    month: '2-digit',
    day: '2-digit',
  });
}

export default async function SignalsPage() {
  const [candidatesResult, statsResult] = await Promise.allSettled([
    api.signalCandidates(50),
    api.signalStats(),
  ]);
  const candidates = candidatesResult.status === 'fulfilled' ? candidatesResult.value : [];
  const stats = statsResult.status === 'fulfilled' ? statsResult.value : [];
  const sortedStats = [...stats].sort(compareSignalTagStats);
  const hasError =
    candidatesResult.status === 'rejected' || statsResult.status === 'rejected';

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
        <div className="rounded-[28px] border border-white/8 bg-[linear-gradient(135deg,rgba(18,24,32,0.9),rgba(10,13,18,0.88))] px-6 py-6 shadow-[0_32px_80px_rgba(0,0,0,0.24)]">
          <p className="font-mono text-[11px] uppercase tracking-[0.26em] text-orange-200/70">Signals</p>
          <h2 className="mt-3 text-3xl font-bold text-white">Signal validation surface</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">
            최근 signal_candidate와 카테고리별 방향일치율, alpha를 함께 확인하는 검증 화면.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">Candidates</p>
            <p className="mt-2 text-3xl font-bold text-white">{candidates.length}</p>
            <p className="mt-1 text-xs text-zinc-500">최근 시그널 후보 수</p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">Categories</p>
            <p className="mt-2 text-3xl font-bold text-white">{stats.length}</p>
            <p className="mt-1 text-xs text-zinc-500">카테고리 통계 행 수</p>
          </div>
        </div>
      </div>

      {hasError && (
        <div className="bg-red-950/30 border border-red-900 rounded-lg p-4 text-sm text-red-200">
          일부 시그널 데이터를 불러오지 못했습니다. API 연결 또는 접근 제어 상태를 확인하세요.
        </div>
      )}

      {/* Stats by category */}
      {stats.length > 0 && (
        <div className="rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(17,22,29,0.9),rgba(10,14,19,0.92))] p-5 shadow-[0_28px_70px_rgba(0,0,0,0.2)]">
          <div className="mb-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-zinc-500 mb-2">Category Stats</p>
            <p className="text-sm font-semibold text-zinc-300">카테고리별 통계</p>
            <p className="text-xs text-zinc-600 mt-0.5">표본 배지는 filled 50건 기준이고, G2 상태는 API의 `g2Eligible` / `g2Pass`를 그대로 따른다.</p>
          </div>
          <div className="space-y-3 md:hidden">
            {sortedStats.map((s, i) => (
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
                  <div className="flex flex-wrap items-center gap-2">
                    <div>{categoryCell(s.category)}</div>
                    {sampleBadge(s.filledCount)}
                    {g2Badge(s.g2Eligible, s.g2Pass)}
                  </div>
                  <span className="text-xs text-zinc-500">event {s.eventCount} / filled {s.filledCount}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-zinc-500">방향일치 1d</p>
                    <p className="text-zinc-200">{pctOrDash(s.directionMatch1dRate)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500">방향일치 5d</p>
                    <p className="text-zinc-200">{pctOrDash(s.directionMatch5dRate)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500">α방향일치 1d</p>
                    <p className="text-zinc-200">{pctOrDash(s.alphaDirectionMatch1dRate)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500">α방향일치 5d</p>
                    <p className="text-zinc-200">{pctOrDash(s.alphaDirectionMatch5dRate)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500">α 1d</p>
                    <p className={alphaTextColor(s.avgAlpha1d)}>{pctOrDash(s.avgAlpha1d)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500">α 5d</p>
                    <p className={alphaTextColor(s.avgAlpha5d)}>{pctOrDash(s.avgAlpha5d)}</p>
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
                  <th className="text-right py-2 pr-4">방향일치 1d</th>
                  <th className="text-right py-2 pr-4">방향일치 5d</th>
                  <th className="text-right py-2 pr-4">α방향일치 1d</th>
                  <th className="text-right py-2 pr-4">α방향일치 5d</th>
                  <th className="text-right py-2 pr-4">α 1d</th>
                  <th className="text-right py-2">α 5d</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {sortedStats.map((s, i) => (
                  <tr key={i} className="hover:bg-zinc-800/50">
                    <td className="py-2.5 pr-4">
                      <div className="flex items-center gap-2">
                        {categoryCell(s.category)}
                        {sampleBadge(s.filledCount)}
                        {g2Badge(s.g2Eligible, s.g2Pass)}
                      </div>
                    </td>
                    <td className="py-2.5 pr-4 text-right text-zinc-300">{s.eventCount} / {s.filledCount}</td>
                    <td className="py-2.5 pr-4 text-right text-zinc-300">{pctOrDash(s.directionMatch1dRate)}</td>
                    <td className="py-2.5 pr-4 text-right text-zinc-300">{pctOrDash(s.directionMatch5dRate)}</td>
                    <td className="py-2.5 pr-4 text-right text-zinc-300">{pctOrDash(s.alphaDirectionMatch1dRate)}</td>
                    <td className="py-2.5 pr-4 text-right text-zinc-300">{pctOrDash(s.alphaDirectionMatch5dRate)}</td>
                    <td className={clsx('py-2.5 pr-4 text-right', alphaTextColor(s.avgAlpha1d))}>
                      {pctOrDash(s.avgAlpha1d)}
                    </td>
                    <td className={clsx('py-2.5 text-right', alphaTextColor(s.avgAlpha5d))}>
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
      <div className="rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(16,21,29,0.9),rgba(10,13,19,0.92))] p-5 shadow-[0_28px_70px_rgba(0,0,0,0.2)]">
        <p className="text-sm font-semibold text-zinc-300 mb-4">
          최근 시그널 후보 ({candidates.length}건)
        </p>
        {candidates.length === 0 && (
          <div className="text-sm text-zinc-600 py-8 text-center">표시할 시그널 후보가 없습니다</div>
        )}
        {candidates.length > 0 && <div className="space-y-3 md:hidden">
          {candidates.map((c) => (
            <div key={c.id} className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-white">{c.name}</p>
                  <p className="text-xs text-zinc-500">{c.ticker}</p>
                </div>
                <div className="text-right">
                  <p className={clsx('font-bold', DIRECTION_COLOR[c.impactDirection])}>
                    {c.impactDirection === '+' ? '▲' : '▼'}
                  </p>
                  <p className="text-xs text-zinc-500">{formatSignalDate(c.signalDate)}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {categoryBadge(c.category)}
                <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300">
                  {(c.confidence * 100).toFixed(0)}%
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-xs text-zinc-500">Ret 1d</p>
                  <p className="text-zinc-200">{pctOrDash(c.ret1d)}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Ret 5d</p>
                  <p className="text-zinc-200">{pctOrDash(c.ret5d)}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">α 5d</p>
                  <p className={alphaTextColor(c.alpha5d)}>{pctOrDash(c.alpha5d)}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-sm border-t border-zinc-800 pt-2">
                <div>
                  <p className="text-xs text-zinc-500">RSI(14)</p>
                  <p className={rsiTextColor(c.rsi14)}>{rsiDisplay(c.rsi14)}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">거래량비율</p>
                  <p className={volRatioTextColor(c.volumeRatio)}>{volRatioDisplay(c.volumeRatio)}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">52주고점</p>
                  <p className="text-zinc-300">{high52wDisplay(c.high52wPct)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>}
        {candidates.length > 0 && <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-zinc-500 uppercase border-b border-zinc-800">
                  <th className="text-left py-2 pr-4">종목</th>
                  <th className="text-left py-2 pr-4">카테고리</th>
                  <th className="text-right py-2 pr-4">방향</th>
                  <th className="text-right py-2 pr-4">Conf</th>
                  <th className="text-right py-2 pr-4">Ret 1d</th>
                  <th className="text-right py-2 pr-4">Ret 5d</th>
                  <th className="text-right py-2 pr-4">α 5d</th>
                  <th className="text-right py-2 pr-4">RSI</th>
                  <th className="text-right py-2 pr-4">Vol×</th>
                  <th className="text-right py-2 pr-4">52w%</th>
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
                  <td className="py-2.5 pr-4 text-right text-zinc-300">
                    {pctOrDash(c.ret1d)}
                  </td>
                  <td className="py-2.5 pr-4 text-right text-zinc-300">
                    {pctOrDash(c.ret5d)}
                  </td>
                  <td className={clsx('py-2.5 pr-4 text-right', alphaTextColor(c.alpha5d))}>
                    {pctOrDash(c.alpha5d)}
                  </td>
                  <td className={clsx('py-2.5 pr-4 text-right', rsiTextColor(c.rsi14))}>
                    {rsiDisplay(c.rsi14)}
                  </td>
                  <td className={clsx('py-2.5 pr-4 text-right', volRatioTextColor(c.volumeRatio))}>
                    {volRatioDisplay(c.volumeRatio)}
                  </td>
                  <td className="py-2.5 pr-4 text-right text-zinc-300">
                    {high52wDisplay(c.high52wPct)}
                  </td>
                  <td className="py-2.5 text-right text-zinc-500 text-xs">{formatSignalDate(c.signalDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>}
      </div>
    </div>
  );
}
