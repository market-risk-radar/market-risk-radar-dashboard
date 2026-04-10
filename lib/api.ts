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
  benchmarkReturn: number | null;
  alpha: number | null;
}

export interface PaperPosition {
  id: number;
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
function normalizePosition(raw: any): PaperPosition {
  return {
    id: n(raw.id),
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
      .then((rows) => rows.map(normalizeNav)),
  performance: () =>
    get<unknown>('/api/paper-trading/performance')
      .then(normalizePerformance),
  positions: () =>
    get<unknown[]>('/api/paper-trading/positions')
      .then((rows) => rows.map(normalizePosition)),
  trades: (limit = 50) =>
    get<unknown[]>(`/api/paper-trading/trades?limit=${limit}`)
      .then((rows) => rows.map(normalizeTrade)),
  bPositions: () =>
    get<unknown[]>('/api/paper-trading/b/positions')
      .then((rows) => rows.map(normalizePosition)),
  bStats: () =>
    get<unknown>('/api/paper-trading/b/stats')
      .then(normalizePortfolioBStats),
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
};
