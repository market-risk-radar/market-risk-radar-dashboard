import Link from 'next/link';
import { api } from '@/lib/api';
import Pagination from '@/components/Pagination';
import TradesTable from '@/components/TradesTable';

const LIMIT_OPTIONS = [50, 100, 200] as const;

function parseLimit(input: string | undefined) {
  const n = Number(input);
  return LIMIT_OPTIONS.includes(n as (typeof LIMIT_OPTIONS)[number]) ? n : 100;
}

function parsePage(input: string | undefined) {
  const n = Number(input);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
}

export default async function TradesPage({
  searchParams,
}: {
  searchParams?: Promise<{ limit?: string; page?: string }>;
}) {
  const params = await searchParams;
  const limit = parseLimit(params?.limit);
  const page = parsePage(params?.page);
  const result = await api.trades(limit, page).catch(() => ({
    items: [],
    total: 0,
    page,
    limit,
    hasNext: false,
  }));
  const trades = result.items;
  const totalPages = Math.max(Math.ceil(result.total / result.limit), 1);

  const buyCount = trades.filter((trade) => trade.side === 'BUY').length;
  const sellCount = trades.filter((trade) => trade.side === 'SELL').length;
  const totalAmount = trades.reduce((sum, trade) => sum + trade.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Trades</h2>
        <p className="text-sm text-zinc-500 mt-0.5">최근 체결 내역과 Portfolio A/B 필터, 조회 건수 선택</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">최근 체결</p>
          <p className="text-2xl font-bold text-white">{trades.length}</p>
          <p className="text-xs text-zinc-500 mt-1">
            {result.total.toLocaleString()}건 중 {result.page} / {totalPages} 페이지
          </p>
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
          <p className="text-2xl font-bold text-white">{totalAmount.toLocaleString()}원</p>
          <p className="text-xs text-zinc-500 mt-1">현재 페이지 {trades.length}건 합계</p>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-zinc-300">거래 히스토리</p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">조회 건수</span>
            {LIMIT_OPTIONS.map((option) => {
              const active = option === limit;
              return (
                <Link
                  key={option}
                  href={`/trades?limit=${option}&page=1`}
                  className={
                    active
                      ? 'rounded-md border border-blue-500 bg-blue-600 px-3 py-1.5 text-xs font-medium text-white'
                      : 'rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:bg-zinc-800 hover:text-white'
                  }
                >
                  {option}
                </Link>
              );
            })}
          </div>
        </div>
        <TradesTable trades={trades} />
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-zinc-800 pt-4">
          <p className="text-xs text-zinc-500">
            전체 {result.total.toLocaleString()}건 · 페이지 {result.page} / {totalPages}
          </p>
          <Pagination
            page={result.page}
            totalPages={totalPages}
            buildHref={(pageNumber) => `/trades?limit=${result.limit}&page=${pageNumber}`}
          />
        </div>
      </div>
    </div>
  );
}
