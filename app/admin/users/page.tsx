import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { clsx } from 'clsx';

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:3000';
const ADMIN_KEY = process.env.AUTH_ADMIN_KEY!;
const CF_HEADERS: HeadersInit =
  process.env.CF_ACCESS_CLIENT_ID && process.env.CF_ACCESS_CLIENT_SECRET
    ? {
        'CF-Access-Client-Id': process.env.CF_ACCESS_CLIENT_ID,
        'CF-Access-Client-Secret': process.env.CF_ACCESS_CLIENT_SECRET,
      }
    : {};

interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  status: 'PENDING' | 'APPROVED' | 'BLOCKED';
  role: 'USER' | 'ADMIN';
  lastLoginAt: string | null;
  createdAt: string;
}

async function getUsers(): Promise<AuthUser[]> {
  const res = await fetch(`${BACKEND_URL}/api/auth/admin/users`, {
    headers: { 'X-Admin-Key': ADMIN_KEY, ...CF_HEADERS },
    cache: 'no-store',
  });
  if (!res.ok) return [];
  return res.json();
}

async function updateStatus(userId: string, status: 'APPROVED' | 'BLOCKED') {
  'use server';
  await fetch(`${BACKEND_URL}/api/auth/admin/users/${userId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Key': ADMIN_KEY,
      ...CF_HEADERS,
    },
    body: JSON.stringify({ status }),
    cache: 'no-store',
  });
}

const STATUS_STYLE = {
  PENDING:  { badge: 'bg-amber-900/60 text-amber-300',   label: '⏳ 대기' },
  APPROVED: { badge: 'bg-emerald-900/60 text-emerald-300', label: '✅ 승인' },
  BLOCKED:  { badge: 'bg-red-900/60 text-red-300',       label: '🚫 차단' },
};

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session || session.role !== 'ADMIN') redirect('/');

  const users = await getUsers();
  const pendingCount = users.filter((u) => u.status === 'PENDING').length;

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.26em] text-orange-200/70">Admin</p>
        <h1 className="mt-2 text-2xl font-bold text-white">사용자 관리</h1>
        {pendingCount > 0 && (
          <p className="mt-1 text-sm text-amber-400">
            승인 대기 {pendingCount}명
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-white/8 bg-zinc-900/60 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/6 text-left">
              <th className="px-4 py-3 font-medium text-zinc-500">이름 / 이메일</th>
              <th className="px-4 py-3 font-medium text-zinc-500">상태</th>
              <th className="px-4 py-3 font-medium text-zinc-500">역할</th>
              <th className="px-4 py-3 font-medium text-zinc-500">마지막 로그인</th>
              <th className="px-4 py-3 font-medium text-zinc-500">액션</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/4">
            {users.map((user) => {
              const style = STATUS_STYLE[user.status];
              return (
                <tr key={user.id} className="hover:bg-white/[0.02] transition">
                  <td className="px-4 py-3">
                    <p className="font-medium text-zinc-200">{user.name ?? '—'}</p>
                    <p className="text-xs text-zinc-500">{user.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', style.badge)}>
                      {style.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={clsx(
                      'text-xs px-2 py-0.5 rounded-full font-medium',
                      user.role === 'ADMIN'
                        ? 'bg-purple-900/60 text-purple-300'
                        : 'bg-zinc-800 text-zinc-400',
                    )}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-500">
                    {user.lastLoginAt
                      ? new Date(user.lastLoginAt).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {user.status !== 'APPROVED' && (
                        <form action={updateStatus.bind(null, user.id, 'APPROVED')}>
                          <button
                            type="submit"
                            className="text-xs px-2.5 py-1 rounded-lg bg-emerald-900/50 text-emerald-300 hover:bg-emerald-800/60 transition"
                          >
                            승인
                          </button>
                        </form>
                      )}
                      {user.status !== 'BLOCKED' && (
                        <form action={updateStatus.bind(null, user.id, 'BLOCKED')}>
                          <button
                            type="submit"
                            className="text-xs px-2.5 py-1 rounded-lg bg-red-900/50 text-red-300 hover:bg-red-800/60 transition"
                          >
                            차단
                          </button>
                        </form>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-zinc-600">
                  사용자 없음
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
