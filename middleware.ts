import { getToken } from 'next-auth/jwt';
import { NextResponse, type NextRequest } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:3000';
const AUTH_SECRET = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
const INTERNAL_SECRET = process.env.AUTH_INTERNAL_SECRET!;
const CF_HEADERS: HeadersInit =
  process.env.CF_ACCESS_CLIENT_ID && process.env.CF_ACCESS_CLIENT_SECRET
    ? {
        'CF-Access-Client-Id': process.env.CF_ACCESS_CLIENT_ID,
        'CF-Access-Client-Secret': process.env.CF_ACCESS_CLIENT_SECRET,
      }
    : {};

async function validateSession(sessionId: string): Promise<Response | null> {
  try {
    return await fetch(`${BACKEND_URL}/api/auth/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Secret': INTERNAL_SECRET,
        ...CF_HEADERS,
      },
      body: JSON.stringify({ sessionId }),
      cache: 'no-store',
    });
  } catch {
    return null;
  }
}

// layout.tsx가 현재 pathname을 알 수 있도록 요청 헤더에 x-pathname을 주입
function nextWithPathname(req: NextRequest): NextResponse {
  return NextResponse.next({
    request: { headers: new Headers({ ...Object.fromEntries(req.headers), 'x-pathname': req.nextUrl.pathname }) },
  });
}

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Auth.js 내부 경로는 검증 없이 통과
  if (pathname.startsWith('/api/auth')) return nextWithPathname(req);

  // JWT 쿠키에서 raw token 추출 (sessionId는 session 객체에 미노출 → getToken 필요)
  // AUTH_URL 기준으로 secure 여부 판단 — req.nextUrl.protocol은 리버스 프록시 뒤에서 http:로 잘못 감지될 수 있음
  const authUrl = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? '';
  const isSecure = authUrl.startsWith('https://') || req.nextUrl.protocol === 'https:';
  const token = await getToken({
    req,
    secret: AUTH_SECRET,
    // Auth.js는 HTTPS에서 `__Secure-authjs.session-token` 쿠키를 사용한다.
    secureCookie: isSecure,
  });
  const authStatus = token?.authStatus as string | undefined;
  const sessionId = token?.sessionId as string | undefined;
  const role = token?.role as string | undefined;

  // ── /login ────────────────────────────────────────────────────────────────
  if (pathname === '/login') {
    if (!token) return nextWithPathname(req);
    if (authStatus === 'PENDING') return NextResponse.redirect(new URL('/pending', req.url));
    if (authStatus === 'BLOCKED' || authStatus === 'ERROR') return nextWithPathname(req);
    if (authStatus !== 'APPROVED' || !sessionId) return nextWithPathname(req);

    const validateRes = await validateSession(sessionId);
    if (!validateRes) return NextResponse.redirect(new URL('/', req.url));
    if (!validateRes.ok) return nextWithPathname(req);

    return NextResponse.redirect(new URL('/', req.url));
  }

  // ── /pending ──────────────────────────────────────────────────────────────
  if (pathname === '/pending') {
    if (!token) return NextResponse.redirect(new URL('/login', req.url));
    if (authStatus === 'PENDING') return nextWithPathname(req);
    if (authStatus === 'BLOCKED' || authStatus === 'ERROR') {
      const error = authStatus.toLowerCase();
      return NextResponse.redirect(new URL(`/login?error=${error}`, req.url));
    }
    return NextResponse.redirect(new URL('/', req.url));
  }

  // ── 비로그인 / 비승인 ──────────────────────────────────────────────────────
  if (!token) return NextResponse.redirect(new URL('/login', req.url));

  if (authStatus === 'PENDING') return NextResponse.redirect(new URL('/pending', req.url));

  if (authStatus !== 'APPROVED') {
    const error = (authStatus ?? 'error').toLowerCase();
    return NextResponse.redirect(new URL(`/login?error=${error}`, req.url));
  }

  // ── 매 요청 Redis 세션 검증 ────────────────────────────────────────────────
  // sessionId가 없으면 (이론상 불가) 로그인으로
  if (!sessionId) return NextResponse.redirect(new URL('/login', req.url));

  const validateRes = await validateSession(sessionId);
  if (!validateRes) {
    // 백엔드 일시 불가 시 기존 세션 유지 (가용성 우선)
    return nextWithPathname(req);
  }

  if (validateRes.status === 403) {
    // 관리자에 의해 차단된 계정
    return NextResponse.redirect(new URL('/login?error=blocked', req.url));
  }

  if (!validateRes.ok) {
    // 다른 기기 로그인으로 세션 무효화, 또는 만료
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // ── 관리자 전용 경로 ───────────────────────────────────────────────────────
  if (pathname.startsWith('/admin') && role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return nextWithPathname(req);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
