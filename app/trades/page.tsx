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
    totalAmount: 0,
    buyAmount: 0,
    sellAmount: 0,
    netAmount: 0,
  }));
  const trades = result.items;
  const totalPages = Math.max(Math.ceil(result.total / result.limit), 1);
  const netAmountTone =
    result.netAmount > 0 ? 'text-emerald-400' : result.netAmount < 0 ? 'text-red-400' : 'text-white';

  const buyCount = trades.filter((trade) => trade.side === 'BUY').length;
  const sellCount = trades.filter((trade) => trade.side === 'SELL').length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
        <div className="rounded-[28px] border border-white/8 bg-[linear-gradient(135deg,rgba(18,24,32,0.9),rgba(10,13,18,0.88))] px-6 py-6 shadow-[0_32px_80px_rgba(0,0,0,0.24)]">
          <p className="font-mono text-[11px] uppercase tracking-[0.26em] text-orange-200/70">Trades</p>
          <h2 className="mt-3 text-3xl font-bold text-white">Execution history board</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">
            Portfolio A/B 체결 이력과 순매수 흐름을 확인하는 거래 히스토리 화면.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">Page</p>
            <p className="mt-2 text-3xl font-bold text-white">{result.page}</p>
            <p className="mt-1 text-xs text-zinc-500">현재 페이지 / {totalPages}</p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">Window</p>
            <p className="mt-2 text-3xl font-bold text-white">{result.limit}</p>
            <p className="mt-1 text-xs text-zinc-500">페이지당 조회 건수</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
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
          <p className="text-2xl font-bold text-white">{result.totalAmount.toLocaleString()}원</p>
          <p className="text-xs text-zinc-500 mt-1">전체 체결 기준, 매수+매도 합계</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">순매수 금액</p>
          <p className={`text-2xl font-bold ${netAmountTone}`}>
            {result.netAmount > 0 ? '+' : ''}
            {result.netAmount.toLocaleString()}원
          </p>
          <p className="text-xs text-zinc-500 mt-1">전체 체결 기준, 매수-매도 차이</p>
        </div>
      </div>

      <div className="rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(17,22,29,0.9),rgba(10,14,19,0.92))] p-5 shadow-[0_28px_70px_rgba(0,0,0,0.2)]">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.22em] text-zinc-500">Trade Tape</p>
            <p className="text-sm font-semibold text-zinc-300">거래 히스토리</p>
          </div>
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
