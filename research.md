# Dashboard Research — 구현 현황

> 작성일: 2026-04-10 / 최종 업데이트: 2026-04-11  
> 이 문서는 **"어떻게 동작하나?"** 에 답한다.  
> 향후 계획 → `plan.md` | 백엔드 구현 → `../market-risk-radar/research.md`

---

## 1. 인프라 / 배포

### 전체 흐름

```
사용자 브라우저
  └─ dashboard.theorynx.com (Cloudflare Access 이메일 OTP)
       └─ Vercel CDN (Next.js 16 App Router, SSR + ISR)
            └─ api.theorynx.com (Cloudflare Tunnel → CNAME)
                 └─ localhost:3000 (맥미니 M4 Pro, NestJS 11)
```

### 레이턴시 특성

| 경로 | 지연 | 비고 |
|------|------|------|
| 브라우저 → Vercel (TTFB) | ~200ms | loading.tsx 스켈레톤 즉시 표시 |
| Vercel → NestJS (첫 요청) | ~1–2s | Vercel US/EU → 한국 맥미니 |
| Vercel 엣지 캐시 히트 | ~0ms | revalidate: 30 이내 재요청 |

### 환경변수

| 변수 | 용도 | 위치 |
|------|------|------|
| `NEXT_PUBLIC_API_URL` | 백엔드 베이스 URL (`https://api.theorynx.com`) | Vercel 대시보드 + `.env.local` |
| `CF_ACCESS_CLIENT_ID` | Cloudflare Access Service Token ID | Vercel 대시보드 (Server-side only) |
| `CF_ACCESS_CLIENT_SECRET` | Cloudflare Access Service Token Secret | Vercel 대시보드 (Server-side only) |

- `NEXT_PUBLIC_API_URL` 미설정 시 `http://localhost:3000` fallback (`lib/api.ts:1`)
- `CF_ACCESS_*` 미설정 시 헤더 없이 전송 (`lib/api.ts:6–12`) — 로컬 개발용
- 로컬 대시보드 개발 서버는 `npm run dev` 기준 `3001` 포트 사용
- 운영 배포는 로컬 빌드가 아니라 Git 커밋 이후 Vercel 자동 배포로 반영

---

## 2. Tech Stack

| 항목 | 버전 | 용도 |
|------|------|------|
| Next.js | 16.2.2 | App Router, RSC, ISR |
| React | 19.2.4 | UI 렌더링 |
| TypeScript | 5.x | 전체 타입 안전 |
| Tailwind CSS | v4 | 유틸리티 스타일링 |
| Recharts | 3.8.1 | NAV 차트 (Client Component) |
| lucide-react | 1.7.0 | 아이콘 |
| clsx | 2.1.1 | 조건부 className |

---

## 3. 파일 구조

```
app/
  layout.tsx                # 루트 레이아웃 (Navigation 사이드바 포함)
  globals.css               # Tailwind 기본 스타일
  loading.tsx               # Overview 스켈레톤
  page.tsx                  # Overview — A 성과 + A/B/KOSPI NAV 차트 + 60일 누적/초과수익률 요약 + B 요약 + G1~G6 패널

  positions/
    loading.tsx
    page.tsx                # Portfolio A(리밸런싱) + B(신호 기반) 포지션

  signals/
    loading.tsx
    page.tsx                # signal_candidate 목록 + 카테고리별 통계

  alerts/
    loading.tsx
    page.tsx                # Slack 알림 발송 현황 + 최근 50건 목록

  event-returns/
    loading.tsx
    page.tsx                # event_return 카테고리별 수익률 테이블

  trades/
    loading.tsx
    page.tsx                # 체결 내역 (A/B 클라이언트 필터)

  operations/
    loading.tsx
    page.tsx                # 파이프라인 운영 현황 (퍼널 + KPI + 비용)

  api/
    health/route.ts         # 헬스체크 엔드포인트 (Vercel → NestJS 연결 확인용)

components/
  Navigation.tsx            # 좌측 고정 사이드바 (Client Component, usePathname)
  NavChart.tsx              # Recharts AreaChart 래퍼 (Client Component)
  StatCard.tsx              # 통계 카드 UI (Server Component)
  AlertsTable.tsx           # 알림 테이블 + 채널 필터 + 상세 모달 (Client Component)
  TradesTable.tsx           # 거래 테이블 + A/B 필터 (Client Component)

lib/
  api.ts                    # 백엔드 API 클라이언트 + 11개 TypeScript 타입 + normalizer
```

---

## 4. 아키텍처 패턴

### Server vs Client Component 분류

| 파일 | 종류 | 이유 |
|------|------|------|
| `app/*/page.tsx` | Server Component (기본) | data fetch, 상태 없음 |
| `components/StatCard.tsx` | Server Component | 순수 표시, 인터랙션 없음 |
| `components/Navigation.tsx` | Client Component (`'use client'`) | `usePathname()` 훅 |
| `components/NavChart.tsx` | Client Component (`'use client'`) | Recharts (브라우저 DOM 의존) |
| `components/TradesTable.tsx` | Client Component (`'use client'`) | A/B 필터 `useState` |

### 데이터 페치 전략

```typescript
// lib/api.ts
async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    next: { revalidate: 30 },   // Vercel Data Cache 30초
    headers: CF_HEADERS,         // Cloudflare Access 인증
  });
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}`);
  return res.json();
}
```

- 모든 page.tsx: `Promise.all([...])` 병렬 fetch
- 실패 방어: `.catch(() => [])` / `.catch(() => null)` — 개별 API 실패 시 빈 상태 렌더링
- `export const dynamic = 'force-dynamic'` → 사용 최소화 (alerts 페이지만 적용 중)

### Streaming SSR + Suspense

```
1. HTML 첫 청크(레이아웃 + 스켈레톤) → TTFB ~200ms에 브라우저 전달
2. Server Component 데이터 페치 (~1-2s)
3. 완료 후 스트리밍으로 실제 콘텐츠 교체
```

`loading.tsx` 파일 → Next.js App Router가 자동으로 `<Suspense fallback={<Loading />}>` 경계 생성

---

## 5. 페이지별 구현 상세

### Overview (`app/page.tsx`)

**API 호출**
```typescript
Promise.all([
  api.navHistory(60),      // GET /api/paper-trading/nav/history?limit=60
  api.benchmarkNavHistory(60), // GET /api/paper-trading/benchmark/nav/history?limit=60
  api.performance(),       // GET /api/paper-trading/performance
  api.bStats(),            // GET /api/paper-trading/b/stats
  api.bPerformance(),      // GET /api/paper-trading/b/performance
  api.signalStats(),       // GET /api/signal/stats  (G2/G3 계산용)
  api.dashboardStats(),    // GET /api/stats         (G6 계산용)
  api.rebalanceCount(),    // GET /api/paper-trading/rebalance-count   (G1 정확 집계용)
])
```

**렌더링 구조**
1. Portfolio A 섹션: StatCard × 8 (총수익률, NAV, MDD, Sharpe, alpha, 승률, 평균수익, 평균손실)
2. Portfolio B 섹션: StatCard × 4 (오픈포지션, 총 거래, 실현손익, Sharpe/MDD)
3. 60일 누적수익률 요약: A/B/KOSPI 3개 카드
4. 60일 초과수익률 요약: A-KOSPI, B-KOSPI 2개 카드
5. NAV 차트: `NavChart` (Portfolio A/B/KOSPI 60일 비교 AreaChart)
6. 하단 메타: 기간, CAGR, Profit Factor
7. **G1~G6 게이트 패널**: GateCard × 6, 달성 카운터 뱃지

**G1~G6 판정 로직** (`computeGates()`)

```typescript
const GATE_THRESHOLDS = {
  dm5d: 0.55,          // G2
  minEventCount: 50,   // G2: 표본 최소 기준
  mdd: 0.30,           // G5
  sharpe: 0.5,         // G4
  costPerDay: 3.0,     // G6
};
```

| 게이트 | 판정 소스 | 로직 |
|--------|---------|------|
| G1 | `rebalanceCount()` | Portfolio A `paper_trade` distinct `tradeDate` 정확 집계 |
| G2 | `signalStats` | eventCount ≥ 50인 카테고리 중 dm5d 최고값 ≥ 0.55 |
| G3 | `signalStats` | CONTRACT_WIN `avgAlpha5d` ≥ 0 |
| G4 | `bPerformance` | 60거래일 이상이면 Sharpe ≥ 0.5 판정, 미만이면 `pending` |
| G5 | `performance` + `bPerformance` | A/B 모두 `maxDrawdown < 0.30`이면 `pass`, B 표본 부족 시 `watch` |
| G6 | `dashboardStats` | `estimatedDailyCostUsd` ≤ 3.0 |

GateStatus: `'pass'`(초록) / `'watch'`(노랑) / `'fail'`(빨강) / `'pending'`(회색)

---

### Positions (`app/positions/page.tsx`)

**API 호출**
```typescript
Promise.all([
  api.positions(),     // GET /api/paper-trading/positions (Portfolio A)
  api.bPositions(),    // GET /api/paper-trading/b/positions (Portfolio B OPEN)
  api.bStats(),        // GET /api/paper-trading/b/stats
])
```

**렌더링 구조**
- `PositionTableA`: 종목, 수량, 평균단가, 평가금액(만원), 기준일
- `PositionTableB`: 종목, 평균단가, 손절가(빨강), 청산 예정일 + D-N 잔여일, 상태 뱃지
  - `daysUntil()`: targetExitDate → 오늘 기준 잔여 일수 계산
  - 잔여 ≤ 1일: 노랑 강조 (`text-amber-400`)

---

### Signals (`app/signals/page.tsx`)

**API 호출**
```typescript
Promise.all([
  api.signalCandidates(50),  // GET /api/signal/candidates?limit=50
  api.signalStats(),          // GET /api/signal/stats
])
```

**카테고리 배지 색상 (8개 정의)**

| 카테고리 | 색상 |
|----------|------|
| EARNINGS_BEAT | 초록 (`bg-emerald-900`) |
| EARNINGS_MISS | 빨강 (`bg-red-900`) |
| CONTRACT_WIN | 파랑 (`bg-blue-900`) |
| CONTRACT_LOSS | 주황 (`bg-orange-900`) |
| GUIDANCE_UP | 청록 (`bg-teal-900`) |
| GUIDANCE_DOWN | 황색 (`bg-amber-900`) |
| REGULATORY_ACTION | 장미 (`bg-rose-900`) |
| DILUTION | 보라 (`bg-purple-900`) |
| 기타 | 회색 (`bg-zinc-800`) |

**렌더링 구조**
1. 카테고리별 통계 테이블: 이벤트 수, 방향일치 1d/5d, α 1d/5d
2. signal_candidate 목록: 종목(이름+코드), 카테고리 뱃지, 방향(▲/▼), confidence%, ret_1d, ret_5d, α_5d, 날짜

---

### Alerts (`app/alerts/page.tsx`)

**API 호출**
```typescript
Promise.all([
  api.alertStats(),       // GET /api/alert/stats
  api.recentAlerts(50),   // GET /api/alert/recent?limit=50
])
```
`export const dynamic = 'force-dynamic'` — 알림 특성상 ISR 캐시 대신 항상 최신 데이터 조회

**렌더링 구조**
1. StatCard × 4: 총 알림, 발송 성공(+비율), 발송 실패(+비율), 평균 임팩트
2. 채널 필터 버튼: `ALL` + 채널별 필터, 필터된 건수/SENT/FAILED 요약
3. 최근 50건 테이블: 종목 뱃지+제목, 채널, 임팩트 스코어, 발송 상태 뱃지, 시각
4. 행 클릭 상세 모달: 관련 종목/섹터, 채널 ID, 발송/게시 시각(KST), 오류 메시지, 원문 링크

**발송 상태 뱃지 색상**
```typescript
const STATUS_STYLE = {
  SENT:    'bg-emerald-950 text-emerald-300',
  RETRIED: 'bg-blue-950 text-blue-300',
  FAILED:  'bg-red-950 text-red-300',
  PENDING: 'bg-zinc-800 text-zinc-300',
};
```

---

### Event Returns (`app/event-returns/page.tsx`)

**API 호출**
```typescript
api.signalStats()  // GET /api/signal/stats  (event_return 집계 포함)
```

**렌더링 구조**
1. 요약 카드 × 3: 총 이벤트, 평균 방향일치 5d (G2 목표 ≥55% 비교), 평균 α 5d
2. 카테고리별 수익률 테이블 (eventCount 내림차순 정렬)
   - 방향일치 5d: 진행바 (`dmBar`) — 55% 이상 시 초록, 미만 시 회색

---

### Trades (`app/trades/page.tsx` + `components/TradesTable.tsx`)

**API 호출**
```typescript
api.trades(100)  // GET /api/paper-trading/trades?limit=100
```

**렌더링 구조**
- 상단 카드 4개: 최근 체결 수, BUY 수, SELL 수, 총 체결 금액
- `TradesTable` (Client Component): A/B 탭 필터 + 거래 내역 테이블

---

### Operations (`app/operations/page.tsx`)

**API 호출**
```typescript
Promise.all([
  api.dashboardStats(),  // GET /api/stats
  api.costHistory(30),   // GET /api/stats/cost/history?days=30
])
```

**렌더링 구조**
1. KPI 카드 × 6: 오늘 수집, 예상 일비용($), Gate1 통과율, 분류 성공률, 알림 발송률, Backstop 적용 건수
2. 파이프라인 퍼널 (`PipelineFunnel`): 수집 → Gate1 통과 → 분류 성공 → 알림 발송 (CSS 비율바, ingest.total 기준)
3. 소스 타입 비율 (`SourceTypeBar`): NEWS(파랑) / DART(황) 비율바
4. LLM 분류 상세: 전체/성공/실패/대기/평균임팩트 리스트
5. 비용 추이 차트 (`CostHistoryChart`): Claude 비용 30일 라인차트

---

## 6. 컴포넌트 상세

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
- Server Component (상태 없음)

### NavChart

```typescript
// props
datasets: Array<{ key: string; label: string; color: string; data: PortfolioNav[] | BenchmarkNavPoint[] }>
```
- `PortfolioNav[]` / `BenchmarkNavPoint[]` 수신 → `navDate` 기준 병합 → Recharts `AreaChart`
- Y축: 원화 백만 단위(`M`) 포맷
- 벤치마크는 `069500` 종가를 첫 관측일 기준 `1억원` 가상 NAV로 환산한 시계열
- Client Component (`'use client'`) — Recharts 브라우저 의존

### Navigation

- `NAV` 배열 7개 항목 (href, label, icon)
- `path === href` 정확 일치 시 `bg-blue-600` 활성
- 데스크탑: `fixed inset-y-0 left-0 w-56` 고정 사이드바
- 모바일: `translate-x-full` → 햄버거 버튼으로 오버레이 열기

**현재 메뉴 목록**

| 라벨 | 경로 | 아이콘 |
|------|------|--------|
| Overview | `/` | LayoutDashboard |
| Positions | `/positions` | Briefcase |
| Signals | `/signals` | Zap |
| Alerts | `/alerts` | Bell |
| Event Returns | `/event-returns` | TrendingUp |
| Trades | `/trades` | History |
| Operations | `/operations` | Activity |

---

## 7. lib/api.ts 타입 정의

| 타입 | 대응 백엔드 엔티티/API | 비고 |
|------|----------------------|------|
| `PortfolioNav` | `portfolio_nav` 테이블 | B 포함 (`portfolioType` 컬럼) |
| `Performance` | `/api/paper-trading/performance` 집계 | Portfolio A 전용 |
| `PaperPosition` | `paper_position` 테이블 | B 전용 컬럼: `targetExitDate`, `stopLossPrice`, `status` |
| `PaperTrade` | `paper_trade` 테이블 | `portfolioType` 포함 |
| `SignalCandidate` | `signal_candidate` 테이블 | `confidence`, `category` 포함 (`signalScore`는 저장되지만 UI 비노출) |
| `SignalTagStats` | `/api/signal/stats` 집계 | `directionMatch*Rate`, `avgAlpha*` |
| `AlertStats` | `/api/alert/stats` 집계 | 누계 통계 |
| `RecentAlert` | `/api/alert/recent` | 제목, 채널, 발송 상태 포함 |
| `PortfolioBStats` | `/api/paper-trading/b/stats` | `closedPnl`, `stoppedCount` |
| `DashboardStats` | `/api/stats` | 파이프라인 전체 집계 |

### Normalizer 역할

TypeORM이 numeric 컬럼을 string으로 직렬화하는 경우가 있어, 모든 숫자 필드는 `n()` / `nNull()` 헬퍼로 명시 변환:

```typescript
const n = (v: unknown) => (v == null ? 0 : Number(v));
const nNull = (v: unknown) => (v == null ? null : Number(v));
```

---

## 8. 스켈레톤 (`loading.tsx`) 현황

| 파일 | 구성 |
|------|------|
| `app/loading.tsx` | 제목 + 스탯카드 8+4개 + 차트 영역 |
| `app/positions/loading.tsx` | 포트폴리오 박스 2개 (각 테이블 4행) |
| `app/signals/loading.tsx` | 통계 카드 + 목록 8행 |
| `app/alerts/loading.tsx` | 스탯카드 4개 + 테이블 6행 |
| `app/event-returns/loading.tsx` | 요약 카드 3개 + 테이블 6행 |
| `app/trades/loading.tsx` | 스탯카드 4개 + 테이블 8행 |
| `app/operations/loading.tsx` | 스탯카드 6개 + 퍼널 4행 + 2-col 하단 |

모두 `animate-pulse` + `bg-zinc-800` 블록 구성. 스켈레톤 없으면 데이터 로딩 중 빈 화면 → **페이지 추가 시 반드시 함께 생성**.

---

## 9. 백엔드 API 의존 현황

| 프론트 API 메서드 | 백엔드 엔드포인트 | 캐시 전략 |
|-----------------|----------------|---------|
| `api.navHistory(n)` | `GET /api/paper-trading/nav/history?limit=n` | revalidate: 30 |
| `api.performance()` | `GET /api/paper-trading/performance` | revalidate: 30 |
| `api.positions()` | `GET /api/paper-trading/positions` | revalidate: 30 |
| `api.trades(n)` | `GET /api/paper-trading/trades?limit=n` | revalidate: 30 |
| `api.bPositions()` | `GET /api/paper-trading/b/positions` | revalidate: 30 |
| `api.bStats()` | `GET /api/paper-trading/b/stats` | revalidate: 30 |
| `api.signalCandidates(n)` | `GET /api/signal/candidates?limit=n` | revalidate: 30 |
| `api.signalStats()` | `GET /api/signal/stats` | revalidate: 30 |
| `api.alertStats()` | `GET /api/alert/stats` | revalidate: 30 |
| `api.recentAlerts(n)` | `GET /api/alert/recent?limit=n` | alerts 페이지에서 `force-dynamic` |
| `api.dashboardStats()` | `GET /api/stats` | revalidate: 30 |
| `api.costHistory(n)` | `GET /api/stats/cost/history?days=n` | revalidate: 30 |
| `api.benchmarkNavHistory(n)` | `GET /api/paper-trading/benchmark/nav/history?limit=n` | revalidate: 30 |

### 아직 없는 API (plan.md 후속 항목 참조)

| 필요 엔드포인트 | 용도 | 백엔드 작업 난이도 |
|---------------|------|-----------------|
| `/api/paper-trading/b/nav/history` | Portfolio B NAV 추이 | 완료 (Overview A/B 비교 차트 반영) |
| `/api/paper-trading/b/performance` | Portfolio B Sharpe/MDD/alpha | 완료 |
| `/api/stats/cost/history?days=30` | 일별 Claude 비용 추이 | 완료 |
| `/api/signal/candidates` (event_return JOIN) | 신호 × 실현 수익 연결 | 완료 |
