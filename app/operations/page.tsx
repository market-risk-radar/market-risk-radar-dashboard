import { api, DashboardStats } from '@/lib/api';
import StatCard from '@/components/StatCard';
import CostHistoryChart from '@/components/CostHistoryChart';
export const dynamic = 'force-dynamic';

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
      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
        <div className="rounded-[28px] border border-white/8 bg-[linear-gradient(135deg,rgba(18,24,32,0.9),rgba(10,13,18,0.88))] px-6 py-6 shadow-[0_32px_80px_rgba(0,0,0,0.24)]">
          <p className="font-mono text-[11px] uppercase tracking-[0.26em] text-orange-200/70">Operations</p>
          <h2 className="mt-3 text-3xl font-bold text-white">Pipeline control board</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">
            수집부터 분류, 알림, 비용까지 전체 운영 파이프라인을 한 번에 확인하는 상태판.
          </p>
          <p className="mt-4 text-xs text-zinc-500">기준 시각 {timestampLabel}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">Ingest</p>
            <p className="mt-2 text-3xl font-bold text-white">{stats.ingest.todayCount.toLocaleString()}</p>
            <p className="mt-1 text-xs text-zinc-500">오늘 수집 건수</p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">Delivery</p>
            <p className="mt-2 text-3xl font-bold text-white">{stats.alert.deliveryRate}</p>
            <p className="mt-1 text-xs text-zinc-500">Slack 알림 발송률</p>
          </div>
        </div>
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
      <div className="rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(17,22,29,0.9),rgba(10,14,19,0.92))] p-5 shadow-[0_28px_70px_rgba(0,0,0,0.2)]">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-zinc-500 mb-2">Pipeline Funnel</p>
        <p className="text-sm font-semibold text-zinc-300 mb-5">전체 누계 전환률</p>
        <PipelineFunnel stats={stats} />
      </div>

      {/* 소스 타입 + LLM 분류 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(17,22,29,0.9),rgba(10,14,19,0.92))] p-5 shadow-[0_28px_70px_rgba(0,0,0,0.2)]">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-zinc-500 mb-2">Source Mix</p>
          <p className="text-sm font-semibold text-zinc-300 mb-4">소스 타입 비율</p>
          <SourceTypeBar stats={stats} />
        </div>

        <div className="rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(17,22,29,0.9),rgba(10,14,19,0.92))] p-5 shadow-[0_28px_70px_rgba(0,0,0,0.2)]">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-zinc-500 mb-2">Classifier</p>
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

      <div className="rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(16,21,29,0.9),rgba(10,13,19,0.92))] p-5 shadow-[0_28px_70px_rgba(0,0,0,0.2)]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-zinc-500">Cost Curve</p>
            <p className="mt-1 text-sm font-semibold text-zinc-300">Claude 비용 추이 (최근 30일)</p>
          </div>
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
