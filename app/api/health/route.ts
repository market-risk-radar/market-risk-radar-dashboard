export const dynamic = 'force-dynamic';

export async function GET() {
  const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000 (fallback)';
  const url = `${base}/api/paper-trading/performance`;

  let status: number | string = 'unknown';
  let error: string | null = null;

  try {
    const res = await fetch(url, { cache: 'no-store' });
    status = res.status;
  } catch (e) {
    error = String(e);
  }

  return Response.json({ base, url, status, error });
}
