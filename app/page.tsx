import { api } from '@/lib/api';
import StatCard from '@/components/StatCard';
import NavChart from '@/components/NavChart';
import { clsx } from 'clsx';

function pct(v: number | null) {
  if (v === null) return '—';
  return (v >= 0 ? '+' : '') + (v * 100).toFixed(2) + '%';
}

function trend(v: number | null): 'up' | 'down' | 'neutral' {
  if (v === null) return 'neutral';
  return v > 0 ? 'up' : v < 0 ? 'down' : 'neutral';
}

function moneyInManwon(v: number) {
  const sign = v > 0 ? '+' : '';
  return `${sign}${(v / 10000).toFixed(0)}만`;
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

export default async function OverviewPage() {
  const [navHistory, perf, bStats] = await Promise.all([
    api.navHistory(60).catch(() => []),
    api.performance().catch(() => null),
    api.bStats().catch(() => null),
  ]);

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
            sub={perf ? `초기 ${(perf.initialNav / 10000).toFixed(0)}만 → 현재 ${(perf.currentNav / 10000).toFixed(0)}만` : undefined}
            trend={perf ? trend(perf.totalReturn) : 'neutral'}
          />
          <StatCard
            label="현재 NAV"
            value={perf ? (perf.currentNav / 1_000_000).toFixed(2) + 'M' : '—'}
            sub="원화"
            trend="neutral"
          />
          <StatCard
            label="MDD"
            value={perf ? pct(perf.maxDrawdown) : '—'}
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
            value={bStats ? moneyInManwon(bStats.closedPnl) : '—'}
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
    </div>
  );
}
