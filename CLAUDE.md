@AGENTS.md

# 작업 규칙

> **Claude는 브랜치 생성·커밋·푸시·`gh pr create`까지 수행한다. PR merge와 Vercel 배포 관리는 사용자가 직접 진행한다.** (로컬 프로덕션 빌드 트리거·Vercel env·도메인 작업은 Claude가 직접 하지 않고 명령만 안내한다.)

## Git 워크플로우 (커밋·브랜치 컨벤션)

백엔드 repo(`market-risk-radar`)와 동일한 컨벤션을 따른다. 모든 작업은 **브랜치 → PR → merge** 로 main에 들어간다. **main 직접 커밋 금지.**

### 커밋 메시지
형식: `<type>: <한글 설명>` — Conventional Commits 간소화형 (scope 생략)

| type | 용도 |
|------|------|
| `feat` | 새 페이지·컴포넌트·기능 |
| `fix` | 버그 수정·동작 교정 |
| `docs` | 문서만 변경 (CLAUDE / AGENTS / research / plan / README) |
| `refactor` | 동작 변화 없는 구조 변경 |
| `chore` | 빌드·설정·의존성 |
| `hotfix` | 긴급 운영 수정 |

- 설명은 한글로 간결하게 (예: `feat: event-returns 페이지 추가`)
- 독립적인 변경은 한 PR 안에서도 **커밋 단위로 분리**한다
- Claude가 만든 커밋은 푸터에 `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>` 포함

### 브랜치 네이밍
형식: `<type>/<설명>` — type은 커밋 type과 동일 집합

- 단어 구분자는 **언더스코어(`_`)** 로 통일
- 한글·영문 모두 허용 (예: `feat/signals_정렬추가`, `fix/nav_차트_축교정`, `docs/claude_현행화`)

### PR
- base: `main`, 머지 방식: **merge commit** (squash 아님 — PR 단위 history 보존)
- 제목은 대표 변경 1줄, 본문에 변경 요약 + 검증 방법(`npm run lint` 통과 여부 등)
- Claude가 생성하는 PR 본문 끝에 `🤖 Generated with [Claude Code](https://claude.com/claude-code)`
- gh CLI 인증됨 — Claude가 `gh pr create` 로 PR 생성 (머지는 사람이 확인 후)

# Market Risk Radar — Dashboard

## 프로젝트 개요

NestJS 백엔드(`api.theorynx.com`)의 포트폴리오/신호/이벤트 데이터를 시각화하는 개인용 모니터링 대시보드.  
**배포**: Vercel (dashboard.theorynx.com) — 프론트엔드 전용, 백엔드는 Cloudflare Tunnel 경유 로컬 서버  
**인증**: Cloudflare Access + Auth.js v5 Google OAuth + NestJS Redis 단일 세션 검증

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
  page.tsx                # Overview — Portfolio A 성과 요약 + A/B/KOSPI(1억원 기준) NAV 비교 차트 + 60일 누적/초과수익률 요약(표본 일수/표본 부족 배지 포함) + G2 통과/후보 카테고리 요약

  positions/
    loading.tsx           # 스켈레톤
    page.tsx              # Portfolio A(리밸런싱, 기준단가) + B(신호 기반, 진입가) 포지션

  signals/
    loading.tsx
    page.tsx              # signal_candidate 목록 + 실현 수익률(ret_1d/5d, alpha_5d) + 카테고리별 통계(`event / filled`, 표본 부족/G2 상태 배지, G2 우선 정렬)

  alerts/
    loading.tsx
    page.tsx              # Slack 알림 발송 현황 통계

  event-returns/
    loading.tsx
    page.tsx              # event_return 카테고리별 수익률 + α방향일치율 테이블(표본 부족 배지 + 대표 rawTags + G2 우선 정렬)

  operations/
    loading.tsx
    page.tsx              # 파이프라인 운영 현황 + Claude 비용 30일 차트

components/
  Navigation.tsx          # 좌측 고정 사이드바 (Client Component)
  NavChart.tsx            # Recharts AreaChart 래퍼 (Client Component)
  CostHistoryChart.tsx    # Recharts LineChart 래퍼 (Client Component)
  StatCard.tsx            # 통계 카드 UI

lib/
  api.ts                  # 백엔드 API 클라이언트 + TypeScript 타입 정의 (G1: rebalance-count, G2: alphaDirectionMatch, G4/G5: b/performance 포함)
```

## 핵심 패턴

### API 호출 (`lib/api.ts`)
- `next: { revalidate: 30 }` — Vercel 엣지 캐시 30초, 반복 요청 시 한국 서버 왕복 없이 응답
- 모든 page.tsx는 `Promise.all([...])` 병렬 fetch + `.catch(() => []/null)` 에러 핸들링
- `NEXT_PUBLIC_API_URL` 환경변수로 베이스 URL 주입 (Vercel: `https://api.theorynx.com`)
- Internal API는 `AUTH_INTERNAL_SECRET`를 헤더에 실어 호출하므로, 서버 환경변수 누락 시 보호된 백엔드 엔드포인트가 실패한다

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
AUTH_SECRET=<Auth.js JWT 시크릿>
AUTH_INTERNAL_SECRET=<백엔드와 공유하는 내부 시크릿>
BACKEND_URL=https://api.theorynx.com
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
- G2는 더 이상 `directionMatch5dRate 55%`가 아니라 `alphaDirectionMatch5dRate 45%` 기준이다. 표본 기준도 `eventCount`가 아니라 `filledCount ≥ 50`이다.
- 프론트는 G2를 자체 상수로 다시 판정하지 않고, `/api/signal/stats`의 `g2Eligible` / `g2Pass` 서버 필드를 기준으로 표시한다.

---

## Claude 코딩 원칙

### 1. 코딩 전 생각하기

가정을 먼저 확인한다. 확신이 없으면 구현 전에 묻는다.

- **API 응답 구조**: `lib/api.ts` 타입이 백엔드 실제 응답과 맞는지 먼저 확인한다. 백엔드가 먼저 배포됐는지 모르면 묻는다.
- **G2 판정 기준**: 프론트는 자체 상수로 재판정하지 않는다 — 서버 필드(`g2Eligible`, `g2Pass`) 기준임을 전제한다. 기준이 바뀐 것 같으면 plan.md를 확인한다.
- **Server vs Client Component**: Recharts/hooks가 필요한지, 인터랙션이 있는지 먼저 판단한다. 여러 선택이 있으면 트레이드오프를 제시하고 선택받는다.

### 2. 단순함 우선

요청된 것만 만든다. 투기적 기능·추상화·유연성은 추가하지 않는다.

- Server Component에서 fetch → 렌더로 충분한 것을 `useEffect`/`useState`로 클라이언트 처리하지 않는다.
- 새 Recharts 래퍼 컴포넌트를 만들기 전에 `NavChart.tsx` / `CostHistoryChart.tsx` 재사용 가능성을 먼저 확인한다.
- `StatCard` 변형이 필요하면 새 컴포넌트 분리 전 props 확장을 먼저 고려한다.
- Tailwind 클래스 정리, 색상 통일, 파일 구조 개편은 요청받지 않으면 하지 않는다.

### 3. 외과적 변경

요청 범위만 건드린다. 기존 코드를 개선하고 싶어도 언급만 하고 직접 바꾸지 않는다.

- 한 페이지를 수정할 때 다른 `page.tsx`, `loading.tsx`, `Navigation.tsx`는 건드리지 않는다.
- `lib/api.ts` 타입 변경 전 해당 타입을 사용하는 모든 페이지 범위를 먼저 파악한다.
- **내가 만든 변경으로 생긴 미사용 import만 제거한다.** 기존 dead code는 언급만 한다.
- 기존 스타일(Tailwind 다크 테마, `bg-zinc-*` 계열, prose 간격)을 그대로 따른다.

### 4. 목표 기반 실행

성공 기준을 먼저 정의한다. 검증 없이 완료 선언하지 않는다.

새 페이지 추가 3단계 체크리스트:
```
1. app/<route>/page.tsx 생성 → verify: 데이터 렌더 확인
2. app/<route>/loading.tsx 생성 → verify: 스켈레톤 노출 확인 (필수)
3. Navigation.tsx 메뉴 항목 추가 → verify: 사이드바 링크 작동 확인
```

- **배포 관련 작업(Vercel env, 도메인, 빌드 트리거)은 직접 실행하지 않는다.** 필요한 명령을 안내하고 사용자가 실행한다.
- `npm run lint` 는 수정 후 항상 통과 여부를 확인한다.
- `lib/api.ts` 타입 변경 시 TypeScript 컴파일 오류가 없는지 확인 기준으로 삼는다.

---

> 상세 구현 현황 → `research.md`  
> 향후 개발 계획 → `plan.md`
