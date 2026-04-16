import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const PUBLIC_PATHS = ['/login', '/pending', '/api/auth'];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // 공개 경로는 무조건 통과
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const session = req.auth;

  // 미인증
  if (!session) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // PENDING: 승인 대기 페이지로
  if (session.authStatus === 'PENDING') {
    return NextResponse.redirect(new URL('/pending', req.url));
  }

  // BLOCKED / ERROR
  if (session.authStatus === 'BLOCKED' || session.authStatus === 'ERROR') {
    const error = session.authStatus.toLowerCase();
    return NextResponse.redirect(new URL(`/login?error=${error}`, req.url));
  }

  // 관리자 전용 경로
  if (pathname.startsWith('/admin') && session.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
