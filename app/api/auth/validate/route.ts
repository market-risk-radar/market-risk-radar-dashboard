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

async function validateSession(sessionId: string) {
  return fetch(`${BACKEND_URL}/api/auth/validate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Internal-Secret': INTERNAL_SECRET,
      ...CF_HEADERS,
    },
    body: JSON.stringify({ sessionId }),
    cache: 'no-store',
  });
}

export async function GET(req: NextRequest) {
  const authUrl = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? '';
  const isSecure = authUrl.startsWith('https://') || req.nextUrl.protocol === 'https:';
  const token = await getToken({
    req,
    secret: AUTH_SECRET,
    secureCookie: isSecure,
  });

  const authStatus = token?.authStatus as string | undefined;
  const sessionId = token?.sessionId as string | undefined;
  const role = token?.role as string | undefined;

  if (authStatus !== 'APPROVED' || !sessionId) {
    return NextResponse.json({ ok: false, reason: 'UNAUTHENTICATED' }, { status: 401 });
  }

  try {
    const res = await validateSession(sessionId);

    if (res.status === 403) {
      return NextResponse.json({ ok: false, reason: 'BLOCKED' }, { status: 403 });
    }

    if (!res.ok) {
      return NextResponse.json({ ok: false, reason: 'INVALID_SESSION' }, { status: 401 });
    }

    return NextResponse.json({ ok: true, role });
  } catch {
    return NextResponse.json({ ok: false, reason: 'VALIDATION_UNAVAILABLE' }, { status: 503 });
  }
}
