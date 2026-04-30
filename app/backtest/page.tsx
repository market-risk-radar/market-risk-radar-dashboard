import { api, BacktestResult } from '@/lib/api';
import { clsx } from 'clsx';
export const dynamic = 'force-dynamic';

// ── helpers ──────────────────────────────────────────────────────────────────

function pct(v: number | null, digits = 1) {
  if (v === null) return '—';
  return (v >= 0 ? '+' : '') + (v * 100).toFixed(digits) + '%';
}

function alphaColor(v: number | null) {
  if (v === null) return 'text-zinc-500';
  return v >= 0 ? 'text-emerald-400' : 'text-red-400';
}

function num(v: number | null, digits = 2) {
  if (v === null) return '—';
  return (v >= 0 ? '+' : '') + v.toFixed(digits);
}

const CATEGORY_COLOR: Record<string, string> = {
  EARNINGS_BEAT:     'bg-emerald-900 text-emerald-300',
  EARNINGS_MISS:     'bg-red-900 text-red-300',
  CONTRACT_WIN:      'bg-blue-900 text-blue-300',
  CONTRACT_LOSS:     'bg-orange-900 text-orange-300',
  GUIDANCE_UP:       'bg-teal-900 text-teal-300',
  GUIDANCE_DOWN:     'bg-amber-900 text-amber-300',
  REGULATORY_ACTION: 'bg-rose-900 text-rose-300',
  DILUTION:          'bg-purple-900 text-purple-300',
  BUYBACK:           'bg-zinc-700 text-zinc-300',
  M_A:               'bg-indigo-900 text-indigo-300',
};

function CategoryBadge({ cat }: { cat: string }) {
  return (
    <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', CATEGORY_COLOR[cat] ?? 'bg-zinc-800 text-zinc-300')}>
      {cat}
    </span>
  );
}

// ── summary panel ─────────────────────────────────────────────────────────────

function SummaryPanel({ result, label }: { result: BacktestResult; label: string }) {
  const { summary, params } = result;
  const coverage = summary.totalSignals > 0
    ? ((summary.withReturn / summary.totalSignals) * 100).toFixed(0)
    : '—';
  const scopeLabel = params.category ? params.category : '화이트리스트 전체';

  const stats = [
    { label: '총 신호', value: String(summary.totalSignals), sub: `수익률 집계 ${summary.withReturn}건 (${coverage}%)` },
    {
      label: '승률 (α>0)',
      value: pct(summary.winRate, 0),
      color: alphaColor(
        summary.winRate !== null ? summary.winRate - 0.5 : null,
      ),
    },
    { label: '평균 Alpha', value: pct(summary.avgAlpha), color: alphaColor(summary.avgAlpha) },
    { label: '중앙값 Alpha', value: pct(summary.medianAlpha), color: alphaColor(summary.medianAlpha) },
    {
      label: '방향일치율',
      value: pct(summary.directionMatchRate, 0),
      color: alphaColor(
        summary.directionMatchRate !== null
          ? summary.directionMatchRate - 0.5
          : null,
      ),
    },
    { label: 'Sharpe 근사', value: num(summary.sharpeProxy), color: alphaColor(summary.sharpeProxy) },
    { label: 'Max Alpha', value: pct(summary.maxAlpha), color: 'text-emerald-400' },
    { label: 'Min Alpha', value: pct(summary.minAlpha), color: 'text-red-400' },
  ];

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
      <div className="mb-4">
        <p className="text-sm font-semibold text-zinc-300">{label}</p>
        <p className="text-xs text-zinc-600 mt-0.5">
          minConf {params.minConfidence} · minGate1 {params.minGate1} · {scopeLabel}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="bg-zinc-950/60 rounded-lg p-3">
            <p className="text-xs text-zinc-500 mb-1">{s.label}</p>
            <p className={clsx('text-lg font-bold', s.color ?? 'text-zinc-200')}>{s.value}</p>
            {s.sub && <p className="text-xs text-zinc-600 mt-0.5">{s.sub}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── page ─────────────────────────────────────────────────────────────────────

export default async function BacktestPage() {
  const [resCW, resEB] = await Promise.allSettled([
    api.backtest({ holdDays: 5, minConfidence: 0.65, category: 'CONTRACT_WIN' }),
    api.backtest({ holdDays: 1, category: 'EARNINGS_BEAT' }),
  ]);

  const btCW = resCW.status === 'fulfilled' ? resCW.value : null;
  const btEB = resEB.status === 'fulfilled' ? resEB.value : null;
  const hasError = resCW.status === 'rejected' || resEB.status === 'rejected';

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
        <div className="rounded-[28px] border border-white/8 bg-[linear-gradient(135deg,rgba(18,24,32,0.9),rgba(10,13,18,0.88))] px-6 py-6 shadow-[0_32px_80px_rgba(0,0,0,0.24)]">
          <p className="font-mono text-[11px] uppercase tracking-[0.26em] text-orange-200/70">Backtest</p>
          <h2 className="mt-3 text-3xl font-bold text-white">Lightweight strategy probe</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">
            카테고리별 운용 기준으로 signal_candidate × event_return 알파·방향일치율을 점검. EARNINGS_BEAT=D+1, CONTRACT_WIN=D+5 각각 독립 집계.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">EARNINGS_BEAT</p>
            <p className="mt-2 text-3xl font-bold text-white">{btEB?.summary.totalSignals ?? '—'}</p>
            <p className="mt-1 text-xs text-zinc-500">D+1 신호 수</p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">CONTRACT_WIN</p>
            <p className="mt-2 text-3xl font-bold text-white">{btCW?.summary.totalSignals ?? '—'}</p>
            <p className="mt-1 text-xs text-zinc-500">D+5 신호 수</p>
          </div>
        </div>
      </div>

      {hasError && (
        <div className="bg-red-950/30 border border-red-900 rounded-lg p-4 text-sm text-red-200">
          일부 백테스트 데이터를 불러오지 못했습니다. API 연결 상태를 확인하세요.
        </div>
      )}

      {/* 슬리피지 미반영 경고 */}
      {(btCW?.note ?? btEB?.note) && (
        <div className="rounded-lg border border-amber-800/60 bg-amber-950/20 px-4 py-3 text-xs text-amber-300/80">
          <span className="font-semibold text-amber-300">주의 — </span>
          {btCW?.note ?? btEB?.note}
        </div>
      )}

      {/* 해석 가이드 */}
      <div className="rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(17,22,29,0.74),rgba(10,14,19,0.78))] px-4 py-4 text-xs text-zinc-500 space-y-1 shadow-[0_24px_60px_rgba(0,0,0,0.18)]">
        <p><span className="text-zinc-400 font-medium">해석 원칙:</span> alpha &gt; 0 + 방향일치율 55%+ 달성 카테고리만 신호 유효. 카테고리별 운용 horizon(D+1 vs D+5)이 다르므로 각 패널을 독립적으로 판단한다.</p>
        <p><span className="text-zinc-400 font-medium">현재 기준:</span> EARNINGS_BEAT → D+1 단기 반응 (alpha_5d 음수, mean reversion 40.9% 확인). CONTRACT_WIN → D+5 (minConf 0.65, 실제 운용 기준)</p>
      </div>

      {/* CONTRACT_WIN 실제 운용 기준 패널 */}
      <div>
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">
          CONTRACT_WIN 실제 운용 기준 (minConf 0.65 · D+5)
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {btCW ? (
            <SummaryPanel result={btCW} label="CONTRACT_WIN — Portfolio B 동일 조건" />
          ) : (
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 flex items-center justify-center text-zinc-600 text-sm">
              CONTRACT_WIN 데이터 없음
            </div>
          )}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-5 text-xs text-zinc-500 space-y-2 flex flex-col justify-center">
            <p className="text-zinc-300 font-medium text-sm">왜 별도 확인이 필요한가</p>
            <p>Portfolio B는 DART CONTRACT_WIN 공시에 한해 <span className="text-zinc-300">minConf 0.65</span>로 진입 허용.</p>
            <p>전체 화이트리스트 패널(minConf 0.75)은 CONTRACT_WIN 표본을 과소 계상해 결과가 왜곡될 수 있음.</p>
            <p>이 패널이 실제 Portfolio B 운용 규칙과 정합적인 검증 기준이다.</p>
          </div>
        </div>
      </div>

      {/* EARNINGS_BEAT 실제 운용 기준 패널 */}
      <div>
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">
          EARNINGS_BEAT 실제 운용 기준 (minConf 0.75 · D+1)
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {btEB ? (
            <SummaryPanel result={btEB} label="EARNINGS_BEAT — Portfolio B 동일 조건" />
          ) : (
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 flex items-center justify-center text-zinc-600 text-sm">
              EARNINGS_BEAT 데이터 없음
            </div>
          )}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-5 text-xs text-zinc-500 space-y-2 flex flex-col justify-center">
            <p className="text-zinc-300 font-medium text-sm">D+1 단기 반응 전략 근거</p>
            <p>실증 데이터: EARNINGS_BEAT <span className="text-zinc-300">alpha_1d +1.16%</span> vs alpha_5d −0.94%.</p>
            <p>D+5 구간에서 KOSPI 벤치마크에 밀리는 패턴 확인 → <span className="text-zinc-300">2026-04-15 holdDays 5→1 변경</span>.</p>
            <p>방향은 맞지만(dm 66%) 절대 수익보다 초과수익(alpha)이 핵심 — D+1 포착이 효율적.</p>
          </div>
        </div>
      </div>

    </div>
  );
}
