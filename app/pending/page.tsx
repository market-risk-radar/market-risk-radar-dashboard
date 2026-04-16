import { signOut } from '@/lib/auth';

export default function PendingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[linear-gradient(180deg,rgba(9,12,16,0.97),rgba(7,10,14,1))]">
      <div className="w-full max-w-sm px-6 text-center">
        <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-full border border-amber-700/50 bg-amber-950/40">
          <span className="text-2xl">⏳</span>
        </div>

        <h1 className="text-xl font-bold text-white">승인 대기 중</h1>
        <p className="mt-3 text-sm leading-relaxed text-zinc-400">
          로그인 요청이 접수됐습니다.
          <br />
          관리자가 계정을 승인하면 접근할 수 있습니다.
        </p>

        <div className="mt-6 rounded-lg border border-zinc-800 bg-zinc-900/60 px-4 py-3">
          <p className="text-xs text-zinc-500">
            승인 완료 후 다시 로그인해주세요.
          </p>
        </div>

        <form
          className="mt-6"
          action={async () => {
            'use server';
            await signOut({ redirectTo: '/login' });
          }}
        >
          <button
            type="submit"
            className="text-sm text-zinc-500 underline underline-offset-4 hover:text-zinc-300 transition"
          >
            다른 계정으로 로그인
          </button>
        </form>
      </div>
    </div>
  );
}
