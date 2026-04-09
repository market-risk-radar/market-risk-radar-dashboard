'use client';

import { useState } from 'react';
import { PaperTrade } from '@/lib/api';
import { clsx } from 'clsx';

type Filter = 'ALL' | 'A' | 'B';

export function TradesTable({ trades }: { trades: PaperTrade[] }) {
  const [filter, setFilter] = useState<Filter>('ALL');

  const filtered =
    filter === 'ALL' ? trades : trades.filter((t) => t.portfolioType === filter);

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex gap-2">
        {(['ALL', 'A', 'B'] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={clsx(
              'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
              filter === f
                ? f === 'B'
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-600 text-white'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-700',
            )}
          >
            {f === 'ALL' ? '전체' : `Portfolio ${f}`}
          </button>
        ))}
        <span className="ml-auto text-xs text-zinc-600 self-center">
          {filtered.length}건
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-zinc-500 uppercase border-b border-zinc-800">
              <th className="text-left py-2 pr-4">종목</th>
              <th className="text-right py-2 pr-4">구분</th>
              <th className="text-right py-2 pr-4">방향</th>
              <th className="text-right py-2 pr-4">수량</th>
              <th className="text-right py-2 pr-4">체결가</th>
              <th className="text-right py-2 pr-4">금액</th>
              <th className="text-right py-2">거래일</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-zinc-600">
                  거래 내역 없음
                </td>
              </tr>
            ) : (
              filtered.map((t) => (
                <tr key={t.id} className="hover:bg-zinc-800/50 transition-colors">
                  <td className="py-2.5 pr-4 font-medium text-white">{t.ticker}</td>
                  <td className="py-2.5 pr-4 text-right">
                    <span
                      className={clsx(
                        'text-xs px-1.5 py-0.5 rounded font-medium',
                        t.portfolioType === 'B'
                          ? 'bg-blue-900 text-blue-300'
                          : 'bg-zinc-800 text-zinc-400',
                      )}
                    >
                      {t.portfolioType}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4 text-right">
                    <span
                      className={clsx(
                        'text-xs font-bold',
                        t.side === 'BUY' ? 'text-emerald-400' : 'text-red-400',
                      )}
                    >
                      {t.side}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4 text-right text-zinc-300">
                    {t.qty.toLocaleString()}
                  </td>
                  <td className="py-2.5 pr-4 text-right text-zinc-300">
                    {t.fillPrice.toLocaleString()}원
                  </td>
                  <td className="py-2.5 pr-4 text-right text-zinc-300">
                    {(t.amount / 10000).toFixed(0)}만
                  </td>
                  <td className="py-2.5 text-right text-zinc-500 text-xs">{t.tradeDate}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
