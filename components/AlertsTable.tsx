'use client';

import { useState } from 'react';
import { clsx } from 'clsx';
import type { RecentAlert } from '@/lib/api';

// ── KST 포맷 ────────────────────────────────────────────────────────────────
function toKST(isoString: string | null): string {
  if (!isoString) return '—';
  try {
    return new Date(isoString).toLocaleString('ko-KR', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  } catch {
    return isoString;
  }
}

function toKSTShort(isoString: string | null): string {
  if (!isoString) return '—';
  try {
    return new Date(isoString).toLocaleString('ko-KR', {
      timeZone: 'Asia/Seoul',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch {
    return isoString;
  }
}

// ── 상태 스타일 ──────────────────────────────────────────────────────────────
const STATUS_STYLE: Record<string, string> = {
  SENT:    'bg-emerald-950 text-emerald-300',
  RETRIED: 'bg-blue-950 text-blue-300',
  FAILED:  'bg-red-950 text-red-300',
  PENDING: 'bg-zinc-800 text-zinc-300',
};

// ── 상세 모달 ────────────────────────────────────────────────────────────────
function AlertDetailModal({
  alert,
  onClose,
}: {
  alert: RecentAlert;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70"
      onClick={onClose}
    >
      <div
        className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-start justify-between gap-3 p-5 border-b border-zinc-800">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                {alert.sourceType}
              </span>
              <span
                className={clsx(
                  'text-xs px-2 py-0.5 rounded-full font-medium',
                  STATUS_STYLE[alert.latestDeliveryStatus] ?? STATUS_STYLE.PENDING,
                )}
              >
                {alert.latestDeliveryStatus}
              </span>
            </div>
            <p className="text-sm font-semibold text-white leading-snug">{alert.title}</p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors flex-shrink-0 text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {/* 본문 */}
        <div className="p-5 space-y-4 text-sm">

          {/* 임팩트 스코어 */}
          <div className="flex items-center gap-3">
            <span className="text-zinc-500 w-24 flex-shrink-0">임팩트 스코어</span>
            <span
              className={clsx(
                'font-bold text-base',
                alert.impactScore >= 80 && 'text-emerald-400',
                alert.impactScore >= 60 && alert.impactScore < 80 && 'text-white',
                alert.impactScore < 60 && 'text-zinc-500',
              )}
            >
              {alert.impactScore}
            </span>
          </div>

          {/* 채널 */}
          <div className="flex items-start gap-3">
            <span className="text-zinc-500 w-24 flex-shrink-0">채널</span>
            <div>
              <p className="text-zinc-200">{alert.slackChannelName ?? alert.sectorCode}</p>
              <p className="text-xs text-zinc-600">{alert.slackChannelId}</p>
            </div>
          </div>

          {/* 관련 종목 */}
          {alert.relatedTickers.length > 0 && (
            <div className="flex items-start gap-3">
              <span className="text-zinc-500 w-24 flex-shrink-0">관련 종목</span>
              <div className="flex flex-wrap gap-1.5">
                {alert.relatedTickers.map((t) => (
                  <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 관련 섹터 */}
          {alert.relatedSectors.length > 0 && (
            <div className="flex items-start gap-3">
              <span className="text-zinc-500 w-24 flex-shrink-0">관련 섹터</span>
              <div className="flex flex-wrap gap-1.5">
                {alert.relatedSectors.map((s) => (
                  <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-500">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 발송 시각 */}
          <div className="flex items-center gap-3">
            <span className="text-zinc-500 w-24 flex-shrink-0">발송 시각</span>
            <span className="text-zinc-300">{toKST(alert.sentAt ?? alert.createdAt)}</span>
          </div>

          {/* 게시 시각 */}
          <div className="flex items-center gap-3">
            <span className="text-zinc-500 w-24 flex-shrink-0">게시 시각</span>
            <span className="text-zinc-300">{toKST(alert.publishedAt)}</span>
          </div>

          {/* 오류 메시지 */}
          {alert.latestDeliveryError && (
            <div className="flex items-start gap-3">
              <span className="text-zinc-500 w-24 flex-shrink-0">오류</span>
              <p className="text-xs text-red-400 break-all">{alert.latestDeliveryError}</p>
            </div>
          )}

          {/* 원문 링크 */}
          {alert.url && (
            <div className="pt-1">
              <a
                href={alert.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-400 hover:text-blue-300 underline underline-offset-2 break-all"
              >
                원문 보기 →
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────────
export default function AlertsTable({ alerts }: { alerts: RecentAlert[] }) {
  const [channelFilter, setChannelFilter] = useState<string>('ALL');
  const [selected, setSelected] = useState<RecentAlert | null>(null);

  // 고유 채널 목록 추출
  const channels = Array.from(
    new Map(
      alerts.map((a) => [
        a.slackChannelId,
        a.slackChannelName ?? a.sectorCode,
      ]),
    ).entries(),
  ).sort((a, b) => a[1].localeCompare(b[1]));

  const filtered =
    channelFilter === 'ALL'
      ? alerts
      : alerts.filter((a) => a.slackChannelId === channelFilter);

  const sentCount   = filtered.filter((a) => a.latestDeliveryStatus === 'SENT').length;
  const failedCount = filtered.filter((a) => a.latestDeliveryStatus === 'FAILED').length;

  return (
    <>
      <div className="space-y-4">
        {/* 채널 필터 */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setChannelFilter('ALL')}
              className={clsx(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors border',
                channelFilter === 'ALL'
                  ? 'bg-blue-600 text-white border-blue-500'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white hover:bg-zinc-800',
              )}
            >
              전체
            </button>
            {channels.map(([id, name]) => (
              <button
                key={id}
                type="button"
                onClick={() => setChannelFilter(id)}
                className={clsx(
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-colors border',
                  channelFilter === id
                    ? 'bg-blue-600 text-white border-blue-500'
                    : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white hover:bg-zinc-800',
                )}
              >
                {name}
              </button>
            ))}
          </div>
          <div className="text-xs text-zinc-500">
            {filtered.length}건 · SENT {sentCount} · FAILED {failedCount}
          </div>
        </div>

        {/* 테이블 */}
        {filtered.length === 0 ? (
          <div className="border border-dashed border-zinc-800 rounded-lg py-10 text-center text-sm text-zinc-600">
            표시할 알림이 없습니다
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-zinc-500 uppercase border-b border-zinc-800">
                  <th className="text-left py-2 pr-4">종목 / 제목</th>
                  <th className="text-left py-2 pr-4">채널</th>
                  <th className="text-right py-2 pr-4">임팩트</th>
                  <th className="text-left py-2 pr-4">상태</th>
                  <th className="text-right py-2">시각 (KST)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {filtered.map((alert) => (
                  <tr
                    key={alert.alertId}
                    className="hover:bg-zinc-800/60 transition-colors cursor-pointer"
                    onClick={() => setSelected(alert)}
                  >
                    <td className="py-2.5 pr-4 min-w-[280px] max-w-[360px]">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {alert.relatedTickers.length > 0 && (
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-zinc-800 text-zinc-300">
                              {alert.relatedTickers.slice(0, 3).join(', ')}
                              {alert.relatedTickers.length > 3 && ` +${alert.relatedTickers.length - 3}`}
                            </span>
                          )}
                          <span className="text-xs text-zinc-600">{alert.sourceType}</span>
                        </div>
                        <p className="font-medium text-white line-clamp-2 leading-snug">
                          {alert.title}
                        </p>
                      </div>
                    </td>
                    <td className="py-2.5 pr-4 whitespace-nowrap">
                      <p className="text-zinc-300">{alert.slackChannelName ?? alert.sectorCode}</p>
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
                      <span
                        className={clsx(
                          'text-xs px-2 py-0.5 rounded-full font-medium',
                          STATUS_STYLE[alert.latestDeliveryStatus] ?? STATUS_STYLE.PENDING,
                        )}
                      >
                        {alert.latestDeliveryStatus}
                      </span>
                    </td>
                    <td className="py-2.5 text-right text-zinc-500 text-xs whitespace-nowrap">
                      {toKSTShort(alert.sentAt ?? alert.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 상세 모달 */}
      {selected && (
        <AlertDetailModal alert={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}
