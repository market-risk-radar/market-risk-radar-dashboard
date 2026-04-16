'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import {
  LayoutDashboard,
  Briefcase,
  Zap,
  Bell,
  TrendingUp,
  History,
  Activity,
  BarChart2,
  Menu,
  X,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { clsx } from 'clsx';

const NAV = [
  { href: '/',              label: 'Overview',      icon: LayoutDashboard },
  { href: '/positions',     label: 'Positions',     icon: Briefcase },
  { href: '/signals',       label: 'Signals',       icon: Zap },
  { href: '/alerts',        label: 'Alerts',        icon: Bell },
  { href: '/event-returns', label: 'Event Returns', icon: TrendingUp },
  { href: '/backtest',      label: 'Backtest',      icon: BarChart2 },
  { href: '/trades',        label: 'Trades',        icon: History },
  { href: '/operations',    label: 'Operations',    icon: Activity },
];

export default function Navigation() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const { data: session } = useSession();
  const isAdmin = (session as { role?: string } | null)?.role === 'ADMIN';

  const navLinks = NAV.map(({ href, label, icon: Icon }) => {
    const active = path === href;
    return (
      <Link
        key={href}
        href={href}
        onClick={() => setOpen(false)}
        className={clsx(
          'group relative flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-all duration-200',
          active
            ? 'bg-white/[0.06] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_10px_30px_rgba(0,0,0,0.2)]'
            : 'text-zinc-400 hover:bg-white/[0.04] hover:text-white',
        )}
      >
        <span
          className={clsx(
            'flex h-8 w-8 items-center justify-center rounded-lg border',
            active
              ? 'border-orange-400/30 bg-orange-500/12 text-orange-200'
              : 'border-white/6 bg-white/[0.03] text-zinc-500 group-hover:border-white/12 group-hover:text-zinc-200',
          )}
        >
          <Icon size={16} />
        </span>
        <span className="flex-1">{label}</span>
        {active && <span className="h-2 w-2 rounded-full bg-orange-300 shadow-[0_0_16px_rgba(253,186,116,0.8)]" />}
      </Link>
    );
  });

  return (
    <>
      {/* Mobile top bar */}
      <header className="md:hidden fixed top-0 inset-x-0 z-40 flex h-14 items-center gap-3 border-b border-white/8 bg-[rgba(10,14,19,0.82)] px-4 backdrop-blur-xl">
        <button
          onClick={() => setOpen(true)}
          className="rounded-lg border border-white/8 bg-white/[0.03] p-2 text-zinc-300 hover:text-white"
          aria-label="메뉴 열기"
        >
          <Menu size={20} />
        </button>
        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-orange-200/70 leading-none">
            Market Risk
          </p>
          <p className="text-sm font-bold leading-tight text-white">Radar Dashboard</p>
        </div>
      </header>

      {/* Mobile overlay */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-50 w-56 bg-zinc-900 border-r border-zinc-800 flex flex-col',
          'md:w-64',
          'border-r border-white/8 bg-[linear-gradient(180deg,rgba(16,20,27,0.96),rgba(9,12,17,0.94))] backdrop-blur-2xl',
          'transition-transform duration-200',
          open ? 'translate-x-0' : '-translate-x-full',
          'md:translate-x-0',
        )}
      >
        <div className="flex items-center justify-between border-b border-white/8 px-5 py-5">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.28em] text-orange-200/70">
              Market Risk
            </p>
            <h1 className="text-lg font-bold leading-tight text-white">Radar Dashboard</h1>
            <p className="mt-1 text-xs text-zinc-500">signal • portfolio • ops</p>
          </div>
          <button
            className="md:hidden rounded-lg border border-white/8 bg-white/[0.03] p-2 text-zinc-300 hover:text-white"
            onClick={() => setOpen(false)}
            aria-label="메뉴 닫기"
          >
            <X size={16} />
          </button>
        </div>
        <div className="px-5 pt-4">
          <div className="rounded-2xl border border-orange-400/10 bg-[linear-gradient(135deg,rgba(241,103,37,0.14),rgba(241,103,37,0.03))] px-4 py-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-orange-200/80">Control Surface</p>
            <p className="mt-1 text-sm font-semibold text-zinc-100">KOSPI risk monitor</p>
            <p className="mt-1 text-xs leading-relaxed text-zinc-400">A/B performance, signal validation, alert operations in one surface.</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">{navLinks}</nav>
        {/* 관리자 메뉴 */}
        {isAdmin && (
          <div className="border-t border-white/8 px-3 pt-2 pb-0">
            <Link
              href="/admin/users"
              onClick={() => setOpen(false)}
              className={clsx(
                'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all',
                path === '/admin/users'
                  ? 'bg-white/[0.06] text-white'
                  : 'text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-300',
              )}
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/6 bg-white/[0.03]">
                <ShieldCheck size={14} />
              </span>
              사용자 관리
            </Link>
          </div>
        )}

        {/* 유저 정보 + 로그아웃 */}
        <div className="border-t border-white/8 px-5 py-4">
          {session?.user && (
            <div className="mb-3 flex items-center gap-2.5">
              {session.user.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={session.user.image}
                  alt={session.user.name ?? ''}
                  className="h-7 w-7 rounded-full border border-white/10"
                />
              )}
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-zinc-300">
                  {session.user.name ?? '—'}
                </p>
                <p className="truncate text-[10px] text-zinc-600">{session.user.email}</p>
              </div>
            </div>
          )}
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex w-full items-center gap-2 text-xs text-zinc-600 hover:text-zinc-400 transition"
          >
            <LogOut size={12} />
            로그아웃
          </button>
        </div>
      </aside>
    </>
  );
}
