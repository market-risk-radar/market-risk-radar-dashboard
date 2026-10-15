// Gate 0 블라인드 — CONTRACT_WIN 재판정(사전 등록 검정)이 대기 중인 동안 그 표본의 alpha를 화면에 띄우지 않는다.
// 근거: 백엔드 CLAUDE.md 「사전 등록된 검정이 대기 중이면 그 표본을 탐색 조회하지 않는다」 —
//   `GET /api/signal/stats`는 전 카테고리 avgAlpha를 반환하므로 호출 자체가 오염이다.
//   스펙 docs/superpowers/specs/2026-09-06-gate0-cw-재판정-사전등록.md §16.
// 해제 조건: Gate 0 결과가 백엔드에 커밋된 뒤(스펙 §16-4 기입) 이 값을 false 로 바꾸는 PR.
// 재확인 트리거: 실행 기한(2026-11-30) 경로까지 고려해 REVIEW_AFTER 이후에는 배너가 「재확인 필요」로 바뀐다.
//   이 날짜가 지나도 해제하지 않았다면 Gate 0 진행 상태를 확인하고 날짜를 갱신하거나 해제한다.
export const GATE0_BLIND: boolean = true;
export const GATE0_BLIND_REVIEW_AFTER = '2026-12-15';

export function isGate0BlindReviewDue(now: Date = new Date()): boolean {
  const todayKst = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });
  return todayKst > GATE0_BLIND_REVIEW_AFTER;
}
