import { api } from '@/lib/api';
import StatCard from '@/components/StatCard';
import AlertsTable from '@/components/AlertsTable';
export const dynamic = 'force-dynamic';

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
      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
        <div className="rounded-[28px] border border-white/8 bg-[linear-gradient(135deg,rgba(18,24,32,0.9),rgba(10,13,18,0.88))] px-6 py-6 shadow-[0_32px_80px_rgba(0,0,0,0.24)]">
          <p className="font-mono text-[11px] uppercase tracking-[0.26em] text-orange-200/70">Alerts</p>
          <h2 className="mt-3 text-3xl font-bold text-white">Delivery control panel</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">
            Slack 알림 생성, 발송 성공률, 최근 전송 상태를 추적하는 운영 화면.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">Recent</p>
            <p className="mt-2 text-3xl font-bold text-white">{recentAlerts.length}</p>
            <p className="mt-1 text-xs text-zinc-500">최근 알림 행 수</p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">Success</p>
            <p className="mt-2 text-3xl font-bold text-white">{sentRate}</p>
            <p className="mt-1 text-xs text-zinc-500">현재 집계 발송 성공률</p>
          </div>
        </div>
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

      <div className="rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(17,22,29,0.9),rgba(10,14,19,0.92))] p-5 shadow-[0_28px_70px_rgba(0,0,0,0.2)]">
        <div className="mb-4">
          <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.22em] text-zinc-500">Recent Alerts</p>
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
