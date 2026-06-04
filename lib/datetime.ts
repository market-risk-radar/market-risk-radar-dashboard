// KST(Asia/Seoul) 날짜·시각 포맷 유틸 — 대시보드 전역 공용
// 여러 페이지/컴포넌트에 흩어져 있던 포맷 로직을 단일 소스로 통합 (audit §5/§7)

const KST = 'Asia/Seoul';

// 공통 가드: null/빈 값 → '—', 파싱 실패 → 원본 문자열 반환
function formatOrDash(iso: string | null, render: (d: Date) => string): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return render(date);
}

// 전체 일시: 2026. 06. 04. 15:30:00 (24h)
export function formatKstDateTime(iso: string | null): string {
  return formatOrDash(iso, (d) =>
    d.toLocaleString('ko-KR', {
      timeZone: KST,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }),
  );
}

// 짧은 일시: 06. 04. 15:30 (24h)
export function formatKstShort(iso: string | null): string {
  return formatOrDash(iso, (d) =>
    d.toLocaleString('ko-KR', {
      timeZone: KST,
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }),
  );
}

// 날짜(월·일): 06. 04.
export function formatKstMonthDay(iso: string | null): string {
  return formatOrDash(iso, (d) =>
    d.toLocaleDateString('ko-KR', {
      timeZone: KST,
      month: '2-digit',
      day: '2-digit',
    }),
  );
}

// ISO 날짜 문자열(YYYY-MM-DD, en-CA) — KST 기준. 파싱 실패 시 입력 문자열 그대로 반환.
export function formatKstIsoDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-CA', { timeZone: KST });
}

// 오늘 날짜(KST, YYYY-MM-DD)
export function todayKstIsoDate(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: KST });
}
