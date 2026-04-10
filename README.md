# Market Risk Radar Dashboard

Next.js 16 기반 개인용 프론트엔드 대시보드 프로젝트입니다.  
백엔드 `/Users/jys/market-risk-radar/market-risk-radar` 의 Portfolio, Signal, Alert, Event Return 데이터를 시각화합니다.

## 역할

- Portfolio A/B 현황 모니터링
- `signal_candidate` 및 `event_return` 통계 조회
- Slack alert 발송 현황 확인
- G1~G6 실전 전환 게이트 진행 상태 표시
- 운영 지표(수집, Gate1, 분류, 비용, 알림) 시각화

## 로컬 개발

백엔드는 기본적으로 `http://localhost:3000` 을 사용하므로, 대시보드는 `3001` 포트로 실행합니다.

```bash
npm install
npm run dev
```

브라우저: `http://localhost:3001`

## 환경변수

`.env.local` 예시:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3000
CF_ACCESS_CLIENT_ID=
CF_ACCESS_CLIENT_SECRET=
```

- `NEXT_PUBLIC_API_URL`: NestJS 백엔드 주소
- `CF_ACCESS_*`: Cloudflare Access 보호 환경에서만 필요
- 로컬 백엔드가 직접 열려 있다면 `CF_ACCESS_*`는 비워도 됩니다

## 주요 페이지

- `/` Overview
- `/positions`
- `/signals`
- `/alerts`
- `/event-returns`
- `/trades`
- `/operations`

## 주요 파일

- `lib/api.ts`: 백엔드 API 클라이언트와 normalizer
- `app/page.tsx`: Overview
- `components/Navigation.tsx`: 사이드바
- `components/NavChart.tsx`: NAV 차트
- `components/AlertsTable.tsx`: 알림 상세/필터 테이블
- `components/TradesTable.tsx`: Portfolio A/B 거래 필터 테이블

## 참고 문서

- `CLAUDE.md`: 작업 규칙
- `plan.md`: 프론트 개발 계획
- `research.md`: 현재 구현 현황
- 백엔드 계획: `/Users/jys/market-risk-radar/market-risk-radar/plan.md`

## 운영 메모

- 이 프로젝트는 프론트엔드만 담당합니다. DB 직접 접근은 없습니다.
- 커밋 후 Vercel 자동 배포는 사용자가 직접 관리합니다.
- `NEXT_PUBLIC_API_URL`을 지정하지 않으면 `http://localhost:3000`을 사용합니다.
