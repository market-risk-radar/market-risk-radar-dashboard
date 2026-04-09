export const dynamic = 'force-dynamic';

import { api } from '@/lib/api';
import StatCard from '@/components/StatCard';
import { clsx } from 'clsx';

const STATUS_STYLE: Record<string, string> = {
  SENT: 'bg-emerald-950 text-emerald-300',
  RETRIED: 'bg-blue-950 text-blue-300',
  FAILED: 'bg-red-950 text-red-300',
  PENDING: 'bg-zinc-800 text-zinc-300',
};

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
        <div className="flex items-center justify-between mb-4 gap-3">
          <div>
            <p className="text-sm font-semibold text-zinc-300">최근 알림 목록</p>
            <p className="text-xs text-zinc-500">최근 50건 기준</p>
          </div>
          <div className="text-xs text-zinc-600">{recentAlerts.length}건</div>
        </div>

        {recentAlerts.length === 0 ? (
          <div className="text-sm text-zinc-600 py-8 text-center">최근 알림 없음</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-zinc-500 uppercase border-b border-zinc-800">
                  <th className="text-left py-2 pr-4">종목 / 제목</th>
                  <th className="text-left py-2 pr-4">채널</th>
                  <th className="text-right py-2 pr-4">임팩트</th>
                  <th className="text-left py-2 pr-4">상태</th>
                  <th className="text-right py-2">시각</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {recentAlerts.map((alert) => (
                  <tr key={alert.alertId} className="hover:bg-zinc-800/50 transition-colors">
                    <td className="py-2.5 pr-4 min-w-[320px]">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {alert.relatedTickers.length > 0 && (
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-zinc-800 text-zinc-300">
                              {alert.relatedTickers.join(', ')}
                            </span>
                          )}
                          <span className="text-xs text-zinc-600">{alert.sourceType}</span>
                        </div>
                        <p className="font-medium text-white line-clamp-2">{alert.title}</p>
                      </div>
                    </td>
                    <td className="py-2.5 pr-4">
                      <div className="space-y-1">
                        <p className="text-zinc-300">{alert.slackChannelName ?? alert.sectorCode}</p>
                        <p className="text-xs text-zinc-600">{alert.slackChannelId}</p>
                      </div>
                    </td>
                    <td className="py-2.5 pr-4 text-right">
                      <span
                        className={clsx(
                          'font-semibold',
                          alert.impactScore >= 80 && 'text-emerald-400',
                          alert.impactScore >= 60 && alert.impactScore < 80 && 'text-white',
                          alert.impactScore < 60 && 'text-zinc-500',
                        )}
                      >
                        {alert.impactScore}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4">
                      <div className="space-y-1">
                        <span
                          className={clsx(
                            'text-xs px-2 py-0.5 rounded-full font-medium',
                            STATUS_STYLE[alert.latestDeliveryStatus] ?? STATUS_STYLE.PENDING,
                          )}
                        >
                          {alert.latestDeliveryStatus}
                        </span>
                        {alert.latestDeliveryError && (
                          <p className="text-xs text-red-400 line-clamp-2">
                            {alert.latestDeliveryError}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 text-right text-zinc-500 text-xs whitespace-nowrap">
                      {alert.sentAt ?? alert.createdAt}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
