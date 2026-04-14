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

function sampleStatus(eventCount: number): 'ok' | 'low' {
  return eventCount >= MIN_SAMPLE_EVENTS ? 'ok' : 'low';
}

function sampleBadge(eventCount: number) {
  const status = sampleStatus(eventCount);
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

function pctOrDash(v: number | null) {
  if (v === null) return '—';
  return (v >= 0 ? '+' : '') + (v * 100).toFixed(1) + '%';
}

function alphaTextColor(v: number | null) {
  if (v === null) return 'text-zinc-500';
  return v >= 0 ? 'text-emerald-400' : 'text-red-400';
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
  const hasError =
    candidatesResult.status === 'rejected' || statsResult.status === 'rejected';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Signals</h2>
        <p className="text-sm text-zinc-500 mt-0.5">signal_candidate 목록 및 카테고리 통계</p>
      </div>

      {hasError && (
        <div className="bg-red-950/30 border border-red-900 rounded-lg p-4 text-sm text-red-200">
          일부 시그널 데이터를 불러오지 못했습니다. API 연결 또는 접근 제어 상태를 확인하세요.
        </div>
      )}

      {/* Stats by category */}
      {stats.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
          <div className="mb-4">
            <p className="text-sm font-semibold text-zinc-300">카테고리별 통계</p>
            <p className="text-xs text-zinc-600 mt-0.5">방향일치율과 alpha 해석은 기본적으로 표본 50건 이상을 기준으로 본다.</p>
          </div>
          <div className="space-y-3 md:hidden">
            {stats.map((s, i) => (
              <div
                key={i}
                className={clsx(
                  'rounded-lg border p-4 space-y-3',
                  sampleStatus(s.eventCount) === 'ok'
                    ? 'border-zinc-800 bg-zinc-950/60'
                    : 'border-amber-800/80 bg-amber-950/20',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <div>{s.category ? categoryBadge(s.category) : <span className="text-zinc-600">—</span>}</div>
                    {sampleBadge(s.eventCount)}
                  </div>
                  <span className="text-xs text-zinc-500">{s.eventCount}건</span>
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
                  <th className="text-right py-2 pr-4">α 1d</th>
                  <th className="text-right py-2">α 5d</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {stats.map((s, i) => (
                  <tr key={i} className="hover:bg-zinc-800/50">
                    <td className="py-2.5 pr-4">
                      <div className="flex items-center gap-2">
                        {s.category ? categoryBadge(s.category) : <span className="text-zinc-600">—</span>}
                        {sampleBadge(s.eventCount)}
                      </div>
                    </td>
                    <td className="py-2.5 pr-4 text-right text-zinc-300">{s.eventCount}</td>
                    <td className="py-2.5 pr-4 text-right text-zinc-300">{pctOrDash(s.directionMatch1dRate)}</td>
                    <td className="py-2.5 pr-4 text-right text-zinc-300">{pctOrDash(s.directionMatch5dRate)}</td>
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
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
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
                  <th className="text-right py-2 pr-4">Confidence</th>
                  <th className="text-right py-2 pr-4">Ret 1d</th>
                  <th className="text-right py-2 pr-4">Ret 5d</th>
                  <th className="text-right py-2 pr-4">α 5d</th>
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
