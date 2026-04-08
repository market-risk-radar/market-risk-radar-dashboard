import { api, PaperPosition } from '@/lib/api';
import StatCard from '@/components/StatCard';
import { clsx } from 'clsx';

function pct(v: number) {
  return (v >= 0 ? '+' : '') + v.toFixed(2) + '%';
}

function PositionTable({ positions }: { positions: PaperPosition[] }) {
  if (positions.length === 0) {
    return (
      <div className="text-sm text-zinc-600 py-8 text-center">보유 포지션 없음</div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-zinc-500 uppercase border-b border-zinc-800">
            <th className="text-left py-2 pr-4">종목</th>
            <th className="text-right py-2 pr-4">수량</th>
            <th className="text-right py-2 pr-4">평균단가</th>
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
                {(p.qty * p.avgPrice / 10000).toFixed(0)}만
              </td>
              <td className="py-2.5 text-right text-zinc-500 text-xs">{p.asOfDate}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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
        <PositionTable positions={openA} />
      </div>

      {/* Portfolio B */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-semibold text-white">Portfolio B</p>
            <p className="text-xs text-zinc-500">신호 기반 롱</p>
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
              value={(bStats.closedPnl / 10000).toFixed(0) + '만'}
              trend={bStats.closedPnl >= 0 ? 'up' : 'down'}
            />
            <StatCard label="손절 횟수" value={bStats.stoppedCount} trend="neutral" />
          </div>
        )}

        <PositionTable positions={bPositions} />
      </div>
    </div>
  );
}
