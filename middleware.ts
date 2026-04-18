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

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Auth.js 내부 경로는 검증 없이 통과
  if (pathname.startsWith('/api/auth')) return NextResponse.next();

  // JWT 쿠키에서 raw token 추출 (sessionId는 session 객체에 미노출 → getToken 필요)
  const token = await getToken({
    req,
    secret: AUTH_SECRET,
    // Auth.js는 HTTPS에서 `__Secure-authjs.session-token` 쿠키를 사용한다.
    secureCookie: req.nextUrl.protocol === 'https:',
  });
  const authStatus = token?.authStatus as string | undefined;
  const sessionId = token?.sessionId as string | undefined;
  const role = token?.role as string | undefined;

  // ── /login ────────────────────────────────────────────────────────────────
  if (pathname === '/login') {
    if (!token) return NextResponse.next();
    if (authStatus === 'PENDING') return NextResponse.redirect(new URL('/pending', req.url));
    if (authStatus === 'BLOCKED' || authStatus === 'ERROR') return NextResponse.next();
    return NextResponse.redirect(new URL('/', req.url));
  }

  // ── /pending ──────────────────────────────────────────────────────────────
  if (pathname === '/pending') {
    if (!token) return NextResponse.redirect(new URL('/login', req.url));
    if (authStatus === 'PENDING') return NextResponse.next();
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

  let validateRes: Response;
  try {
    validateRes = await fetch(`${BACKEND_URL}/api/auth/validate`, {
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
    // 백엔드 일시 불가 시 기존 세션 유지 (가용성 우선)
    return NextResponse.next();
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

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
