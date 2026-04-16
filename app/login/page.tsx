import { signIn } from '@/lib/auth';

const ERROR_MESSAGES: Record<string, string> = {
  blocked: '접근이 차단된 계정입니다. 관리자에게 문의하세요.',
  error: '로그인 중 오류가 발생했습니다. 다시 시도해주세요.',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const errorMsg = error ? (ERROR_MESSAGES[error] ?? ERROR_MESSAGES.error) : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(241,103,37,0.12),transparent_30%),linear-gradient(180deg,rgba(9,12,16,0.97),rgba(7,10,14,1))]">
      <div className="w-full max-w-sm px-6">
        {/* 로고 영역 */}
        <div className="mb-10 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-orange-300/70 mb-3">
            Market Risk Radar
          </p>
          <h1 className="text-2xl font-bold text-white">대시보드 로그인</h1>
          <p className="mt-2 text-sm text-zinc-500">
            관리자 승인이 완료된 계정만 접근할 수 있습니다.
          </p>
        </div>

        {/* 에러 메시지 */}
        {errorMsg && (
          <div className="mb-6 rounded-lg border border-red-800 bg-red-950/40 px-4 py-3">
            <p className="text-sm text-red-300">{errorMsg}</p>
          </div>
        )}

        {/* Google 로그인 버튼 */}
        <form
          action={async () => {
            'use server';
            await signIn('google', { redirectTo: '/' });
          }}
        >
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm font-medium text-white transition hover:bg-white/10 active:scale-[0.98]"
          >
            <GoogleIcon />
            Google로 로그인
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-zinc-600">
          계정이 없으면 로그인 시 자동으로 승인 요청이 전송됩니다.
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58Z"
      />
    </svg>
  );
}
