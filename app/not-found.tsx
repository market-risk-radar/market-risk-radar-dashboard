import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.3em] text-orange-300/70">
        Error 404
      </p>
      <h1 className="text-2xl font-bold text-white">페이지를 찾을 수 없습니다</h1>
      <p className="mt-3 text-sm text-zinc-400">
        요청하신 경로가 존재하지 않거나 이동되었습니다.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10 active:scale-[0.98]"
      >
        ← 개요로 돌아가기
      </Link>
    </div>
  );
}
