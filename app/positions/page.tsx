import { api, PaperPosition } from '@/lib/api';
import StatCard from '@/components/StatCard';
import { clsx } from 'clsx';

// ── Portfolio A 테이블 ────────────────────────────────────────────────────────
function PositionTableA({ positions }: { positions: PaperPosition[] }) {
  if (positions.length === 0) {
    return <div className="text-sm text-zinc-600 py-8 text-center">보유 포지션 없음</div>;
  }
  return (
    <>
      <div className="space-y-3 md:hidden">
        {positions.map((p) => (
          <div key={p.id} className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4 space-y-3">
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
            <tr key={p.id} className="hover:bg-zinc-800/50 transition-colors">
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
  const target = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
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
            <div key={p.id} className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4 space-y-3">
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
                  <p className="text-xs text-zinc-500">진입가</p>
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
            <th className="text-right py-2 pr-4">진입가</th>
            <th className="text-right py-2 pr-4">손절가</th>
            <th className="text-right py-2 pr-4">청산 예정</th>
            <th className="text-right py-2">상태</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {positions.map((p) => {
            const remaining = daysUntil(p.targetExitDate);
            return (
              <tr key={p.id} className="hover:bg-zinc-800/50 transition-colors">
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
      <div>
        <h2 className="text-xl font-bold text-white">Positions</h2>
        <p className="text-sm text-zinc-500 mt-0.5">Portfolio A / B 보유 현황</p>
      </div>

      {/* Portfolio A */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
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
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
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
