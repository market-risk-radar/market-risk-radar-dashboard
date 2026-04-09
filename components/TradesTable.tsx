'use client';

import { useState } from 'react';
import { clsx } from 'clsx';
import type { PaperTrade } from '@/lib/api';

type PortfolioFilter = 'ALL' | 'A' | 'B';

const FILTERS: Array<{ value: PortfolioFilter; label: string }> = [
  { value: 'ALL', label: '전체' },
  { value: 'A', label: 'Portfolio A' },
  { value: 'B', label: 'Portfolio B' },
];

function formatAmount(amount: number) {
  return `${(amount / 10000).toFixed(0)}만`;
}

export default function TradesTable({ trades }: { trades: PaperTrade[] }) {
  const [filter, setFilter] = useState<PortfolioFilter>('ALL');

  const filteredTrades = trades.filter((trade) => {
    if (filter === 'ALL') return true;
    return trade.portfolioType === filter;
  });

  const buyCount = filteredTrades.filter((trade) => trade.side === 'BUY').length;
  const sellCount = filteredTrades.filter((trade) => trade.side === 'SELL').length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setFilter(item.value)}
              className={clsx(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors border',
                filter === item.value
                  ? 'bg-blue-600 text-white border-blue-500'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white hover:bg-zinc-800',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="text-xs text-zinc-500">
          {filteredTrades.length}건 · BUY {buyCount} · SELL {sellCount}
        </div>
      </div>

      {filteredTrades.length === 0 ? (
        <div className="border border-dashed border-zinc-800 rounded-lg py-10 text-center text-sm text-zinc-600">
          표시할 거래가 없습니다
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-zinc-500 uppercase border-b border-zinc-800">
                <th className="text-left py-2 pr-4">포트폴리오</th>
                <th className="text-left py-2 pr-4">종목</th>
                <th className="text-left py-2 pr-4">구분</th>
                <th className="text-right py-2 pr-4">수량</th>
                <th className="text-right py-2 pr-4">체결가</th>
                <th className="text-right py-2 pr-4">금액</th>
                <th className="text-right py-2">거래일</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filteredTrades.map((trade) => (
                <tr key={trade.id} className="hover:bg-zinc-800/50 transition-colors">
                  <td className="py-2.5 pr-4">
                    <span
                      className={clsx(
                        'text-xs px-2 py-0.5 rounded-full font-medium',
                        trade.portfolioType === 'A' && 'bg-zinc-800 text-zinc-300',
                        trade.portfolioType === 'B' && 'bg-blue-900 text-blue-300',
                      )}
                    >
                      {trade.portfolioType}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4">
                    <p className="font-medium text-white">{trade.ticker}</p>
                  </td>
                  <td className="py-2.5 pr-4">
                    <span
                      className={clsx(
                        'text-xs px-2 py-0.5 rounded-full font-medium',
                        trade.side === 'BUY' && 'bg-emerald-950 text-emerald-300',
                        trade.side === 'SELL' && 'bg-red-950 text-red-300',
                      )}
                    >
                      {trade.side}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4 text-right text-zinc-300">
                    {trade.qty.toLocaleString()}
                  </td>
                  <td className="py-2.5 pr-4 text-right text-zinc-300">
                    {trade.fillPrice.toLocaleString()}원
                  </td>
                  <td className="py-2.5 pr-4 text-right text-zinc-300">
                    {formatAmount(trade.amount)}
                  </td>
                  <td className="py-2.5 text-right text-zinc-500 text-xs">
                    {trade.tradeDate}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
