# Dashboard — 개발 계획

> 작성일: 2026-04-10 / 최종 업데이트: 2026-04-11  
> 백엔드 로드맵 → `/Users/jys/market-risk-radar/market-risk-radar/plan.md`  
> 이 문서는 **"지금 어디까지 왔고, 다음에 뭘 할지"** 에 답한다.
> 운영 배포는 로컬 빌드가 아니라 Git 커밋 이후 Vercel 자동 배포를 기준으로 한다.

---

## 1. 현재 구현 상태

### 1-A. 완료된 페이지 (2026-04-10 기준)

| 페이지 | 경로 | 상태 | 핵심 내용 |
|--------|------|------|----------|
| Overview | `/` | ✅ 완료 | Portfolio A 성과 8개 지표 + **A/B/KOSPI NAV 60일 비교 차트** + **60일 누적/초과수익률 요약(표본 일수 포함)** + Portfolio B 요약 + **G1~G6 실전 전환 게이트 패널** |
| Positions | `/positions` | ✅ 완료 | Portfolio A 리밸런싱 포지션 + Portfolio B 신호 기반 포지션 (청산일·손절가 포함) |
| Signals | `/signals` | ✅ 완료 | signal_candidate 목록 + 카테고리별 α/방향일치 통계 (8개 카테고리 배지 색상 완비) |
| Alerts | `/alerts` | ✅ 완료 | 발송 통계 4개 카드 + 최근 50건 알림 목록 (채널 필터, 상세 모달 포함) |
| Event Returns | `/event-returns` | ✅ 완료 | 카테고리별 수익률·방향일치율 테이블 + G2 목표 진행바 |
| Trades | `/trades` | ✅ 완료 | BUY/SELL 체결 내역 + Portfolio A/B 클라이언트 필터 |
| Operations | `/operations` | ✅ 완료 | 파이프라인 퍼널 + 6개 KPI 카드 + 소스 타입 비율 + LLM 분류 상세 + Claude 비용 30일 차트 |

### 1-B. 완료된 기반 작업

| 항목 | 내용 |
|------|------|
| `lib/api.ts` | `DashboardStats`, `Performance`, `PortfolioNav`, `PaperTrade`, `RecentAlert` 등 10개 타입 + 정규화 완비 |
| 병렬 페치 | 모든 page.tsx: `Promise.all` + `.catch(() => []/null)` 방어 |
| ISR 캐시 | `next: { revalidate: 30 }` — Vercel 엣지 30초 캐싱 |
| 스켈레톤 | 7개 페이지 전부 `loading.tsx` (TTFB ~200ms에 즉시 표시) |
| 반응형 네비게이션 | 데스크탑 고정 사이드바 + 모바일 햄버거 오버레이 |
| G1~G6 판정 | 임계값 프론트 상수 하드코딩, G1은 `api.rebalanceCount()` 정확 집계, 나머지는 API 데이터 사용 |

---

## 2. G1~G6 게이트 현재 판정 상태 (2026-04-10)

> Overview `/` 하단 패널에 표시됨. 아래는 계산 로직 및 현재 기대값.

| 게이트 | 조건 | 현재 판정 | 데이터 소스 | 비고 |
|--------|------|---------|------------|------|
| G1 리밸런싱 무결성 | 10회 이상 SELL/BUY 정상 | `watch` 또는 `pass` (정확 집계) | `api.rebalanceCount()` | Portfolio A `paper_trade` distinct `tradeDate` |
| G2 방향일치율 5d ≥ 55% | 50건 이상 카테고리 기준 | `watch` (표본 부족) | `api.signalStats()` | CONTRACT_WIN 3건 |
| G3 alpha_5d ≥ 0 | CONTRACT_WIN 기준 | `pass` (+3.93%) | `api.signalStats()` | ✅ 달성 |
| G4 Portfolio B Sharpe ≥ 0.5 | 3개월 이상 기간 | `pending` 또는 실측값 | `api.bPerformance()` | 60거래일 미만이면 표본 축적 중 |
| G5 MDD < 30% | A/B 모두 | `watch` / `pass` / `fail` | `api.performance()` + `api.bPerformance()` | B NAV 축적 시 실측 반영 |
| G6 일비용 ≤ $3 | 최근 1개월 평균 | `pass` (~$1.4/일) | `api.dashboardStats()` | ✅ 달성 |

---

## 3. 단기 개선 계획 (이번 배치)

### S-1. Portfolio B NAV 히스토리 + A/B/KOSPI 비교 차트 ✅ 완료 (2026-04-11)

**배경**: 현재 Overview의 NAV 차트는 Portfolio A만 표시. B가 운용을 시작하면 A vs B vs KOSPI(069500) 비교가 핵심 지표.

**완료된 백엔드 작업**:
```
GET /api/paper-trading/b/nav/history?limit=60
GET /api/paper-trading/b/performance
GET /api/paper-trading/benchmark/nav/history?limit=60
```

**적용된 프론트 작업**:
- `api.bNavHistory()` 사용으로 Portfolio B NAV 이력 호출
- `api.benchmarkNavHistory()` 사용으로 KOSPI(069500) 1억원 환산 이력 호출
- Overview에서 A/B/KOSPI 세 라인을 하나의 차트에 겹쳐 표시
- 차트 상단에 A/B/KOSPI 60일 누적수익률 + A-KOSPI/B-KOSPI 초과수익률 요약 카드 추가
- 각 카드에 `표본 n일` 보조 문구 표시로 해석 과장 방지
- `NavChart`를 다중 시리즈 대응 컴포넌트로 확장

**효과**:
- A/B NAV와 KOSPI 가상 NAV를 같은 축에서 즉시 비교 가능
- G4/G5 상태와 NAV 흐름을 같은 화면에서 해석 가능

---

### S-2. G1 리밸런싱 횟수 집계 정확도 개선 ✅ 완료 (2026-04-11)

**적용 내용**:
- 백엔드 `GET /api/paper-trading/rebalance-count` 추가
- Portfolio A `paper_trade` 기준 `distinct tradeDate` 정확 집계
- Overview G1 패널을 `api.rebalanceCount()` 사용으로 교체

**효과**:
- 최근 거래 수 제한(`api.trades(5000)`) 의존 제거
- BUY-only 리밸런싱 포함
- G1 판정 안정화

---

### S-3. 일별 Claude 비용 추이 차트 (Operations 페이지 추가) ✅ 완료 (2026-04-11)

**적용 내용**:
- 백엔드 `GET /api/stats/cost/history?days=30` 추가
- `llm_run.cost_estimate_usd`를 KST 날짜별 합계로 집계
- Operations 하단에 Recharts 비용 추이 라인차트 추가

**효과**:
- 비용 급증 구간을 일자별로 바로 확인 가능
- G6 통과 상태를 추세 관점에서 같이 해석 가능

---

### S-4. Signals 페이지 — signal_candidate × event_return 연결 ✅ 완료 (2026-04-11)

**적용 내용**:
- 백엔드 `GET /api/signal/candidates?limit=50`에 `event_return` JOIN 추가
- `ret_1d`, `ret_5d`, `alpha_5d` 컬럼 포함
- Signals 테이블에 실현 수익률 컬럼 노출, 미집계 값은 `—` 처리

**효과**:
- 신호 후보 화면에서 실현 성과 확인 가능
- 카테고리 통계와 개별 신호 실적을 같은 화면에서 검증 가능

---

## 4. 중기 계획 (Phase 4 연계)

### M-1. 백테스트 결과 페이지 (`/backtest`)

**배경**: Phase 4-A에서 경량 백테스팅 결과가 나오면 대시보드에서 시각화 필요.

| 항목 | 내용 |
|------|------|
| 신규 페이지 | `/backtest` |
| 표시 내용 | 전략별 승률, 평균 alpha, Max Drawdown, 수익 곡선 |
| 의존성 | 백엔드 Phase 4-A API 확정 후 설계 |
| 예상 시점 | Phase 4-A 완료 후 |

### M-2. 포트폴리오 성과 비교 고도화

- A vs B vs KOSPI(069500) 누적 수익률 비교 (S-1 기반)
- 기간 선택 필터 (7일 / 30일 / 전체)
- Sharpe, MDD, CAGR 나란히 비교

### M-3. 실시간 갱신 (선택)

**배경**: `revalidate: 30`은 서버 캐시 갱신이라 사용자가 탭 유지해도 자동 갱신 없음. 장중 실시간성 필요 시 도입.

- Client Component + `setInterval(60_000)` 방식 (SWR 미도입, 의존성 최소화)
- 대상 페이지: Signals, Positions (성과 지표는 일 단위라 불필요)
- **낮은 우선순위** — 개인용 대시보드, 새로고침으로 충분

### M-4. KIS OpenAPI 연동 (Phase 5 연계)

**배경**: 실전 전환 시 실계좌 포지션·체결 내역을 대시보드에서 확인 필요.

- 신규 페이지 `/live-positions` 또는 Positions 내 탭 추가
- 백엔드 Phase 5-A (KIS OpenAPI 인증 모듈) 완료 후 설계

---

## 5. 장기 (미장·코인 확장 시)

| 항목 | 내용 | 선행 조건 |
|------|------|---------|
| 다중 시장 탭 | 국장 / 미장 / 코인 탭 | 백엔드 미장 소스 수집 시작 |
| 벤치마크 전환 | KOSPI → S&P500 → BTC | 백엔드 price_history 미장 확장 |
| 알림 히스토리 검색 | 종목·섹터·날짜 필터 | DB 인덱스 + 페이지네이션 API |
| 다크/라이트 테마 | 현재 다크 고정 | 낮은 우선순위 (개인용) |

---

## 6. 문서 업데이트 규칙

| 트리거 | plan.md | research.md |
|--------|---------|-------------|
| 페이지 추가/삭제 | ✅ | ✅ |
| 새 기능 계획 확정 | ✅ | ✗ |
| 우선순위 변경 | ✅ | ✗ |
| 컴포넌트·API 타입 추가 | ✗ | ✅ |
| Vercel 배포 방식/환경 변경 | ✗ | ✅ |
| 스타일·변수명 변경 | ✗ | ✗ |
| 내부 리팩토링 | ✗ | ✗ |

> 단순 버그 수정·스타일 조정은 어느 문서도 건드리지 않는다.  
> 기준: **"외부에서 봤을 때 UI 동작·구조·연동이 바뀌었는가"**
