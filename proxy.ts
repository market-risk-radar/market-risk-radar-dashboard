import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // Auth.js 내부 라우트는 항상 통과
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // 로그인 페이지: 비인증만 접근, 이미 로그인된 사용자는 상태별로 적절한 화면으로 이동
  if (pathname === '/login') {
    if (!session) {
      return NextResponse.next();
    }

    if (session.authStatus === 'PENDING') {
      return NextResponse.redirect(new URL('/pending', req.url));
    }

    if (session.authStatus === 'BLOCKED' || session.authStatus === 'ERROR') {
      return NextResponse.next();
    }

    return NextResponse.redirect(new URL('/', req.url));
  }

  // 승인 대기 페이지: PENDING 세션만 접근 허용
  if (pathname === '/pending') {
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    if (session.authStatus === 'PENDING') {
      return NextResponse.next();
    }

    if (session.authStatus === 'BLOCKED' || session.authStatus === 'ERROR') {
      const error = session.authStatus.toLowerCase();
      return NextResponse.redirect(new URL(`/login?error=${error}`, req.url));
    }

    return NextResponse.redirect(new URL('/', req.url));
  }

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
