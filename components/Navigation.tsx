'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard,
  Briefcase,
  Zap,
  Bell,
  TrendingUp,
  History,
  Activity,
  Menu,
  X,
} from 'lucide-react';
import { clsx } from 'clsx';

const NAV = [
  { href: '/',              label: 'Overview',      icon: LayoutDashboard },
  { href: '/positions',     label: 'Positions',     icon: Briefcase },
  { href: '/signals',       label: 'Signals',       icon: Zap },
  { href: '/alerts',        label: 'Alerts',        icon: Bell },
  { href: '/event-returns', label: 'Event Returns', icon: TrendingUp },
  { href: '/trades',        label: 'Trades',        icon: History },
  { href: '/operations',    label: 'Operations',    icon: Activity },
];

export default function Navigation() {
  const path = usePathname();
  const [open, setOpen] = useState(false);

  const navLinks = NAV.map(({ href, label, icon: Icon }) => {
    const active = path === href;
    return (
      <Link
        key={href}
        href={href}
        onClick={() => setOpen(false)}
        className={clsx(
          'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
          active
            ? 'bg-blue-600 text-white'
            : 'text-zinc-400 hover:text-white hover:bg-zinc-800',
        )}
      >
        <Icon size={16} />
        {label}
      </Link>
    );
  });

  return (
    <>
      {/* Mobile top bar */}
      <header className="md:hidden fixed top-0 inset-x-0 z-40 h-14 bg-zinc-900 border-b border-zinc-800 flex items-center px-4 gap-3">
        <button
          onClick={() => setOpen(true)}
          className="text-zinc-400 hover:text-white p-1"
          aria-label="메뉴 열기"
        >
          <Menu size={20} />
        </button>
        <div>
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest leading-none">
            Market Risk
          </p>
          <p className="text-white font-bold text-sm leading-tight">Radar Dashboard</p>
        </div>
      </header>

      {/* Mobile overlay */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-50 w-56 bg-zinc-900 border-r border-zinc-800 flex flex-col',
          'transition-transform duration-200',
          open ? 'translate-x-0' : '-translate-x-full',
          'md:translate-x-0',
        )}
      >
        <div className="px-5 py-5 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
              Market Risk
            </p>
            <h1 className="text-white font-bold text-lg leading-tight">Radar Dashboard</h1>
          </div>
          <button
            className="md:hidden text-zinc-400 hover:text-white p-1"
            onClick={() => setOpen(false)}
            aria-label="메뉴 닫기"
          >
            <X size={16} />
          </button>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">{navLinks}</nav>
        <div className="px-5 py-4 border-t border-zinc-800">
          <p className="text-xs text-zinc-600">theorynx.com</p>
        </div>
      </aside>
    </>
  );
}
