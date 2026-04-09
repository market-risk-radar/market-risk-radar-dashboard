import { api } from '@/lib/api';
import TradesTable from '@/components/TradesTable';

function formatAmount(amount: number) {
  return `${(amount / 10000).toFixed(0)}만`;
}

export default async function TradesPage() {
  const trades = await api.trades(100).catch(() => []);

  const buyCount = trades.filter((trade) => trade.side === 'BUY').length;
  const sellCount = trades.filter((trade) => trade.side === 'SELL').length;
  const totalAmount = trades.reduce((sum, trade) => sum + trade.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Trades</h2>
        <p className="text-sm text-zinc-500 mt-0.5">최근 체결 내역과 Portfolio A/B 필터</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">최근 체결</p>
          <p className="text-2xl font-bold text-white">{trades.length}</p>
          <p className="text-xs text-zinc-500 mt-1">최근 100건 기준</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">BUY</p>
          <p className="text-2xl font-bold text-emerald-400">{buyCount}</p>
          <p className="text-xs text-zinc-500 mt-1">매수 체결 수</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">SELL</p>
          <p className="text-2xl font-bold text-red-400">{sellCount}</p>
          <p className="text-xs text-zinc-500 mt-1">매도 체결 수</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">총 체결 금액</p>
          <p className="text-2xl font-bold text-white">{formatAmount(totalAmount)}</p>
          <p className="text-xs text-zinc-500 mt-1">최근 100건 합계</p>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
        <p className="text-sm font-semibold text-zinc-300 mb-4">거래 히스토리</p>
        <TradesTable trades={trades} />
      </div>
    </div>
  );
}
