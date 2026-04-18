import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:3000';
const INTERNAL_SECRET = process.env.AUTH_INTERNAL_SECRET!;
const CF_HEADERS: HeadersInit =
  process.env.CF_ACCESS_CLIENT_ID && process.env.CF_ACCESS_CLIENT_SECRET
    ? {
        'CF-Access-Client-Id': process.env.CF_ACCESS_CLIENT_ID,
        'CF-Access-Client-Secret': process.env.CF_ACCESS_CLIENT_SECRET,
      }
    : {};

async function backendPost(path: string, body: object) {
  return fetch(`${BACKEND_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Internal-Secret': INTERNAL_SECRET,
      ...CF_HEADERS,
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  });
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],

  // 리버스 프록시(Nginx/Cloudflare) 환경에서 필수
  // AUTH_URL이 없으면 쿠키 이름(__Secure- prefix 여부)이 불일치해 token null 발생
  trustHost: true,

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30일: 쿠키 수명
  },

  callbacks: {
    // ── 최초 Google OAuth 완료 시에만 실행 ────────────────────────────────
    // 세션 유효성 검증은 middleware가 매 요청마다 Redis에서 직접 처리
    async jwt({ token, account, profile }) {
      if (account?.provider === 'google' && profile) {
        try {
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
            return { ...token, authStatus: data.status };
          }

          return {
            ...token,
            authStatus: 'APPROVED',
            sessionId: data.sessionId, // Redis 세션 키 (http-only 쿠키 내 JWT에만 존재)
            userId: data.userId,
            role: data.role,
          };
        } catch {
          return { ...token, authStatus: 'ERROR' };
        }
      }

      return token;
    },

    // ── 클라이언트에 노출되는 세션 객체 (sessionId 제외) ──────────────────
    async session({ session, token }) {
      return {
        ...session,
        authStatus: token.authStatus as string | undefined,
        userId: token.userId as string | undefined,
        role: token.role as string | undefined,
        // sessionId는 의도적으로 미노출 — middleware에서만 getToken()으로 접근
      };
    },
  },

  events: {
    // 로그아웃 시 Redis 세션 즉시 폐기
    async signOut(message) {
      const token = 'token' in message ? message.token : null;
      if (!token?.sessionId) return;

      await backendPost('/api/auth/session', {
        sessionId: token.sessionId,
      }).catch(() => {});
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },
});
