# 대시보드 UI/UX · 코드 상세 점검 (Audit)

작성: 2026-06-04 · 범위: `app/**`, `components/**`, `lib/**`, 설정 파일 전반
성격: 분석 문서. 코드 변경 없음. 권장 조치는 **실버그 + 접근성**으로 한정 (CLAUDE.md "단순함 우선 / 외과적 변경" 원칙).
각 이슈 형식: 심각도 · 위치(`file:line`) · 현상 · 권장 조치

---

## 1. 요약 (Executive Summary)

전반적으로 견고한 코드베이스다. 데이터 계층(`lib/api.ts`)과 Next.js 16 App Router 관례 준수는 모범적이며, G2 판정을 서버 필드에만 의존하는 등 CLAUDE.md 규칙을 잘 따른다. 개선 여지는 대부분 **접근성(a11y)** 과 소수의 **표시 정합성** 이슈에 집중돼 있고, 기능을 깨뜨리는 중대한 버그는 발견되지 않았다.

| 영역 | 평가 | 비고 |
|------|------|------|
| 데이터/API 계층 | 양호 | revalidate 30s, 8s timeout, normalizer, 일관된 `.catch` 폴백 |
| 타입 안정성 | 양호 | strict TS, nullable 필드 명확, 페이지 소비 측 null 체크 충실 |
| Next 16 관례 | 양호 | Server/Client 분리 적절, async `searchParams` 정상 await |
| G2 규칙 준수 | 양호 | 서버 `g2Eligible`/`g2Pass`만 사용, 자체 상수 재판정 없음 |
| 표시 정합성 | 개선 필요 | stale 가이드 문구, trend 의미 overload (§3) |
| 접근성 | 개선 필요 | 모달 dialog 시맨틱·키보드, Pagination, aria-current, 차트 (§4) |
| 코드 중복 | 참고 | comparator·KST 포맷 중복, 반복 UI 패턴 (§5) |
| loading 스켈레톤 | 참고 | 실제 레이아웃과 카드/행 수 불일치 (§6) |

**권장 조치 우선순위**: §4 접근성 → §3 정합성. §5·§6은 참고 사항. §7은 본 프로젝트 원칙상 권장하지 않는 항목.

---

## 2. 강점 (현행 유지)

- **API 계층 (`lib/api.ts`)** — 모든 fetch가 `revalidate: 30` + `AbortSignal.timeout(8000)`, `!res.ok` 시 throw, normalizer로 문자열 숫자 필드 일관 변환. 페이지는 `Promise.all`/`allSettled` + `.catch(() => []/null)` 폴백.
- **G2 규칙 준수** — `g2Eligible`/`g2Pass` 서버 필드만 사용. 프론트에서 임계값 재판정 없음.
- **타입 안정성** — 16개 인터페이스 nullable 필드 `| null` 표기, 소비 측 `?.`/`?? '—'` 안전 접근.
- **Next.js 16 관례** — Server Component 기본, hooks/Recharts 사용처만 `'use client'`, `searchParams: Promise<...>` 정상 await, flat ESLint, Tailwind v4, strict TS.

---

## 3. 실버그 · 정합성 이슈 [권장 조치]

### 3-1. 백테스트 해석 가이드 문구 stale — 심각도 中 · `app/backtest/page.tsx:129`
가이드가 "방향일치율 55%+"로 표기돼 있으나, 현 G2 기준은 `alphaDirectionMatch5dRate ≥ 45%` + `filledCount ≥ 50`. 화면 안내가 현 기준과 불일치.
→ 문구를 `alpha > 0` + `alphaDirectionMatch 45%+`로 수정(텍스트만).

### 3-2. operations costTrend 의미 overload + 매직넘버 — 심각도 下 · `app/operations/page.tsx:198`
`costTrend = cost <= 3 ? 'up' : 'down'`. StatCard의 `'up'`=녹색(호재)을 "비용 낮음=good" 의미로 재사용해 방향이 뒤집혀 읽힘. `3`은 `GATE_THRESHOLDS.costPerDay`와 중복 하드코딩.
→ 공유 상수 참조 + 의도 명확화(동작 변경 없음).

---

## 4. 접근성 이슈 [권장 조치] — 본 세션 직접 확인 완료

### 4-1. Pagination 비활성 링크 키보드 활성화 가능 — 심각도 中 · `components/Pagination.tsx:51-96`
비활성 링크가 `aria-disabled` + `pointer-events-none`만 적용. 포인터만 막히고 키보드 포커스+Enter는 이동 가능.
→ 비활성 시 `<span aria-disabled>` 렌더 또는 `tabIndex={-1}`.

### 4-2. AlertDetailModal dialog 시맨틱·키보드 부재 — 심각도 中 · `components/AlertsTable.tsx:51-91`
`role="dialog"`/`aria-modal` 없음, Escape 닫기 없음, 포커스 트랩 없음, 닫기 버튼 ✕에 `aria-label` 없음, body 스크롤 잠금 없음.
→ `role="dialog" aria-modal="true"` + Escape 리스너 + 닫기 버튼 `aria-label="닫기"`.

### 4-3. 활성 네비게이션 링크 aria-current 누락 — 심각도 下 · `components/Navigation.tsx:40-66`
활성 링크 시각 표현만, `aria-current="page"` 미부여.
→ 활성 `<Link>`에 `aria-current` 추가.

### 4-4. 로그아웃 버튼 진행 상태 없음 — 심각도 下 · `components/Navigation.tsx:173-179`
`signOut` 중 disabled/로딩 표시 없음.
→ 클릭 시 disabled + 진행 표시(선택).

### 4-5. 차트 접근 가능한 이름 부재 — 심각도 下 · `components/NavChart.tsx:52-53`, `CostHistoryChart.tsx`
`ResponsiveContainer`에 `role="img"`·이름 없음. (NavChart는 `<Tooltip>` 있음.)
→ 래퍼 div에 `role="img"` + `aria-label`.

### 4-6. 보조 라벨 색 대비 (참고성) — 심각도 下(주관적) · `text-zinc-500` 다수
어두운 배경에서 WCAG AA(4.5:1) 경계.
→ 2차 텍스트 `text-zinc-400` 검토(적용 전 확인).

---

## 5. 중복 · 유지보수 관찰 [참고 — 수정은 별도 합의]

- **정렬 comparator 중복** — `app/page.tsx`와 `app/signals/page.tsx`에 동일 `compareSignalTagStats`.
- **KST 포맷 헬퍼 중복/분산** — `AlertsTable.tsx:8-40`의 `toKST`/`toKSTShort`, 차트 date 포맷터 분산.
- **반복 UI 패턴** — 헤더 카드, StatCard 그리드, 표본 배지, 모바일/데스크탑 이중 테이블 반복(추출은 §7 사유로 비권장).
- **스타일 토큰 혼용** — `border-white/8`/`border-zinc-800`, `rounded-2xl`/`xl`/`lg`, gradient 180/135deg, `p-4`/`p-5` 혼재(큰 문제 없음).

---

## 6. loading 스켈레톤 정합성 [참고]

| 페이지 | `loading.tsx` | 불일치 |
|--------|---------------|--------|
| `/` (home) | 있음 | 게이트 섹션 없음, A/B 스탯 수 차이 |
| `/backtest` | 있음 | 스탯 placeholder 6개 vs 실제 8개 |
| `/alerts` | 있음 | 행 6개 vs 최대 50행 |
| `/positions` | 있음 | B StatCard placeholder 불일치 |
| `/signals`, `/event-returns`, `/operations`, `/trades` | 있음 | 행/카드 수 가변 |
| `/admin/users`, `/login`, `/pending` | 없음 | 즉시 렌더 — 불필요(허용) |

---

## 7. 범위 외 / 권장하지 않음 (사유 명시)

CLAUDE.md 원칙("요청된 것만 / 투기적 기능 금지 / 외과적 변경")과 충돌하여 현 시점 비권장:

- i18n, 날짜 로케일 추상화
- 차트 export(PNG·CSV), 색맹 팔레트 재설계
- 테이블 컬럼 리사이즈·정렬·sticky·"load more"
- breadcrumb, 분석 트래킹
- Error Boundary 전면 도입(현 `.catch`로 충분)
- 공유 컴포넌트 추출
- 임계값·limit 외부화
- 디자인 토큰 통일

→ 가치는 있으나 별도 요청·합의 후 독립 PR로 다루는 것이 적절.
