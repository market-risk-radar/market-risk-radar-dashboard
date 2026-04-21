import { api, BacktestResult, BacktestCategoryRow } from '@/lib/api';
import { clsx } from 'clsx';

// ── helpers ──────────────────────────────────────────────────────────────────

function pct(v: number | null, digits = 1) {
  if (v === null) return '—';
  return (v >= 0 ? '+' : '') + (v * 100).toFixed(digits) + '%';
}

function alphaColor(v: number | null) {
  if (v === null) return 'text-zinc-500';
  return v >= 0 ? 'text-emerald-400' : 'text-red-400';
}

function num(v: number | null, digits = 2) {
  if (v === null) return '—';
  return (v >= 0 ? '+' : '') + v.toFixed(digits);
}

const CATEGORY_COLOR: Record<string, string> = {
  EARNINGS_BEAT:     'bg-emerald-900 text-emerald-300',
  EARNINGS_MISS:     'bg-red-900 text-red-300',
  CONTRACT_WIN:      'bg-blue-900 text-blue-300',
  CONTRACT_LOSS:     'bg-orange-900 text-orange-300',
  GUIDANCE_UP:       'bg-teal-900 text-teal-300',
  GUIDANCE_DOWN:     'bg-amber-900 text-amber-300',
  REGULATORY_ACTION: 'bg-rose-900 text-rose-300',
  DILUTION:          'bg-purple-900 text-purple-300',
  BUYBACK:           'bg-zinc-700 text-zinc-300',
  M_A:               'bg-indigo-900 text-indigo-300',
};

function CategoryBadge({ cat }: { cat: string }) {
  return (
    <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', CATEGORY_COLOR[cat] ?? 'bg-zinc-800 text-zinc-300')}>
      {cat}
    </span>
  );
}

// ── summary panel ─────────────────────────────────────────────────────────────

function SummaryPanel({ result, label }: { result: BacktestResult; label: string }) {
  const { summary, params } = result;
  const coverage = summary.totalSignals > 0
    ? ((summary.withReturn / summary.totalSignals) * 100).toFixed(0)
    : '—';
  const scopeLabel = params.category ? params.category : '화이트리스트 전체';

  const stats = [
    { label: '총 신호', value: String(summary.totalSignals), sub: `수익률 집계 ${summary.withReturn}건 (${coverage}%)` },
    {
      label: '승률 (α>0)',
      value: pct(summary.winRate, 0),
      color: alphaColor(
        summary.winRate !== null ? summary.winRate - 0.5 : null,
      ),
    },
    { label: '평균 Alpha', value: pct(summary.avgAlpha), color: alphaColor(summary.avgAlpha) },
    { label: '중앙값 Alpha', value: pct(summary.medianAlpha), color: alphaColor(summary.medianAlpha) },
    {
      label: '방향일치율',
      value: pct(summary.directionMatchRate, 0),
      color: alphaColor(
        summary.directionMatchRate !== null
          ? summary.directionMatchRate - 0.5
          : null,
      ),
    },
    { label: 'Sharpe 근사', value: num(summary.sharpeProxy), color: alphaColor(summary.sharpeProxy) },
    { label: 'Max Alpha', value: pct(summary.maxAlpha), color: 'text-emerald-400' },
    { label: 'Min Alpha', value: pct(summary.minAlpha), color: 'text-red-400' },
  ];

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
      <div className="mb-4">
        <p className="text-sm font-semibold text-zinc-300">{label}</p>
        <p className="text-xs text-zinc-600 mt-0.5">
          minConf {params.minConfidence} · minGate1 {params.minGate1} · {scopeLabel}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="bg-zinc-950/60 rounded-lg p-3">
            <p className="text-xs text-zinc-500 mb-1">{s.label}</p>
            <p className={clsx('text-lg font-bold', s.color ?? 'text-zinc-200')}>{s.value}</p>
            {s.sub && <p className="text-xs text-zinc-600 mt-0.5">{s.sub}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── category breakdown table ──────────────────────────────────────────────────

function CategoryTable({ rows, holdDays }: { rows: BacktestCategoryRow[]; holdDays: number }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
      <div className="mb-4">
        <p className="text-sm font-semibold text-zinc-300">카테고리별 분해 (D+{holdDays})</p>
        <p className="text-xs text-zinc-600 mt-0.5">
          withReturn 기준 내림차순 · alpha &gt; 0이면 롱 신호 유효 가능성
        </p>
      </div>

      {/* Mobile */}
      <div className="space-y-3 md:hidden">
        {rows.map((r) => (
          <div key={r.category} className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <CategoryBadge cat={r.category} />
              <span className="text-xs text-zinc-500">{r.count}건 / 집계 {r.withReturn}건</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div>
                <p className="text-xs text-zinc-500">승률</p>
                <p
                  className={clsx(
                    'font-medium',
                    alphaColor(r.winRate !== null ? r.winRate - 0.5 : null),
                  )}
                >
                  {pct(r.winRate, 0)}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">평균 α</p>
                <p className={clsx('font-medium', alphaColor(r.avgAlpha))}>{pct(r.avgAlpha)}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">방향일치</p>
                <p className="text-zinc-300">{pct(r.directionMatchRate, 0)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-zinc-500 uppercase border-b border-zinc-800">
              <th className="text-left py-2 pr-4">카테고리</th>
              <th className="text-right py-2 pr-4">신호</th>
              <th className="text-right py-2 pr-4">집계</th>
              <th className="text-right py-2 pr-4">승률</th>
              <th className="text-right py-2 pr-4">평균 α</th>
              <th className="text-right py-2 pr-4">평균 Ret</th>
              <th className="text-right py-2">방향일치</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {rows.map((r) => (
              <tr key={r.category} className="hover:bg-zinc-800/50">
                <td className="py-2.5 pr-4"><CategoryBadge cat={r.category} /></td>
                <td className="py-2.5 pr-4 text-right text-zinc-400">{r.count}</td>
                <td className="py-2.5 pr-4 text-right text-zinc-400">{r.withReturn}</td>
                <td
                  className={clsx(
                    'py-2.5 pr-4 text-right font-medium',
                    alphaColor(r.winRate !== null ? r.winRate - 0.5 : null),
                  )}
                >
                  {pct(r.winRate, 0)}
                </td>
                <td className={clsx('py-2.5 pr-4 text-right font-medium', alphaColor(r.avgAlpha))}>
                  {pct(r.avgAlpha)}
                </td>
                <td className="py-2.5 pr-4 text-right text-zinc-400">{pct(r.avgRet)}</td>
                <td className="py-2.5 text-right text-zinc-400">{pct(r.directionMatchRate, 0)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-zinc-600 text-sm">집계된 카테고리가 없습니다</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── page ─────────────────────────────────────────────────────────────────────

export default async function BacktestPage() {
  const [res1d, res5d, resCW, resEB] = await Promise.allSettled([
    api.backtest({ holdDays: 1 }),
    api.backtest({ holdDays: 5 }),
    api.backtest({ holdDays: 5, minConfidence: 0.65, category: 'CONTRACT_WIN' }),
    api.backtest({ holdDays: 1, category: 'EARNINGS_BEAT' }),
  ]);

  const bt1d = res1d.status === 'fulfilled' ? res1d.value : null;
  const bt5d = res5d.status === 'fulfilled' ? res5d.value : null;
  const btCW = resCW.status === 'fulfilled' ? resCW.value : null;
  const btEB = resEB.status === 'fulfilled' ? resEB.value : null;
  const hasError = res1d.status === 'rejected' || res5d.status === 'rejected';

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
        <div className="rounded-[28px] border border-white/8 bg-[linear-gradient(135deg,rgba(18,24,32,0.9),rgba(10,13,18,0.88))] px-6 py-6 shadow-[0_32px_80px_rgba(0,0,0,0.24)]">
          <p className="font-mono text-[11px] uppercase tracking-[0.26em] text-orange-200/70">Backtest</p>
          <h2 className="mt-3 text-3xl font-bold text-white">Lightweight strategy probe</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">
            signal_candidate × event_return 조합으로 D+1, D+5 구간의 알파와 방향일치율을 빠르게 점검하는 화면.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">D+1</p>
            <p className="mt-2 text-3xl font-bold text-white">{bt1d?.summary.totalSignals ?? '—'}</p>
            <p className="mt-1 text-xs text-zinc-500">전체 화이트리스트 신호 수</p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">D+5</p>
            <p className="mt-2 text-3xl font-bold text-white">{bt5d?.summary.totalSignals ?? '—'}</p>
            <p className="mt-1 text-xs text-zinc-500">전체 화이트리스트 신호 수</p>
          </div>
        </div>
      </div>

      {hasError && (
        <div className="bg-red-950/30 border border-red-900 rounded-lg p-4 text-sm text-red-200">
          일부 백테스트 데이터를 불러오지 못했습니다. API 연결 상태를 확인하세요.
        </div>
      )}

      {/* 해석 가이드 */}
      <div className="rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(17,22,29,0.74),rgba(10,14,19,0.78))] px-4 py-4 text-xs text-zinc-500 space-y-1 shadow-[0_24px_60px_rgba(0,0,0,0.18)]">
        <p><span className="text-zinc-400 font-medium">해석 원칙:</span> alpha &gt; 0 + 방향일치율 55%+ 달성 카테고리만 신호 유효. D+1과 D+5를 나란히 비교해 어느 구간이 더 설득력 있는지 확인한다.</p>
        <p><span className="text-zinc-400 font-medium">현재 기준:</span> EARNINGS_BEAT alpha_5d 음수 전환 → D+1 단기 반응 유효성 우선 검증 중. CONTRACT_WIN → D+5 (실제 운용 기준 minConf 0.65 패널 별도 표시)</p>
      </div>

      {/* Summary panels — 전체 화이트리스트 D+1 / D+5 */}
      <div>
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">전체 화이트리스트 (minConf 0.75)</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bt1d ? (
            <SummaryPanel result={bt1d} label="D+1 보유 요약" />
          ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 flex items-center justify-center text-zinc-600 text-sm">
            D+1 데이터 없음
          </div>
        )}
          {bt5d ? (
            <SummaryPanel result={bt5d} label="D+5 보유 요약" />
          ) : (
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 flex items-center justify-center text-zinc-600 text-sm">
              D+5 데이터 없음
            </div>
          )}
        </div>
      </div>

      {/* CONTRACT_WIN 실제 운용 기준 패널 */}
      <div>
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">
          CONTRACT_WIN 실제 운용 기준 (minConf 0.65 · D+5)
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {btCW ? (
            <SummaryPanel result={btCW} label="CONTRACT_WIN — Portfolio B 동일 조건" />
          ) : (
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 flex items-center justify-center text-zinc-600 text-sm">
              CONTRACT_WIN 데이터 없음
            </div>
          )}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-5 text-xs text-zinc-500 space-y-2 flex flex-col justify-center">
            <p className="text-zinc-300 font-medium text-sm">왜 별도 확인이 필요한가</p>
            <p>Portfolio B는 DART CONTRACT_WIN 공시에 한해 <span className="text-zinc-300">minConf 0.65</span>로 진입 허용.</p>
            <p>전체 화이트리스트 패널(minConf 0.75)은 CONTRACT_WIN 표본을 과소 계상해 결과가 왜곡될 수 있음.</p>
            <p>이 패널이 실제 Portfolio B 운용 규칙과 정합적인 검증 기준이다.</p>
          </div>
        </div>
      </div>

      {/* EARNINGS_BEAT 실제 운용 기준 패널 */}
      <div>
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">
          EARNINGS_BEAT 실제 운용 기준 (minConf 0.75 · D+1)
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {btEB ? (
            <SummaryPanel result={btEB} label="EARNINGS_BEAT — Portfolio B 동일 조건" />
          ) : (
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 flex items-center justify-center text-zinc-600 text-sm">
              EARNINGS_BEAT 데이터 없음
            </div>
          )}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-5 text-xs text-zinc-500 space-y-2 flex flex-col justify-center">
            <p className="text-zinc-300 font-medium text-sm">D+1 단기 반응 전략 근거</p>
            <p>실증 데이터: EARNINGS_BEAT <span className="text-zinc-300">alpha_1d +1.16%</span> vs alpha_5d −0.94%.</p>
            <p>D+5 구간에서 KOSPI 벤치마크에 밀리는 패턴 확인 → <span className="text-zinc-300">2026-04-15 holdDays 5→1 변경</span>.</p>
            <p>방향은 맞지만(dm 66%) 절대 수익보다 초과수익(alpha)이 핵심 — D+1 포착이 효율적.</p>
          </div>
        </div>
      </div>

      {/* Category breakdown — D+5 기준 */}
      {bt5d && <CategoryTable rows={bt5d.byCategory} holdDays={5} />}

      {/* Category breakdown — D+1 기준 */}
      {bt1d && <CategoryTable rows={bt1d.byCategory} holdDays={1} />}
    </div>
  );
}
