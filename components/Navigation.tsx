'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Briefcase,
  Zap,
  Bell,
  TrendingUp,
} from 'lucide-react';
import { clsx } from 'clsx';

const NAV = [
  { href: '/',               label: 'Overview',      icon: LayoutDashboard },
  { href: '/positions',      label: 'Positions',     icon: Briefcase },
  { href: '/signals',        label: 'Signals',       icon: Zap },
  { href: '/alerts',         label: 'Alerts',        icon: Bell },
  { href: '/event-returns',  label: 'Event Returns', icon: TrendingUp },
];

export default function Navigation() {
  const path = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 w-56 bg-zinc-900 border-r border-zinc-800 flex flex-col">
      <div className="px-5 py-5 border-b border-zinc-800">
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Market Risk</p>
        <h1 className="text-white font-bold text-lg leading-tight">Radar Dashboard</h1>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = path === href;
          return (
            <Link
              key={href}
              href={href}
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
        })}
      </nav>
      <div className="px-5 py-4 border-t border-zinc-800">
        <p className="text-xs text-zinc-600">theorynx.com</p>
      </div>
    </aside>
  );
}
