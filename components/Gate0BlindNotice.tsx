import { clsx } from 'clsx';
import { GATE0_BLIND_REVIEW_AFTER, isGate0BlindReviewDue } from '@/lib/gate0Blind';

export default function Gate0BlindNotice({ scope }: { scope: string }) {
  const reviewDue = isGate0BlindReviewDue();
  return (
    <div
      className={clsx(
        'rounded-[24px] border p-5 text-sm',
        reviewDue ? 'border-red-800 bg-red-950/30' : 'border-zinc-700 bg-zinc-900/60',
      )}
    >
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-zinc-500">Gate 0 blind</p>
      <p className="mt-2 font-semibold text-zinc-200">{scope} — Gate 0 판정 전까지 가림</p>
      <p className="mt-1 text-zinc-400">
        CONTRACT_WIN 재판정(사전 등록 검정)이 대기 중이라 이벤트 수익률·alpha 집계를 조회하지 않는다.
        해제 조건: Gate 0 결과 커밋 뒤 <code className="text-zinc-300">lib/gate0Blind.ts</code>의 값을 바꾸는 PR.
      </p>
      {reviewDue && (
        <p className="mt-2 font-semibold text-red-300">
          재확인 필요 — {GATE0_BLIND_REVIEW_AFTER} 이후에도 가림이 켜져 있다. Gate 0 진행 상태를 확인할 것.
        </p>
      )}
    </div>
  );
}
