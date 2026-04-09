export const dynamic = 'force-dynamic';

export async function GET() {
  const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000 (fallback)';
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
  let resHeaders: Record<string, string> = {};
  let body = '';

  try {
    const res = await fetch(url, { cache: 'no-store', headers });
    status = res.status;
    res.headers.forEach((v, k) => { resHeaders[k] = v; });
    body = await res.text().then((t) => t.slice(0, 300));
  } catch (e) {
    error = String(e);
  }

  return Response.json({
    status,
    error,
    cf_client_id_prefix: process.env.CF_ACCESS_CLIENT_ID?.slice(0, 8) + '...',
    cf_secret_set: !!process.env.CF_ACCESS_CLIENT_SECRET,
    response_headers: resHeaders,
    body_preview: body,
  });
}
