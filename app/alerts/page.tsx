export const dynamic = 'force-dynamic';

import { api } from '@/lib/api';
import StatCard from '@/components/StatCard';
import AlertsTable from '@/components/AlertsTable';

export default async function AlertsPage() {
  const [stats, recentAlerts] = await Promise.all([
    api.alertStats().catch(() => null),
    api.recentAlerts(50).catch(() => []),
  ]);

  const sentRate = stats
    ? ((stats.sent / Math.max(stats.total, 1)) * 100).toFixed(1) + '%'
    : '—';
  const failRate = stats
    ? ((stats.failed / Math.max(stats.total, 1)) * 100).toFixed(1) + '%'
    : '—';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Alerts</h2>
        <p className="text-sm text-zinc-500 mt-0.5">Slack 알림 발송 현황</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="총 알림"
          value={stats?.total ?? '—'}
          trend="neutral"
        />
        <StatCard
          label="발송 성공"
          value={stats ? `${stats.sent} (${sentRate})` : '—'}
          trend="up"
        />
        <StatCard
          label="발송 실패"
          value={stats ? `${stats.failed} (${failRate})` : '—'}
          trend={stats && stats.failed > 0 ? 'down' : 'neutral'}
        />
        <StatCard
          label="평균 임팩트 스코어"
          value={stats ? stats.avgImpactScore.toFixed(1) : '—'}
          trend="neutral"
        />
      </div>

      {!stats && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 text-center text-zinc-600 text-sm">
          알림 데이터를 불러올 수 없습니다
        </div>
      )}

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
        <div className="mb-4">
          <p className="text-sm font-semibold text-zinc-300">최근 알림 목록</p>
          <p className="text-xs text-zinc-500">최근 50건 기준 · 행 클릭 시 상세 보기</p>
        </div>
        {recentAlerts.length === 0 ? (
          <div className="text-sm text-zinc-600 py-8 text-center">최근 알림 없음</div>
        ) : (
          <AlertsTable alerts={recentAlerts} />
        )}
      </div>
    </div>
  );
}
