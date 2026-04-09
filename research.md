# Dashboard Research — 구현 현황

> 이 문서는 대시보드 프론트엔드의 실제 구현 상태를 기록한다.  
> "어떻게 동작하나?" 질문에 답한다.

---

## 인프라 / 배포

### 전체 흐름

```
브라우저
  └─ dashboard.theorynx.com
       └─ Vercel (CDN + Edge, Next.js Server Components 실행)
            └─ api.theorynx.com (CNAME → Cloudflare Tunnel)
                 └─ localhost:3000 (MacBook, NestJS API)
```

- **Vercel**: Next.js 앱 호스팅. `main` 브랜치 push → 자동 배포
- **Cloudflare Tunnel**: 로컬 MacBook의 NestJS를 인터넷에 노출 (`api.theorynx.com`)
- **Cloudflare Access**: `dashboard.theorynx.com` 이메일 OTP 인증 게이트
  - Access 정책: 본인 이메일만 허용
  - `api.theorynx.com`에는 별도 Access 앱 추가 예정

### 레이턴시 특성

| 경로 | 지연 |
|------|------|
| 브라우저 → Vercel (TTFB) | ~200ms |
| Vercel → api.theorynx.com (첫 요청) | ~1-2s (Vercel US/EU → 한국) |
| Vercel 캐시 히트 (30s 이내 재요청) | ~0ms (엣지 서빙) |

---

## 아키텍처

### Next.js App Router 패턴

**Server Component (기본값)**
- `app/*/page.tsx` — 데이터 페치 + 렌더링
- `components/StatCard.tsx` — 순수 UI, 상태 없음

**Client Component (`'use client'`)**
- `components/Navigation.tsx` — `usePathname()` 훅 사용
- `components/NavChart.tsx` — Recharts (브라우저 DOM 의존)

**Streaming SSR + Suspense**
- `app/*/loading.tsx` 파일 → 자동으로 `<Suspense fallback={<Loading />}>` 경계 생성
- 흐름: HTML 첫 청크(레이아웃+스켈레톤) → TTFB에 전송 → 데이터 준비되면 스트리밍 완료

### 데이터 페치 전략

```typescript
// lib/api.ts
async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { next: { revalidate: 30 } });
  ...
}
```

- `revalidate: 30`: Vercel Data Cache에 30초 보관. 동일 URL 재요청 시 캐시 서빙
- 모든 page.tsx는 `Promise.all()` 병렬 페치
- 에러 핸들링: `.catch(() => [])`/`.catch(() => null)` — 개별 API 실패 시 빈 상태로 렌더링

---

## 페이지별 구현

### Overview (`app/page.tsx`)

**API 호출**
```
Promise.all([
  api.navHistory(60),    → GET /api/paper-trading/nav/history?limit=60
  api.performance(),     → GET /api/paper-trading/performance
])
```

**렌더링**
- StatCard × 8: 총수익률, 현재NAV, MDD, 샤프비율, 알파, 승률, 평균수익, 평균손실
- NavChart: `totalNav` 60일 AreaChart (Recharts)
- 하단 메타: 기간, CAGR, Profit Factor
- 현재 Portfolio A 전용. B 요약은 미구현(→ plan.md D-1)

### Positions (`app/positions/page.tsx`)

**API 호출**
```
Promise.all([
  api.positions(),    → GET /api/paper-trading/positions (Portfolio A)
  api.bPositions(),   → GET /api/paper-trading/b/positions (Portfolio B)
  api.bStats(),       → GET /api/paper-trading/b/stats
])
```

**렌더링**
- Portfolio A: 포지션 테이블 (종목, 수량, 평균단가, 기준일, 상태)
- Portfolio B: 동일 포지션 테이블 + B 통계 박스 (오픈 포지션 수, 총 체결, 실현 손익, 청산/손절)
- 빈 포지션 시 "보유 포지션 없음" 메시지

### Signals (`app/signals/page.tsx`)

**API 호출**
```
Promise.all([
  api.signalCandidates(50),  → GET /api/signal/candidates?limit=50
  api.signalStats(),         → GET /api/signal/stats
])
```

**렌더링**
- 상단: 카테고리별 통계 테이블 (이벤트 수, 방향일치 1d/5d, α 1d/5d)
- 하단: signal_candidate 목록 (종목, 카테고리 뱃지, 방향, confidence, signalScore, 날짜)
- 카테고리 뱃지 색상: EARNINGS_BEAT(초록), EARNINGS_MISS(빨강), CONTRACT_WIN(파랑), GUIDANCE_UP(청록), GUIDANCE_DOWN(주황)

### Alerts (`app/alerts/page.tsx`)

**API 호출**
```
api.alertStats()  → GET /api/alert/stats
```

**렌더링**
- StatCard × 4: 총 알림, 발송 성공(+비율), 발송 실패(+비율), 평균 임팩트 스코어
- 개별 알림 목록은 미구현(→ plan.md D-3, 백엔드 API 필요)

### Event Returns (`app/event-returns/page.tsx`)

**API 호출**
```
api.signalStats()  → GET /api/signal/stats
```
(signal/stats API를 재사용 — event_return 집계 포함)

**렌더링**
- 요약 카드 × 3: 총 이벤트, 평균 방향일치 5d(G2 목표 ≥55% 표시), 평균 α 5d
- 테이블: 카테고리, 이벤트 수, 방향일치 5d 진행바, 수익률 1d/5d, α 1d/5d
- `eventCount > 0` 필터링, `eventCount` 내림차순 정렬

---

## 컴포넌트

### StatCard

```typescript
interface Props {
  label: string;
  value: string | number;
  sub?: string;
  trend?: 'up' | 'down' | 'neutral';
}
```
- `trend='up'` → `text-emerald-400`, `'down'` → `text-red-400`, 나머지 → `text-white`

### NavChart

- `PortfolioNav[]` 배열 수신 → `navDate` 기준 정렬 후 Recharts AreaChart 렌더링
- Y축: 원화 단위 `M` (백만) 포맷
- Tooltip: `(v ?? 0) / 1_000_000` 처리 (undefined 방어)
- 그라디언트 fill: `#3b82f6` 불투명도 0.3 → 0

### Navigation

- `NAV` 배열로 5개 메뉴 정의
- 현재 경로 `path === href` 정확 일치 시 `bg-blue-600` 활성 스타일
- `fixed inset-y-0 left-0 w-56` 고정 사이드바

---

## lib/api.ts 타입 정의

| 타입 | 대응 백엔드 엔티티 |
|------|-----------------|
| `PortfolioNav` | portfolio_nav |
| `Performance` | paper-trading/performance 집계 |
| `PaperPosition` | paper_position |
| `PaperTrade` | paper_trade |
| `SignalCandidate` | signal_candidate |
| `SignalTagStats` | signal/stats 집계 |
| `AlertStats` | alert/stats 집계 |
| `PortfolioBStats` | paper-trading/b/stats 집계 |

---

## 스켈레톤 (`loading.tsx`) 현황

| 파일 | 스켈레톤 구성 |
|------|------------|
| `app/loading.tsx` | 제목 + 스탯카드 8개 + 차트 영역 |
| `app/positions/loading.tsx` | 포트폴리오 카드 2개 (각 4행) |
| `app/signals/loading.tsx` | 카드 2개 (통계 5행 + 목록 8행) |
| `app/alerts/loading.tsx` | 스탯카드 4개 |
| `app/event-returns/loading.tsx` | 요약 카드 3개 + 테이블 6행 |

---

## 환경변수

| 변수 | 용도 | Vercel 설정값 |
|------|------|-------------|
| `NEXT_PUBLIC_API_URL` | 백엔드 베이스 URL | `https://api.theorynx.com` |

로컬 미설정 시 `http://localhost:3000` fallback (lib/api.ts:1).
