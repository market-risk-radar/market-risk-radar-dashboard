# Dashboard Plan

> 백엔드 로드맵 → `/Users/jys/market-risk-radar/market-risk-radar/plan.md`

## 현재 상태 (2026-04-09)

### 구현 완료

| 페이지 | 경로 | 내용 |
|--------|------|------|
| Overview | `/` | Portfolio A 성과 8개 지표 + NAV 60일 차트 |
| Positions | `/positions` | Portfolio A 포지션 + Portfolio B 포지션 + B 통계 |
| Signals | `/signals` | signal_candidate 목록 + 카테고리별 α/방향일치 통계 |
| Alerts | `/alerts` | Slack 알림 발송 현황 (총/성공/실패/평균임팩트) |
| Event Returns | `/event-returns` | 이벤트 유형별 수익률 테이블 + 방향일치 진행바 |

### 성능 최적화 완료

- `next: { revalidate: 30 }` — Vercel 엣지 캐시 (한국 서버 왕복 횟수 대폭 감소)
- 모든 페이지에 `loading.tsx` 스켈레톤 (TTFB ~200ms에 즉시 표시)
- 모든 page.tsx `Promise.all` 병렬 fetch

---

## 단기 개선 (Phase 3-3 진행 중)

### D-1. Overview에 Portfolio B 요약 추가
**배경**: 현재 Overview는 Portfolio A만 표시. B가 신호 기반 포지션을 쌓기 시작하면 B 성과도 한 눈에 보여야 함.

- `api.bStats()` 결과를 Overview 하단에 별도 섹션으로 추가
- 오픈 포지션 수, 실현 손익, 청산 건수 표시
- Portfolio A/B 구분 뱃지 (`A` = 회색, `B` = 파랑)

### D-2. Trades 히스토리 페이지
**배경**: 현재 체결 내역 확인 경로가 없음. 디버깅·검증 시 필요.

- 새 페이지 `/trades` 추가
- `api.trades(100)` 호출, BUY/SELL 색상 구분
- portfolioType A/B 필터 (클라이언트 사이드)
- Navigation에 항목 추가

### D-3. Alerts 상세 목록 추가
**배경**: 현재 Alerts 페이지는 집계 통계만 표시. 개별 알림 내용 확인 불가.

- 백엔드에 `GET /api/alert/recent?limit=50` 엔드포인트 필요 (백엔드 작업)
- 엔드포인트 준비되면 테이블로 표시 (종목, 임팩트 스코어, 발송 시각, Slack 채널)

---

## 중기 계획 (Phase 4 연계)

### M-1. 백테스트 결과 페이지
**배경**: Phase 4에서 G1~G6 게이트 검증 결과가 나오면 대시보드에서 확인 필요.

- 새 페이지 `/backtest`
- 게이트별 통과율, 전략 수익 곡선 시각화
- 백엔드 API 확정 후 설계

### M-2. 실시간 새로고침 (SWR/Polling)
**배경**: `revalidate: 30`은 서버 렌더링 캐시라 사용자가 탭을 유지해도 자동 갱신 없음. 시장 시간 중 실시간성 필요 시 추가.

- Client Component에서 `setInterval` 또는 SWR/React Query 도입
- 포지션·신호 페이지 우선 (성과 지표는 일 단위라 불필요)
- 트레이드오프: 서버 부하 증가 vs 실시간성

### M-3. G1~G6 게이트 상태 인디케이터
**배경**: 백엔드 plan.md의 게이트 조건 충족 여부를 대시보드에서 한 눈에 확인.

- Overview 상단에 게이트 체크리스트 컴포넌트
- 각 게이트 조건값 vs 현재값 표시
- 백엔드 `/api/signal/gate-status` 엔드포인트 필요

### M-4. 모바일 반응형 개선
**배경**: 현재 레이아웃은 `ml-56` 고정 사이드바로 모바일에서 깨짐.

- 사이드바를 모바일에서 햄버거 메뉴로 전환
- 테이블 컴포넌트 `overflow-x-auto` 적용 (현재 일부 누락)
- 낮은 우선순위 (개인용 대시보드)

---

## 장기 (미장·코인 확장 시)

- 다중 포트폴리오 탭 (현재 국장만)
- 시장별 벤치마크 전환 (KOSPI → S&P500 → BTC)
- 알림 히스토리 검색/필터 기능
- 다크/라이트 테마 토글

---

## 문서 업데이트 규칙

| 트리거 | 업데이트 O | 업데이트 X |
|--------|-----------|-----------|
| plan.md | 페이지 추가/제거, 새 기능 계획 확정, 우선순위 변경 | 컴포넌트 리팩토링, 스타일 조정 |
| research.md | 새 페이지/컴포넌트 추가, API 연동 구조 변경, 배포 설정 변경 | 변수명·주석 변경, 내부 로직 미세 수정 |
| CLAUDE.md | 프로젝트 구조 변경, 새 기술 도입, 환경변수 추가 | 위와 동일 |
