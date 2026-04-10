import { api, SignalTagStats } from '@/lib/api';
import StatCard from '@/components/StatCard';
import NavChart from '@/components/NavChart';
import { clsx } from 'clsx';

function pct(v: number | null) {
  if (v === null) return '—';
  return (v >= 0 ? '+' : '') + (v * 100).toFixed(2) + '%';
}

function drawdownPct(v: number | null) {
  if (v === null) return '—';
  return '-' + (Math.abs(v) * 100).toFixed(2) + '%';
}

function trend(v: number | null): 'up' | 'down' | 'neutral' {
  if (v === null) return 'neutral';
  return v > 0 ? 'up' : v < 0 ? 'down' : 'neutral';
}

function krw(v: number, showSign = false): string {
  const sign = showSign && v > 0 ? '+' : '';
  return `${sign}${v.toLocaleString()}원`;
}

function PortfolioBadge({ type }: { type: 'A' | 'B' }) {
  return (
    <span
      className={clsx(
        'text-xs px-2 py-0.5 rounded-full font-medium',
        type === 'A' && 'bg-zinc-800 text-zinc-300',
        type === 'B' && 'bg-blue-900 text-blue-300',
      )}
    >
      {type}
    </span>
  );
}

// ── G1~G6 게이트 판정 ───────────────────────────────────────────────────────

// 임계값 상수 — plan.md 확정값
const GATE_THRESHOLDS = {
  dm5d: 0.55,          // G2: 55% 이상
  minEventCount: 50,   // G2: 최소 50건
  mdd: 0.30,           // G5: MDD < 30%
  sharpe: 0.5,         // G4: Sharpe ≥ 0.5
  costPerDay: 3.0,     // G6: $3 이하
};

type GateStatus = 'pass' | 'watch' | 'fail' | 'pending';

interface GateInfo {
  id: string;
  label: string;
  target: string;
  status: GateStatus;
  current: string;
  note?: string;
}

function computeGates(
  perf: Awaited<ReturnType<typeof api.performance>> | null,
  signalStats: SignalTagStats[],
  estimatedDailyCostUsd: number | null,
  trades: Awaited<ReturnType<typeof api.trades>>,
): GateInfo[] {
  // G1: Portfolio A 리밸런싱 횟수 — A 포트폴리오 거래가 발생한 고유 날짜 수
  const g1RebalanceDates = new Set(
    trades
      .filter((t) => t.portfolioType === 'A')
      .map((t) => t.tradeDate),
  );
  const g1Count = g1RebalanceDates.size;

  // G2: direction_match_5d ≥ 55% (이벤트 50건 이상 기준)
  const g2Eligible = signalStats.filter(
    (s) => s.eventCount >= GATE_THRESHOLDS.minEventCount,
  );
  const g2Best = g2Eligible.reduce<SignalTagStats | null>(
    (best, s) =>
      s.directionMatch5dRate !== null &&
      (best === null || s.directionMatch5dRate > (best.directionMatch5dRate ?? 0))
        ? s
        : best,
    null,
  );
  const g2Dm = g2Best?.directionMatch5dRate ?? null;
  const bestEventCount = signalStats.reduce((max, s) => Math.max(max, s.eventCount), 0);
  const g2CategoryLabel = g2Best?.category ?? 'UNCLASSIFIED';

  // G3: alpha_5d 평균 ≥ 0 — CONTRACT_WIN 우선, 없으면 전체 평균
  const contractWin = signalStats.find((s) => s.category === 'CONTRACT_WIN');
  const g3Alpha = contractWin?.avgAlpha5d ?? null;

  // G5: MDD
  const mddAbs = perf ? Math.abs(perf.maxDrawdown) : null;

  // G6: 비용
  const cost = estimatedDailyCostUsd;

  return [
    {
      id: 'G1',
      label: '리밸런싱 무결성',
      target: '10회 이상 (SELL/BUY 정상)',
      status: g1Count >= 10 ? 'pass' : g1Count > 0 ? 'watch' : 'pending',
      current: g1Count > 0 ? `${g1Count}회 완료` : '거래 데이터 없음',
    },
    {
      id: 'G2',
      label: '신호 방향일치율 5d',
      target: '≥ 55% (50건 이상)',
      status:
        g2Dm !== null
          ? g2Dm >= GATE_THRESHOLDS.dm5d
            ? 'pass'
            : 'watch'
          : 'watch',
      current:
        g2Dm !== null
          ? `${(g2Dm * 100).toFixed(1)}% (${g2CategoryLabel})`
          : `표본 부족 (최다 ${bestEventCount}건 / 50건 기준)`,
    },
    {
      id: 'G3',
      label: '신호 alpha_5d ≥ 0',
      target: '초과수익률 양수',
      status:
        g3Alpha !== null ? (g3Alpha >= 0 ? 'pass' : 'fail') : 'watch',
      current:
        g3Alpha !== null
          ? `${g3Alpha >= 0 ? '+' : ''}${(g3Alpha * 100).toFixed(2)}% (CONTRACT_WIN)`
          : '데이터 축적 중',
    },
    {
      id: 'G4',
      label: 'Portfolio B Sharpe',
      target: '≥ 0.5 (3개월+)',
      status: 'pending',
      current: 'B NAV 축적 중',
    },
    {
      id: 'G5',
      label: 'MDD',
      target: 'A/B 모두 < 30%',
      status:
        mddAbs !== null
          ? mddAbs < GATE_THRESHOLDS.mdd
            ? 'watch' // B 미집계 → 조건부 watch
            : 'fail'
          : 'pending',
      current:
        mddAbs !== null ? `A: ${(mddAbs * 100).toFixed(1)}%` : '—',
      note: 'Portfolio B MDD 미집계',
    },
    {
      id: 'G6',
      label: '일 비용',
      target: '≤ $3.00',
      status:
        cost !== null
          ? cost <= GATE_THRESHOLDS.costPerDay
            ? 'pass'
            : 'fail'
          : 'pending',
      current: cost !== null ? `$${cost.toFixed(2)}/일` : '—',
    },
  ];
}

const GATE_STATUS_STYLE: Record<GateStatus, { border: string; badge: string; label: string }> = {
  pass:    { border: 'border-emerald-800', badge: 'bg-emerald-900 text-emerald-300', label: '✅ 달성' },
  watch:   { border: 'border-amber-800',   badge: 'bg-amber-900 text-amber-300',     label: '○ 모니터링' },
  fail:    { border: 'border-red-800',     badge: 'bg-red-900 text-red-300',         label: '✗ 미달' },
  pending: { border: 'border-zinc-700',    badge: 'bg-zinc-800 text-zinc-400',       label: '— 집계 대기' },
};

function GateCard({ gate }: { gate: GateInfo }) {
  const style = GATE_STATUS_STYLE[gate.status];
  return (
    <div className={`bg-zinc-900 border rounded-lg p-4 ${style.border}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <span className="text-xs font-bold text-zinc-500">{gate.id}</span>
          <p className="text-sm font-medium text-white leading-tight mt-0.5">{gate.label}</p>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${style.badge}`}>
          {style.label}
        </span>
      </div>
      <p className="text-sm font-semibold text-zinc-200">{gate.current}</p>
      <p className="text-xs text-zinc-600 mt-0.5">목표: {gate.target}</p>
      {gate.note && <p className="text-xs text-zinc-600 mt-1 italic">{gate.note}</p>}
    </div>
  );
}

export default async function OverviewPage() {
  const [navHistory, perf, bStats, signalStats, dashboardStats, trades] = await Promise.all([
    api.navHistory(60).catch(() => []),
    api.performance().catch(() => null),
    api.bStats().catch(() => null),
    api.signalStats().catch(() => []),
    api.dashboardStats().catch(() => null),
    api.trades(5000).catch(() => []),
  ]);

  const gates = computeGates(
    perf,
    signalStats,
    dashboardStats?.summary.estimatedDailyCostUsd ?? null,
    trades,
  );
  const passCount = gates.filter((g) => g.status === 'pass').length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Overview</h2>
        <p className="text-sm text-zinc-500 mt-0.5">Portfolio A/B 요약 및 Portfolio A NAV 추이</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 space-y-4">
        <div className="flex items-center gap-2">
          <PortfolioBadge type="A" />
          <div>
            <p className="text-sm font-semibold text-zinc-200">Portfolio A</p>
            <p className="text-xs text-zinc-500">리밸런싱 기반 성과 요약</p>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="총 수익률"
            value={perf ? pct(perf.totalReturn) : '—'}
            sub={perf ? `초기 ${krw(perf.initialNav)} → 현재 ${krw(perf.currentNav)}` : undefined}
            trend={perf ? trend(perf.totalReturn) : 'neutral'}
          />
          <StatCard
            label="현재 NAV"
            value={perf ? krw(perf.currentNav) : '—'}
            trend="neutral"
          />
          <StatCard
            label="MDD"
            value={perf ? drawdownPct(perf.maxDrawdown) : '—'}
            trend="down"
          />
          <StatCard
            label="샤프 비율"
            value={perf?.sharpeRatio != null ? perf.sharpeRatio.toFixed(2) : '—'}
            trend="neutral"
          />
          <StatCard
            label="벤치마크 대비 (α)"
            value={perf ? pct(perf.alpha) : '—'}
            sub={perf ? `벤치마크 ${pct(perf.benchmarkReturn)}` : undefined}
            trend={perf ? trend(perf.alpha) : 'neutral'}
          />
          <StatCard
            label="승률"
            value={perf?.winRate != null ? (perf.winRate * 100).toFixed(1) + '%' : '—'}
            trend="neutral"
          />
          <StatCard
            label="평균 수익"
            value={perf?.avgWin != null ? pct(perf.avgWin) : '—'}
            trend="up"
          />
          <StatCard
            label="평균 손실"
            value={perf?.avgLoss != null ? pct(perf.avgLoss) : '—'}
            trend="down"
          />
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 space-y-4">
        <div className="flex items-center gap-2">
          <PortfolioBadge type="B" />
          <div>
            <p className="text-sm font-semibold text-zinc-200">Portfolio B</p>
            <p className="text-xs text-zinc-500">신호 기반 롱 요약</p>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="오픈 포지션" value={bStats?.openPositions ?? '—'} trend="neutral" />
          <StatCard label="총 거래 수" value={bStats?.totalTrades ?? '—'} trend="neutral" />
          <StatCard
            label="실현 손익"
            value={bStats ? krw(bStats.closedPnl, true) : '—'}
            trend={bStats ? trend(bStats.closedPnl) : 'neutral'}
          />
          <StatCard
            label="청산 / 손절"
            value={bStats ? `${bStats.closedCount} / ${bStats.stoppedCount}` : '—'}
            sub="closed / stopped"
            trend="neutral"
          />
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <PortfolioBadge type="A" />
          <p className="text-sm font-semibold text-zinc-300">NAV 히스토리 (최근 60일)</p>
        </div>
        {navHistory.length > 0 ? (
          <NavChart data={navHistory} />
        ) : (
          <div className="h-60 flex items-center justify-center text-zinc-600 text-sm">
            데이터 없음
          </div>
        )}
      </div>

      {perf && (
        <div className="text-xs text-zinc-600 space-x-4">
          <span>기간: {perf.startDate} ~ {perf.endDate}</span>
          {perf.cagr != null && <span>CAGR: {pct(perf.cagr)}</span>}
          {perf.profitFactor != null && <span>Profit Factor: {perf.profitFactor.toFixed(2)}</span>}
        </div>
      )}

      {/* G1~G6 실전 전환 게이트 */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-semibold text-zinc-200">실전 전환 게이트 (G1~G6)</p>
            <p className="text-xs text-zinc-600 mt-0.5">6개 조건 모두 충족 시 실전 검토 가능</p>
          </div>
          <span
            className={clsx(
              'text-xs px-2.5 py-1 rounded-full font-semibold',
              passCount >= 6
                ? 'bg-emerald-900 text-emerald-300'
                : passCount >= 3
                  ? 'bg-amber-900 text-amber-300'
                  : 'bg-zinc-800 text-zinc-400',
            )}
          >
            {passCount} / 6 달성
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {gates.map((gate) => (
            <GateCard key={gate.id} gate={gate} />
          ))}
        </div>
      </div>
    </div>
  );
}
