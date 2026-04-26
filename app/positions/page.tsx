import { api, PaperPosition } from '@/lib/api';
import StatCard from '@/components/StatCard';
import { clsx } from 'clsx';

export const dynamic = 'force-dynamic';

// ── Portfolio A 테이블 ────────────────────────────────────────────────────────
function PositionTableA({ positions }: { positions: PaperPosition[] }) {
  if (positions.length === 0) {
    return <div className="text-sm text-zinc-600 py-8 text-center">보유 포지션 없음</div>;
  }
  return (
    <>
      <div className="space-y-3 md:hidden">
        {positions.map((p) => (
          <div key={p.rowKey} className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4 space-y-3">
            <div>
              <p className="font-medium text-white">{p.name || p.ticker}</p>
              <p className="text-xs text-zinc-500">{p.ticker}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-zinc-500">수량</p>
                <p className="text-zinc-200">{p.qty.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">기준단가</p>
                <p className="text-zinc-200">{p.avgPrice.toLocaleString()}원</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">평가금액</p>
                <p className="text-zinc-200">{(p.qty * p.avgPrice).toLocaleString()}원</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">기준일</p>
                <p className="text-zinc-400">{p.asOfDate}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="hidden md:block overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-zinc-500 uppercase border-b border-zinc-800">
            <th className="text-left py-2 pr-4">종목</th>
            <th className="text-right py-2 pr-4">수량</th>
            <th className="text-right py-2 pr-4">기준단가</th>
            <th className="text-right py-2 pr-4">평가금액</th>
            <th className="text-right py-2">기준일</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {positions.map((p) => (
            <tr key={p.rowKey} className="hover:bg-zinc-800/50 transition-colors">
              <td className="py-2.5 pr-4">
                <p className="font-medium text-white">{p.name || p.ticker}</p>
                <p className="text-xs text-zinc-500">{p.ticker}</p>
              </td>
              <td className="py-2.5 pr-4 text-right text-zinc-300">{p.qty.toLocaleString()}</td>
              <td className="py-2.5 pr-4 text-right text-zinc-300">
                {p.avgPrice.toLocaleString()}원
              </td>
              <td className="py-2.5 pr-4 text-right text-zinc-300">
                {(p.qty * p.avgPrice).toLocaleString()}원
              </td>
              <td className="py-2.5 text-right text-zinc-500 text-xs">{p.asOfDate}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </>
  );
}

// ── Portfolio B 테이블 ────────────────────────────────────────────────────────
function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const target = new Date(`${dateStr}T00:00:00+09:00`);
  const todayKst = new Date(
    new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' }) + 'T00:00:00+09:00',
  );
  return Math.round((target.getTime() - todayKst.getTime()) / (1000 * 60 * 60 * 24));
}

function PositionTableB({ positions }: { positions: PaperPosition[] }) {
  if (positions.length === 0) {
    return <div className="text-sm text-zinc-600 py-8 text-center">오픈 포지션 없음</div>;
  }
  return (
    <>
      <div className="space-y-3 md:hidden">
        {positions.map((p) => {
          const remaining = daysUntil(p.targetExitDate);
          return (
            <div key={p.rowKey} className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-white">{p.name || p.ticker}</p>
                  <p className="text-xs text-zinc-500">{p.ticker}</p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-900 text-blue-300 font-medium">
                  {p.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-zinc-500">진입가(slip포함)</p>
                  <p className="text-zinc-200">{p.avgPrice.toLocaleString()}원</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">손절가</p>
                  <p className={p.stopLossPrice != null ? 'text-red-400' : 'text-zinc-600'}>
                    {p.stopLossPrice != null ? `${p.stopLossPrice.toLocaleString()}원` : '—'}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-zinc-500">청산 예정</p>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-zinc-300">{p.targetExitDate ?? '—'}</p>
                    {remaining !== null && (
                      <p className={clsx('text-xs', remaining <= 1 ? 'text-amber-400' : 'text-zinc-600')}>
                        D{remaining >= 0 ? `-${remaining}` : `+${Math.abs(remaining)}`}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="hidden md:block overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-zinc-500 uppercase border-b border-zinc-800">
            <th className="text-left py-2 pr-4">종목</th>
            <th className="text-right py-2 pr-4">진입가(slip포함)</th>
            <th className="text-right py-2 pr-4">손절가</th>
            <th className="text-right py-2 pr-4">청산 예정</th>
            <th className="text-right py-2">상태</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {positions.map((p) => {
            const remaining = daysUntil(p.targetExitDate);
            return (
              <tr key={p.rowKey} className="hover:bg-zinc-800/50 transition-colors">
                <td className="py-2.5 pr-4">
                  <p className="font-medium text-white">{p.name || p.ticker}</p>
                  <p className="text-xs text-zinc-500">{p.ticker}</p>
                </td>
                <td className="py-2.5 pr-4 text-right text-zinc-300">
                  {p.avgPrice.toLocaleString()}원
                </td>
                <td className="py-2.5 pr-4 text-right">
                  {p.stopLossPrice != null ? (
                    <span className="text-red-400">{p.stopLossPrice.toLocaleString()}원</span>
                  ) : (
                    <span className="text-zinc-600">—</span>
                  )}
                </td>
                <td className="py-2.5 pr-4 text-right">
                  <div>
                    <p className="text-zinc-300 text-xs">{p.targetExitDate ?? '—'}</p>
                    {remaining !== null && (
                      <p
                        className={clsx(
                          'text-xs mt-0.5',
                          remaining <= 1 ? 'text-amber-400' : 'text-zinc-600',
                        )}
                      >
                        D{remaining >= 0 ? `-${remaining}` : `+${Math.abs(remaining)}`}
                      </p>
                    )}
                  </div>
                </td>
                <td className="py-2.5 text-right">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-900 text-blue-300 font-medium">
                    {p.status}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
    </>
  );
}

export default async function PositionsPage() {
  const [aPositions, bPositions, bStats] = await Promise.all([
    api.positions().catch(() => []),
    api.bPositions().catch(() => []),
    api.bStats().catch(() => null),
  ]);

  const openA = aPositions.filter((p) => p.status === 'OPEN');
  const totalA = openA.reduce((s, p) => s + p.qty * p.avgPrice, 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
        <div className="rounded-[28px] border border-white/8 bg-[linear-gradient(135deg,rgba(18,24,32,0.9),rgba(10,13,18,0.88))] px-6 py-6 shadow-[0_32px_80px_rgba(0,0,0,0.24)]">
          <p className="font-mono text-[11px] uppercase tracking-[0.26em] text-orange-200/70">Positions</p>
          <h2 className="mt-3 text-3xl font-bold text-white">Open exposure monitor</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">
            Portfolio A 리밸런싱 포지션과 Portfolio B 신호 기반 포지션을 동시에 확인하는 화면.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">A Open</p>
            <p className="mt-2 text-3xl font-bold text-white">{openA.length}</p>
            <p className="mt-1 text-xs text-zinc-500">Portfolio A 오픈 종목 수</p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">B Open</p>
            <p className="mt-2 text-3xl font-bold text-white">{bStats?.openPositions ?? bPositions.length}</p>
            <p className="mt-1 text-xs text-zinc-500">Portfolio B 오픈 종목 수</p>
          </div>
        </div>
      </div>

      {/* Portfolio A */}
      <div className="rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(17,22,29,0.9),rgba(10,14,19,0.92))] p-5 shadow-[0_28px_70px_rgba(0,0,0,0.2)]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.22em] text-zinc-500">Portfolio A</p>
            <p className="text-sm font-semibold text-white">Portfolio A</p>
            <p className="text-xs text-zinc-500">리밸런싱 기반</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-white">{(totalA / 1_000_000).toFixed(2)}M</p>
            <p className="text-xs text-zinc-500">{openA.length}종목</p>
          </div>
        </div>
        <PositionTableA positions={openA} />
      </div>

      {/* Portfolio B */}
      <div className="rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(17,22,29,0.9),rgba(10,14,19,0.92))] p-5 shadow-[0_28px_70px_rgba(0,0,0,0.2)]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.22em] text-zinc-500">Portfolio B</p>
            <p className="text-sm font-semibold text-white">Portfolio B</p>
            <p className="text-xs text-zinc-500">신호 기반 롱 · D+5 기계적 청산 · -10% 손절</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-white">{bPositions.length}종목</p>
          </div>
        </div>

        {bStats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <StatCard label="오픈 포지션" value={bStats.openPositions} trend="neutral" />
            <StatCard label="총 거래 수" value={bStats.totalTrades} trend="neutral" />
            <StatCard
              label="실현 손익"
              value={(bStats.closedPnl >= 0 ? '+' : '') + bStats.closedPnl.toLocaleString() + '원'}
              trend={bStats.closedPnl >= 0 ? 'up' : 'down'}
            />
            <StatCard label="손절 횟수" value={bStats.stoppedCount} trend="neutral" />
          </div>
        )}

        <PositionTableB positions={bPositions} />
      </div>
    </div>
  );
}
