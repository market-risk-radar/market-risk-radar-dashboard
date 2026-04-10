export const dynamic = 'force-dynamic';

export async function GET() {
  const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
  const url = `${base}/api/paper-trading/performance`;

  const headers: HeadersInit =
    process.env.CF_ACCESS_CLIENT_ID && process.env.CF_ACCESS_CLIENT_SECRET
      ? {
          'CF-Access-Client-Id': process.env.CF_ACCESS_CLIENT_ID,
          'CF-Access-Client-Secret': process.env.CF_ACCESS_CLIENT_SECRET,
        }
      : {};

  let status: number | string = 'unknown';
  let error: string | null = null;
  let ok = false;

  try {
    const res = await fetch(url, { cache: 'no-store', headers });
    status = res.status;
    ok = res.ok;
  } catch (e) {
    error = String(e);
  }

  return Response.json({
    ok,
    status,
    error,
    cf_secret_set: !!process.env.CF_ACCESS_CLIENT_SECRET,
  });
}
