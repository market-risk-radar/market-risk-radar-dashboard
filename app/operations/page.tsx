import { api, DashboardStats } from '@/lib/api';
import StatCard from '@/components/StatCard';
import CostHistoryChart from '@/components/CostHistoryChart';

function normalizeTimestamp(raw: string): string {
  const match = raw.match(/^(\d{4}-\d{2}-\d{2}) (\d{2}):(\d{2}):(\d{2})$/);
  if (!match) return raw;

  const [, datePart, hourPart, minutePart, secondPart] = match;
  const hour = Number(hourPart);
  if (hour < 24) return raw;

  const next = new Date(`${datePart}T00:${minutePart}:${secondPart}+09:00`);
  if (Number.isNaN(next.getTime())) return raw;
  next.setDate(next.getDate() + Math.floor(hour / 24));
  const normalizedHour = String(hour % 24).padStart(2, '0');

  const yyyy = next.getFullYear();
  const mm = String(next.getMonth() + 1).padStart(2, '0');
  const dd = String(next.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${normalizedHour}:${minutePart}:${secondPart}`;
}

// ── 파이프라인 퍼널 바 ────────────────────────────────────────────────────────

interface FunnelRow {
  label: string;
  count: number;
  pct: number; // 0~100, ingest.total 기준
  color: string;
}

function FunnelBar({ row }: { row: FunnelRow }) {
  const width = Math.max(row.pct, 0.5); // 최소 0.5% 표시
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-zinc-400">{row.label}</span>
        <span className="text-zinc-300 tabular-nums">
          {row.count.toLocaleString()}건
          {row.pct < 100 && (
            <span className="text-zinc-600 ml-1">({row.pct.toFixed(1)}%)</span>
          )}
        </span>
      </div>
      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${row.color}`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

function PipelineFunnel({ stats }: { stats: DashboardStats }) {
  const base = Math.max(stats.ingest.total, 1);
  const rows: FunnelRow[] = [
    {
      label: '수집 (전체)',
      count: stats.ingest.total,
      pct: 100,
      color: 'bg-zinc-400',
    },
    {
      label: 'Gate1 통과',
      count: stats.gate1.passed,
      pct: (stats.gate1.passed / base) * 100,
      color: 'bg-blue-500',
    },
    {
      label: '분류 성공',
      count: stats.classify.success,
      pct: (stats.classify.success / base) * 100,
      color: 'bg-violet-500',
    },
    {
      label: '알림 발송',
      count: stats.alert.sent,
      pct: (stats.alert.sent / base) * 100,
      color: 'bg-emerald-500',
    },
  ];

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <FunnelBar key={row.label} row={row} />
      ))}
    </div>
  );
}

// ── 소스 타입 비율 ────────────────────────────────────────────────────────────

function SourceTypeBar({ stats }: { stats: DashboardStats }) {
  const total = Math.max(stats.ingest.total, 1);
  const news = stats.ingest.bySourceType.find((s) => s.sourceType === 'NEWS')?.count ?? 0;
  const dart = stats.ingest.bySourceType.find((s) => s.sourceType === 'DART')?.count ?? 0;
  const newsPct = (news / total) * 100;
  const dartPct = (dart / total) * 100;

  return (
    <div className="space-y-3">
      <div className="h-3 bg-zinc-800 rounded-full overflow-hidden flex">
        <div className="h-full bg-sky-500" style={{ width: `${newsPct}%` }} />
        <div className="h-full bg-amber-500" style={{ width: `${dartPct}%` }} />
      </div>
      <div className="flex gap-6 text-xs">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-sm bg-sky-500" />
          <span className="text-zinc-400">NEWS</span>
          <span className="text-zinc-200 tabular-nums font-medium">
            {news.toLocaleString()}건 ({newsPct.toFixed(1)}%)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-sm bg-amber-500" />
          <span className="text-zinc-400">DART</span>
          <span className="text-zinc-200 tabular-nums font-medium">
            {dart.toLocaleString()}건 ({dartPct.toFixed(1)}%)
          </span>
        </div>
      </div>
    </div>
  );
}

// ── 메인 페이지 ──────────────────────────────────────────────────────────────

export default async function OperationsPage() {
  const [stats, costHistory] = await Promise.all([
    api.dashboardStats().catch(() => null),
    api.costHistory(30).catch(() => []),
  ]);

  if (!stats) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white">Operations</h2>
          <p className="text-sm text-zinc-500 mt-0.5">파이프라인 운영 현황</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 text-center text-zinc-600 text-sm">
          운영 데이터를 불러올 수 없습니다
        </div>
      </div>
    );
  }

  const costTrend =
    stats.summary.estimatedDailyCostUsd <= 3 ? 'up' : 'down'; // $3 이하면 good
  const timestampLabel = normalizeTimestamp(stats.timestamp);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Operations</h2>
        <p className="text-sm text-zinc-500 mt-0.5">
          파이프라인 운영 현황 · 기준 {timestampLabel}
        </p>
      </div>

      {/* KPI 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          label="오늘 수집"
          value={stats.ingest.todayCount.toLocaleString() + '건'}
          sub={`24h: ${stats.ingest.last24hCount.toLocaleString()}건`}
          trend="neutral"
        />
        <StatCard
          label="예상 일비용 (Claude)"
          value={`$${stats.summary.estimatedDailyCostUsd.toFixed(2)}`}
          sub="목표: $3.00 이하"
          trend={costTrend}
        />
        <StatCard
          label="Gate1 통과율"
          value={stats.gate1.passRate}
          sub={`통과 ${stats.gate1.passed.toLocaleString()} / 전체 ${stats.gate1.total.toLocaleString()}`}
          trend="neutral"
        />
        <StatCard
          label="분류 성공률"
          value={stats.classify.successRate}
          sub={`누적 비용 $${stats.classify.totalCostUsd.toFixed(2)}`}
          trend="neutral"
        />
        <StatCard
          label="알림 발송률"
          value={stats.alert.deliveryRate}
          sub={`발송 ${stats.alert.sent.toLocaleString()} / 생성 ${stats.alert.total.toLocaleString()}`}
          trend={stats.alert.failed > 0 ? 'down' : 'up'}
        />
        <StatCard
          label="Backstop 적용"
          value={stats.gate1.backstopApplied.toLocaleString() + '건'}
          sub={`Gate1 평균 점수: ${stats.gate1.avgScore.toFixed(1)}점`}
          trend="neutral"
        />
      </div>

      {/* 파이프라인 퍼널 */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
        <p className="text-sm font-semibold text-zinc-300 mb-5">파이프라인 퍼널 (전체 누계)</p>
        <PipelineFunnel stats={stats} />
      </div>

      {/* 소스 타입 + LLM 분류 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
          <p className="text-sm font-semibold text-zinc-300 mb-4">소스 타입 비율</p>
          <SourceTypeBar stats={stats} />
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
          <p className="text-sm font-semibold text-zinc-300 mb-4">LLM 분류 상세</p>
          <div className="space-y-2 text-sm">
            {[
              { label: '전체 분류', value: stats.classify.total.toLocaleString() + '건', color: 'text-zinc-200' },
              { label: '분류 성공', value: stats.classify.success.toLocaleString() + '건', color: 'text-emerald-400' },
              { label: '분류 실패', value: stats.classify.failed.toLocaleString() + '건', color: stats.classify.failed > 0 ? 'text-red-400' : 'text-zinc-600' },
              { label: '대기 중', value: stats.classify.pending.toLocaleString() + '건', color: 'text-amber-400' },
              { label: '평균 임팩트', value: stats.alert.avgImpactScore.toFixed(1) + '점', color: 'text-zinc-200' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex justify-between items-center py-1.5 border-b border-zinc-800 last:border-0">
                <span className="text-zinc-500">{label}</span>
                <span className={`font-medium tabular-nums ${color}`}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-zinc-300">Claude 비용 추이 (최근 30일)</p>
          <span className="text-xs text-zinc-600">USD / 일</span>
        </div>
        {costHistory.length > 0 ? (
          <CostHistoryChart data={costHistory} />
        ) : (
          <div className="h-60 flex items-center justify-center text-zinc-600 text-sm">
            비용 데이터 없음
          </div>
        )}
      </div>
    </div>
  );
}
