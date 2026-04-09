export const dynamic = 'force-dynamic';

export async function GET() {
  const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000 (fallback)';
  const url = `${base}/api/paper-trading/performance`;
  const clientId = process.env.CF_ACCESS_CLIENT_ID ?? '(not set)';
  const hasSecret = !!process.env.CF_ACCESS_CLIENT_SECRET;

  const headers: HeadersInit =
    process.env.CF_ACCESS_CLIENT_ID && process.env.CF_ACCESS_CLIENT_SECRET
      ? {
          'CF-Access-Client-Id': process.env.CF_ACCESS_CLIENT_ID,
          'CF-Access-Client-Secret': process.env.CF_ACCESS_CLIENT_SECRET,
        }
      : {};

  let status: number | string = 'unknown';
  let error: string | null = null;

  try {
    const res = await fetch(url, { cache: 'no-store', headers });
    status = res.status;
  } catch (e) {
    error = String(e);
  }

  return Response.json({
    base,
    url,
    status,
    error,
    cf_client_id: clientId.slice(0, 8) + '...',
    cf_secret_set: hasSecret,
  });
}
