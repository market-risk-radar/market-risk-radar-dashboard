import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

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

  if (!session) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (session.authStatus === 'PENDING') {
    return NextResponse.redirect(new URL('/pending', req.url));
  }

  if (session.authStatus === 'BLOCKED' || session.authStatus === 'ERROR') {
    const error = session.authStatus.toLowerCase();
    return NextResponse.redirect(new URL(`/login?error=${error}`, req.url));
  }

  if (pathname.startsWith('/admin') && session.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
