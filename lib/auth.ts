import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:3000';
const INTERNAL_SECRET = process.env.AUTH_INTERNAL_SECRET!;

// RTR 체크 주기: 15분 (access token 윈도우)
const CHECK_INTERVAL_MS = 15 * 60 * 1000;

async function backendPost(path: string, body: object) {
  return fetch(`${BACKEND_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Internal-Secret': INTERNAL_SECRET,
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  });
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30일: 쿠키 수명
  },

  callbacks: {
    // ── 최초 로그인 또는 주기적 갱신 시 실행 ─────────────────────────────
    async jwt({ token, account, profile }) {
      // 최초 Google OAuth 완료
      if (account?.provider === 'google' && profile) {
        const res = await backendPost('/api/auth/callback', {
          email: profile.email,
          name: profile.name,
          avatarUrl: profile.picture,
          providerId: profile.sub,
          provider: 'google',
        });

        if (!res.ok) return { ...token, authStatus: 'ERROR' };

        const data = await res.json();

        if (data.status !== 'APPROVED') {
          // PENDING or BLOCKED: 토큰만 상태 기록 후 반환
          return { ...token, authStatus: data.status };
        }

        return {
          ...token,
          authStatus: 'APPROVED',
          refreshToken: data.refreshToken,
          userId: data.userId,
          role: data.role,
          checkedAt: Date.now(),
        };
      }

      // PENDING/BLOCKED/ERROR: 백엔드 재확인 없이 상태 유지
      if (token.authStatus !== 'APPROVED') return token;

      // 15분 미경과: 백엔드 체크 생략 (서명 검증으로 충분)
      if (Date.now() - (token.checkedAt as number) < CHECK_INTERVAL_MS) return token;

      // ── RTR: refresh token 교체 ─────────────────────────────────────────
      const res = await backendPost('/api/auth/refresh', {
        refreshToken: token.refreshToken,
      });

      if (!res.ok) {
        // 다른 기기 로그인으로 무효화됐거나 사용자 차단 → 강제 로그아웃
        return null;
      }

      const data = await res.json();
      return {
        ...token,
        refreshToken: data.refreshToken,
        userId: data.userId,
        role: data.role,
        checkedAt: Date.now(),
      };
    },

    // ── 세션 객체로 변환 (클라이언트에 노출되는 값) ───────────────────────
    async session({ session, token }) {
      return {
        ...session,
        authStatus: token.authStatus as string | undefined,
        userId: token.userId as string | undefined,
        role: token.role as string | undefined,
      };
    },
  },

  events: {
    // 로그아웃 시 refresh token 폐기
    async signOut(message) {
      const token = 'token' in message ? message.token : null;
      if (!token?.refreshToken) return;

      await backendPost('/api/auth/session', {
        refreshToken: token.refreshToken,
      }).catch(() => {}); // 실패해도 로그아웃은 진행
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },
});
