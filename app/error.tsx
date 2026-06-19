'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 사용자에게는 메시지를 노출하지 않고, 디버깅용으로만 기록 (Vercel 로그에서 확인)
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.3em] text-red-400/70">
        Error
      </p>
      <h1 className="text-2xl font-bold text-white">문제가 발생했습니다</h1>
      <p className="mt-3 text-sm text-zinc-400">
        일시적인 오류일 수 있습니다. 다시 시도해 주세요.
      </p>
      <div className="mt-8 flex items-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10 active:scale-[0.98]"
        >
          다시 시도
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-zinc-300 transition hover:bg-white/10 hover:text-white active:scale-[0.98]"
        >
          개요로 돌아가기
        </Link>
      </div>
    </div>
  );
}
