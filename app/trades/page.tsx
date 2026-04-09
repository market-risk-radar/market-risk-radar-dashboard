import { api } from '@/lib/api';
import { TradesTable } from './TradesTable';

export default async function TradesPage() {
  const trades = await api.trades(100).catch(() => []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Trades</h2>
        <p className="text-sm text-zinc-500 mt-0.5">체결 내역 (최근 100건)</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
        <TradesTable trades={trades} />
      </div>
    </div>
  );
}
