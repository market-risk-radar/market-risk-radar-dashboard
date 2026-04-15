const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

const n = (v: unknown) => (v == null ? 0 : Number(v));
const nNull = (v: unknown) => (v == null ? null : Number(v));

const CF_HEADERS: HeadersInit =
  process.env.CF_ACCESS_CLIENT_ID && process.env.CF_ACCESS_CLIENT_SECRET
    ? {
        'CF-Access-Client-Id': process.env.CF_ACCESS_CLIENT_ID,
        'CF-Access-Client-Secret': process.env.CF_ACCESS_CLIENT_SECRET,
      }
    : {};

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    next: { revalidate: 30 },
    headers: CF_HEADERS,
  });
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}`);
  return res.json();
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface PortfolioNav {
  id: number;
  portfolioType: string;
  navDate: string;
  totalNav: number;
  equityValue: number;
  cashValue: number;
  dailyReturn: number | null;
  createdAt: string;
}

export interface BenchmarkNavPoint {
  navDate: string;
  totalNav: number;
  closePrice: number;
  dailyReturn: number | null;
}

export interface Performance {
  initialized: boolean;
  startDate: string;
  endDate: string;
  initialNav: number;
  currentNav: number;
  totalReturn: number;
  cagr: number | null;
  sharpeRatio: number | null;
  maxDrawdown: number;
  winRate: number | null;
  avgWin: number | null;
  avgLoss: number | null;
  profitFactor: number | null;
  tradingDays: number;
  benchmarkReturn: number | null;
  alpha: number | null;
}

export interface PaperPosition {
  rowKey: string;
  ticker: string;
  name: string;
  qty: number;
  avgPrice: number;
  portfolioType: string;
  asOfDate: string;
  status: string;
  targetExitDate: string | null;
  stopLossPrice: number | null;
  createdAt: string;
}

export interface PaperTrade {
  id: number;
  ticker: string;
  name: string;
  side: 'BUY' | 'SELL';
  qty: number;
  fillPrice: number;
  amount: number;
  tradeDate: string;
  portfolioType: string;
  createdAt: string;
}

export interface PaginatedTrades {
  items: PaperTrade[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  totalAmount: number;
  buyAmount: number;
  sellAmount: number;
  netAmount: number;
}

export interface SignalCandidate {
  id: number;
  sourceItemId: string;
  ticker: string;
  name: string;
  signalDate: string;
  category: string;
  rawTag: string;
  impactDirection: '+' | '-';
  confidence: number;
  gate1Score: number;
  signalScore: number;
  ret1d: number | null;
  ret5d: number | null;
  alpha5d: number | null;
  createdAt: string;
}

export interface SignalTagStats {
  category: string | null;
  rawTags: string[];
  eventCount: number;
  directionMatch1dRate: number | null;
  directionMatch5dRate: number | null;
  avgAlpha1d: number | null;
  avgAlpha5d: number | null;
  avgAlpha20d: number | null;
  avgRet1d: number | null;
  avgRet5d: number | null;
}

export interface AlertStats {
  total: number;
  sent: number;
  failed: number;
  avgImpactScore: number;
}

export interface RecentAlert {
  alertId: string;
  sourceItemId: string;
  sourceType: string;
  title: string;
  url: string | null;
  publishedAt: string;
  relatedTickers: string[];
  relatedSectors: string[];
  impactScore: number;
  sectorCode: string;
  slackChannelId: string;
  slackChannelName: string | null;
  latestDeliveryStatus: 'SENT' | 'FAILED' | 'RETRIED' | 'PENDING';
  latestDeliveryError: string | null;
  sentAt: string | null;
  createdAt: string;
}

export interface PortfolioBStats {
  openPositions: number;
  totalTrades: number;
  closedPnl: number;
  closedCount: number;
  stoppedCount: number;
}

export type PortfolioBPerformance = Performance;

export interface RebalanceCount {
  portfolioType: 'A';
  rebalanceCount: number;
  firstTradeDate: string | null;
  lastTradeDate: string | null;
}

export interface DashboardStats {
  timestamp: string;
  ingest: {
    total: number;
    bySourceType: { sourceType: string; count: number }[];
    todayCount: number;
    last24hCount: number;
  };
  gate1: {
    total: number;
    passed: number;
    failed: number;
    passRate: string;
    backstopApplied: number;
    avgScore: number;
  };
  classify: {
    total: number;
    success: number;
    failed: number;
    pending: number;
    successRate: string;
    totalCostUsd: number;
  };
  alert: {
    total: number;
    sent: number;
    failed: number;
    deliveryRate: string;
    avgImpactScore: number;
  };
  summary: {
    totalItems: number;
    gate1PassRate: string;
    classifySuccessRate: string;
    alertDeliveryRate: string;
    estimatedDailyCostUsd: number;
  };
}

export interface CostHistoryPoint {
  date: string;
  costUsd: number;
}

export interface BacktestCategoryRow {
  category: string;
  count: number;
  withReturn: number;
  winRate: number | null;
  avgAlpha: number | null;
  avgRet: number | null;
  directionMatchRate: number | null;
}

export interface BacktestResult {
  params: {
    category?: string;
    minConfidence: number;
    minGate1: number;
    holdDays: number;
    fromDate?: string;
    toDate?: string;
  };
  summary: {
    totalSignals: number;
    withReturn: number;
    winRate: number | null;
    avgAlpha: number | null;
    avgRet: number | null;
    medianAlpha: number | null;
    maxAlpha: number | null;
    minAlpha: number | null;
    directionMatchRate: number | null;
    sharpeProxy: number | null;
  };
  byCategory: BacktestCategoryRow[];
}

function sortByNavDateAsc<T extends { navDate: string }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => a.navDate.localeCompare(b.navDate));
}

// ── Normalizers (API returns many numeric fields as strings) ─────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeNav(raw: any): PortfolioNav {
  return {
    id: n(raw.id),
    portfolioType: raw.portfolioType,
    navDate: raw.navDate,
    totalNav: n(raw.totalNav),
    equityValue: n(raw.equityValue),
    cashValue: n(raw.cashValue),
    dailyReturn: nNull(raw.dailyReturn),
    createdAt: raw.createdAt,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeBenchmarkNav(raw: any): BenchmarkNavPoint {
  return {
    navDate: raw.navDate,
    totalNav: n(raw.totalNav),
    closePrice: n(raw.closePrice),
    dailyReturn: nNull(raw.dailyReturn),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizePosition(raw: any): PaperPosition {
  return {
    rowKey: `${raw.portfolioType ?? ''}:${raw.asOfDate ?? ''}:${raw.ticker ?? ''}`,
    ticker: raw.ticker,
    name: raw.name ?? raw.ticker,
    qty: n(raw.qty),
    avgPrice: n(raw.avgPrice),
    portfolioType: raw.portfolioType,
    asOfDate: raw.asOfDate,
    status: raw.status ?? 'OPEN',
    targetExitDate: raw.targetExitDate ?? null,
    stopLossPrice: raw.stopLossPrice != null ? n(raw.stopLossPrice) : null,
    createdAt: raw.createdAt,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeDashboardStats(raw: any): DashboardStats {
  return {
    timestamp: raw.timestamp ?? '',
    ingest: {
      total: n(raw.ingest?.total),
      bySourceType: Array.isArray(raw.ingest?.bySourceType)
        ? raw.ingest.bySourceType.map((x: { sourceType: string; count: unknown }) => ({
            sourceType: x.sourceType,
            count: n(x.count),
          }))
        : [],
      todayCount: n(raw.ingest?.todayCount),
      last24hCount: n(raw.ingest?.last24hCount),
    },
    gate1: {
      total: n(raw.gate1?.total),
      passed: n(raw.gate1?.passed),
      failed: n(raw.gate1?.failed),
      passRate: raw.gate1?.passRate ?? '—',
      backstopApplied: n(raw.gate1?.backstopApplied),
      avgScore: n(raw.gate1?.avgScore),
    },
    classify: {
      total: n(raw.classify?.total),
      success: n(raw.classify?.success),
      failed: n(raw.classify?.failed),
      pending: n(raw.classify?.pending),
      successRate: raw.classify?.successRate ?? '—',
      totalCostUsd: n(raw.classify?.totalCostUsd),
    },
    alert: {
      total: n(raw.alert?.total),
      sent: n(raw.alert?.sent),
      failed: n(raw.alert?.failed),
      deliveryRate: raw.alert?.deliveryRate ?? '—',
      avgImpactScore: n(raw.alert?.avgImpactScore),
    },
    summary: {
      totalItems: n(raw.summary?.totalItems),
      gate1PassRate: raw.summary?.gate1PassRate ?? '—',
      classifySuccessRate: raw.summary?.classifySuccessRate ?? '—',
      alertDeliveryRate: raw.summary?.alertDeliveryRate ?? '—',
      estimatedDailyCostUsd: n(raw.summary?.estimatedDailyCostUsd),
    },
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeCostHistoryPoint(raw: any): CostHistoryPoint {
  return {
    date: raw.date,
    costUsd: n(raw.costUsd),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeTrade(raw: any): PaperTrade {
  const qty = n(raw.qty);
  const fillPrice = n(raw.fillPrice);
  return {
    id: n(raw.id),
    ticker: raw.ticker,
    name: raw.name ?? raw.ticker,
    side: raw.side,
    qty,
    fillPrice,
    amount: raw.amount != null ? n(raw.amount) : qty * fillPrice,
    tradeDate: raw.tradeDate,
    portfolioType: raw.portfolioType,
    createdAt: raw.createdAt,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeSignalCandidate(raw: any): SignalCandidate {
  return {
    id: n(raw.id),
    sourceItemId: raw.sourceItemId,
    ticker: raw.ticker,
    name: raw.name ?? raw.ticker,
    signalDate: raw.signalDate,
    category: raw.category,
    rawTag: raw.rawTag,
    impactDirection: raw.impactDirection,
    confidence: n(raw.confidence),
    gate1Score: n(raw.gate1Score),
    signalScore: n(raw.signalScore),
    ret1d: nNull(raw.ret1d),
    ret5d: nNull(raw.ret5d),
    alpha5d: nNull(raw.alpha5d),
    createdAt: raw.createdAt,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizePerformance(raw: any): Performance {
  return {
    initialized: Boolean(raw.initialized),
    startDate: raw.startDate,
    endDate: raw.endDate,
    initialNav: n(raw.initialNav),
    currentNav: n(raw.currentNav),
    totalReturn: n(raw.totalReturn),
    cagr: nNull(raw.cagr),
    sharpeRatio: nNull(raw.sharpeRatio),
    maxDrawdown: n(raw.maxDrawdown),
    winRate: nNull(raw.winRate),
    avgWin: nNull(raw.avgWin),
    avgLoss: nNull(raw.avgLoss),
    profitFactor: nNull(raw.profitFactor),
    tradingDays: n(raw.tradingDays),
    benchmarkReturn: nNull(raw.benchmarkReturn),
    alpha: nNull(raw.alpha),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizePortfolioBStats(raw: any): PortfolioBStats {
  return {
    openPositions: n(raw.openPositions),
    totalTrades: n(raw.totalTrades),
    closedPnl: n(raw.closedPnl),
    closedCount: n(raw.closedCount),
    stoppedCount: n(raw.stoppedCount),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizePortfolioBPerformance(raw: any): PortfolioBPerformance {
  return normalizePerformance(raw);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeRebalanceCount(raw: any): RebalanceCount {
  return {
    portfolioType: 'A',
    rebalanceCount: n(raw.rebalanceCount),
    firstTradeDate: raw.firstTradeDate ?? null,
    lastTradeDate: raw.lastTradeDate ?? null,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeRecentAlert(raw: any): RecentAlert {
  return {
    alertId: String(raw.alertId),
    sourceItemId: String(raw.sourceItemId),
    sourceType: raw.sourceType,
    title: raw.title,
    url: raw.url ?? null,
    publishedAt: raw.publishedAt,
    relatedTickers: Array.isArray(raw.relatedTickers) ? raw.relatedTickers : [],
    relatedSectors: Array.isArray(raw.relatedSectors) ? raw.relatedSectors : [],
    impactScore: n(raw.impactScore),
    sectorCode: raw.sectorCode,
    slackChannelId: raw.slackChannelId,
    slackChannelName: raw.slackChannelName ?? null,
    latestDeliveryStatus: raw.latestDeliveryStatus,
    latestDeliveryError: raw.latestDeliveryError ?? null,
    sentAt: raw.sentAt ?? null,
    createdAt: raw.createdAt,
  };
}

// ── API calls ────────────────────────────────────────────────────────────────

export const api = {
  navHistory: (limit = 60) =>
    get<unknown[]>(`/api/paper-trading/nav/history?limit=${limit}`)
      .then((rows) => sortByNavDateAsc(rows.map(normalizeNav))),
  performance: () =>
    get<unknown>('/api/paper-trading/performance')
      .then(normalizePerformance),
  positions: () =>
    get<unknown[]>('/api/paper-trading/positions')
      .then((rows) => rows.map(normalizePosition)),
  trades: (limit = 50, page = 1) =>
    get<{
      items: unknown[];
      total: unknown;
      page: unknown;
      limit: unknown;
      hasNext: unknown;
      totalAmount: unknown;
      buyAmount: unknown;
      sellAmount: unknown;
      netAmount: unknown;
    }>(`/api/paper-trading/trades?limit=${limit}&page=${page}`)
      .then((raw) => ({
        items: raw.items.map(normalizeTrade),
        total: n(raw.total),
        page: n(raw.page),
        limit: n(raw.limit),
        hasNext: Boolean(raw.hasNext),
        totalAmount: n(raw.totalAmount),
        buyAmount: n(raw.buyAmount),
        sellAmount: n(raw.sellAmount),
        netAmount: n(raw.netAmount),
      })),
  rebalanceCount: () =>
    get<unknown>('/api/paper-trading/rebalance-count')
      .then(normalizeRebalanceCount),
  bPositions: () =>
    get<unknown[]>('/api/paper-trading/b/positions')
      .then((rows) => rows.map(normalizePosition)),
  bStats: () =>
    get<unknown>('/api/paper-trading/b/stats')
      .then(normalizePortfolioBStats),
  bNavHistory: (limit = 60) =>
    get<unknown[]>(`/api/paper-trading/b/nav/history?limit=${limit}`)
      .then((rows) => sortByNavDateAsc(rows.map(normalizeNav))),
  benchmarkNavHistory: (limit = 60) =>
    get<unknown[]>(`/api/paper-trading/benchmark/nav/history?limit=${limit}`)
      .then((rows) => sortByNavDateAsc(rows.map(normalizeBenchmarkNav))),
  bPerformance: () =>
    get<unknown>('/api/paper-trading/b/performance')
      .then(normalizePortfolioBPerformance),
  signalCandidates: (limit = 50) =>
    get<unknown[]>(`/api/signal/candidates?limit=${limit}`)
      .then((rows) => rows.map(normalizeSignalCandidate)),
  signalStats: () =>
    get<SignalTagStats[]>('/api/signal/stats'),
  alertStats: () =>
    get<AlertStats>('/api/alert/stats'),
  recentAlerts: (limit = 50) =>
    get<unknown[]>(`/api/alert/recent?limit=${limit}`)
      .then((rows) => rows.map(normalizeRecentAlert)),
  dashboardStats: () =>
    get<unknown>('/api/stats').then(normalizeDashboardStats),
  costHistory: (days = 30) =>
    get<unknown[]>(`/api/stats/cost/history?days=${days}`)
      .then((rows) => rows.map(normalizeCostHistoryPoint)),
  backtest: (params: {
    holdDays?: 1 | 5 | 20;
    minConfidence?: number;
    minGate1?: number;
    category?: string;
    fromDate?: string;
    toDate?: string;
  } = {}) => {
    const q = new URLSearchParams();
    if (params.holdDays != null) q.set('holdDays', String(params.holdDays));
    if (params.minConfidence != null) q.set('minConfidence', String(params.minConfidence));
    if (params.minGate1 != null) q.set('minGate1', String(params.minGate1));
    if (params.category) q.set('category', params.category);
    if (params.fromDate) q.set('fromDate', params.fromDate);
    if (params.toDate) q.set('toDate', params.toDate);
    return get<BacktestResult>(`/api/signal/backtest?${q.toString()}`);
  },
};
