import { api } from '@/lib/api';
import StatCard from '@/components/StatCard';

export default async function AlertsPage() {
  const stats = await api.alertStats().catch(() => null);

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
    </div>
  );
}
