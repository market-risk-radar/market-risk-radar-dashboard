import type { SignalTagStats } from './api';

// 카테고리 라벨 — null/빈 값은 '미분류/기타'로 표시
export function categoryLabel(category: string | null): string {
  return category ?? '미분류/기타';
}

// SignalTagStats 정렬 — G2 통과 → G2 후보 → filled → event → α방향일치율 → 카테고리명
// (홈/Signals/Event Returns 공통. 타이 상황에서 alphaDirectionMatch5dRate로 결정적 정렬)
export function compareSignalTagStats(a: SignalTagStats, b: SignalTagStats): number {
  return (
    Number(b.g2Pass) - Number(a.g2Pass) ||
    Number(b.g2Eligible) - Number(a.g2Eligible) ||
    b.filledCount - a.filledCount ||
    b.eventCount - a.eventCount ||
    (b.alphaDirectionMatch5dRate ?? -1) - (a.alphaDirectionMatch5dRate ?? -1) ||
    categoryLabel(a.category).localeCompare(categoryLabel(b.category))
  );
}
