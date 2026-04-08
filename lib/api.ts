const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { next: { revalidate: 30 } });
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
  createdAt: string;
}

export interface PaperTrade {
  id: number;
  ticker: string;
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

export interface PortfolioBStats {
  openPositions: number;
  totalTrades: number;
  closedPnl: number;
  closedCount: number;
  stoppedCount: number;
}

// ── API calls ────────────────────────────────────────────────────────────────

export const api = {
  navHistory: (limit = 60) =>
    get<PortfolioNav[]>(`/api/paper-trading/nav/history?limit=${limit}`),
  performance: () =>
    get<Performance>('/api/paper-trading/performance'),
  positions: () =>
    get<PaperPosition[]>('/api/paper-trading/positions'),
  trades: (limit = 50) =>
    get<PaperTrade[]>(`/api/paper-trading/trades?limit=${limit}`),
  bPositions: () =>
    get<PaperPosition[]>('/api/paper-trading/b/positions'),
  bStats: () =>
    get<PortfolioBStats>('/api/paper-trading/b/stats'),
  signalCandidates: (limit = 50) =>
    get<SignalCandidate[]>(`/api/signal/candidates?limit=${limit}`),
  signalStats: () =>
    get<SignalTagStats[]>('/api/signal/stats'),
  alertStats: () =>
    get<AlertStats>('/api/alert/stats'),
};
