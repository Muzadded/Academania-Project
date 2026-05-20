'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  PackageSearch,
  CreditCard,
  MessageSquare,
  Settings,
  LogOut,
  Users,
  CalendarDays,
  ChevronRight,
  GraduationCap,
} from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';

const clientLinks = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/orders', label: 'My Orders', icon: PackageSearch },
  { href: '/dashboard?tab=payments', label: 'Payments', icon: CreditCard },
  { href: '/dashboard?tab=chat', label: 'Messages', icon: MessageSquare },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

const clientPortalLinks = [
  { href: '/client', label: 'Overview', icon: LayoutDashboard },
  { href: '/client/orders', label: 'Orders', icon: PackageSearch },
  { href: '/client/clients', label: 'Clients', icon: Users },
  { href: '/client?tab=meetings', label: 'Meetings', icon: CalendarDays },
  { href: '/client/settings', label: 'Settings', icon: Settings },
];

interface DashboardSidebarProps {
  variant: 'client' | 'clientPortal';
}

export function DashboardSidebar({ variant }: DashboardSidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const links = variant === 'clientPortal' ? clientPortalLinks : clientLinks;

  const userName = session?.user?.name ?? 'Client';
  const userEmail = session?.user?.email ?? '';
  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <aside className="w-64 flex flex-col justify-between sticky top-0 h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-white shadow-2xl">
      {/* Brand Header */}
      <div>
        <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30 flex-shrink-0">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <div className="leading-tight">
            <span className="text-sm font-bold tracking-wider text-white">ACADEMANIA</span>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest mt-0.5">
              {variant === 'clientPortal' ? 'Client Portal' : 'My Portal'}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1 px-3 pt-5">
          <p className="px-3 mb-2 text-[10px] font-semibold tracking-widest text-slate-500 uppercase">
            Navigation
          </p>
          {links.map((link) => {
            const Icon = link.icon;
            const active = link.href.includes('?')
              ? false
              : pathname === link.href || pathname.startsWith(link.href + '/');

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  active
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white',
                )}
              >
                <Icon
                  className={cn(
                    'h-4 w-4 flex-shrink-0 transition-colors',
                    active ? 'text-white' : 'text-slate-500 group-hover:text-white',
                  )}
                />
                <span>{link.label}</span>
                {active && <ChevronRight className="ml-auto h-3.5 w-3.5 text-white/60" />}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Footer */}
      <div className="px-3 pb-4 space-y-1 border-t border-white/10 pt-4">
        {/* User card */}
        <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 mb-1 bg-white/5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-bold text-white flex-shrink-0 shadow">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-white truncate">{userName}</p>
            <p className="text-[10px] text-slate-500 truncate">{userEmail}</p>
          </div>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition-all duration-200"
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
