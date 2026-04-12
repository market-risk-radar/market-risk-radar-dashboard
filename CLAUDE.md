@AGENTS.md

# 작업 규칙

> **프론트엔드(이 프로젝트)는 로컬 빌드와 커밋/푸시를 직접 실행하지 않는다. 코드 수정만 하고, 커밋 후 Vercel 배포 관리는 사용자가 직접 진행한다.**

# Market Risk Radar — Dashboard

## 프로젝트 개요

NestJS 백엔드(`api.theorynx.com`)의 포트폴리오/신호/이벤트 데이터를 시각화하는 개인용 모니터링 대시보드.  
**배포**: Vercel (dashboard.theorynx.com) — 프론트엔드 전용, 백엔드는 Cloudflare Tunnel 경유 로컬 서버  
**인증**: Cloudflare Access (이메일 OTP)

## Tech Stack

- **Next.js 16** (App Router, React Server Components)
- **React 19**, **TypeScript 5**
- **Tailwind CSS v4**
- **Recharts 3** — NAV 차트
- **lucide-react** — 아이콘
- **clsx** — 조건부 className
- **Vercel** — 배포/호스팅

## 파일 구조

```
app/
  layout.tsx              # 루트 레이아웃 (Navigation 사이드바 포함)
  loading.tsx             # Overview 스켈레톤
  page.tsx                # Overview — Portfolio A 성과 요약 + A/B/KOSPI(1억원 기준) NAV 비교 차트 + 60일 누적/초과수익률 요약(표본 일수/표본 부족 배지 포함)

  positions/
    loading.tsx           # 스켈레톤
    page.tsx              # Portfolio A(리밸런싱, 기준단가) + B(신호 기반, 진입가) 포지션

  signals/
    loading.tsx
    page.tsx              # signal_candidate 목록 + 실현 수익률(ret_1d/5d, alpha_5d) + 카테고리별 통계(표본 부족 배지)

  alerts/
    loading.tsx
    page.tsx              # Slack 알림 발송 현황 통계

  event-returns/
    loading.tsx
    page.tsx              # event_return 카테고리별 수익률 테이블(표본 부족 배지)

  operations/
    loading.tsx
    page.tsx              # 파이프라인 운영 현황 + Claude 비용 30일 차트

components/
  Navigation.tsx          # 좌측 고정 사이드바 (Client Component)
  NavChart.tsx            # Recharts AreaChart 래퍼 (Client Component)
  CostHistoryChart.tsx    # Recharts LineChart 래퍼 (Client Component)
  StatCard.tsx            # 통계 카드 UI

lib/
  api.ts                  # 백엔드 API 클라이언트 + TypeScript 타입 정의 (G1: rebalance-count, G4/G5: b/performance, benchmark/nav/history 포함)
```

## 핵심 패턴

### API 호출 (`lib/api.ts`)
- `next: { revalidate: 30 }` — Vercel 엣지 캐시 30초, 반복 요청 시 한국 서버 왕복 없이 응답
- 모든 page.tsx는 `Promise.all([...])` 병렬 fetch + `.catch(() => []/null)` 에러 핸들링
- `NEXT_PUBLIC_API_URL` 환경변수로 베이스 URL 주입 (Vercel: `https://api.theorynx.com`)

### 스켈레톤 (loading.tsx)
- Next.js App Router 규약: `loading.tsx`는 자동으로 `<Suspense>` 경계를 생성
- TTFB(~200ms)에 즉시 표시, 데이터 로딩(~1-2s) 동안 스켈레톤 노출
- `animate-pulse` + `bg-zinc-800` 블록으로 구성

### Server vs Client Component
- page.tsx — Server Component (data fetch)
- NavChart.tsx, Navigation.tsx — `'use client'` (Recharts/hooks 사용)
- StatCard.tsx — Server Component (순수 UI)

## 환경변수

```bash
NEXT_PUBLIC_API_URL=https://api.theorynx.com   # Vercel 배포 시
# 로컬 개발 시 미설정 → http://localhost:3000 fallback
```

## Commands

```bash
npm run dev      # 로컬 개발 서버 (Next.js, port 3001)
npm run lint     # ESLint
```

## 배포 구조

```
사용자 브라우저
  └─ dashboard.theorynx.com (Vercel CDN)
       └─ Server Components → api.theorynx.com (Cloudflare Tunnel)
            └─ localhost:3000 (MacBook, NestJS)
```

- **첫 요청**: Vercel → Cloudflare → 로컬 (~1-2s 지연)
- **30초 캐시 히트**: Vercel 엣지에서 즉시 응답 (~50ms)

## 주의사항

- `synchronize` 없음 — 프론트는 API만 소비, DB 직접 접근 없음
- Recharts는 Client Component에서만 사용 (SSR 불가)
- `revalidate: 30` 조정 시 실시간성 vs 성능 트레이드오프 고려
- 페이지 추가 시 반드시 `loading.tsx` 함께 생성 (스켈레톤 없으면 빈 화면)

> 상세 구현 현황 → `research.md`  
> 향후 개발 계획 → `plan.md`
