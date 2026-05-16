'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const clientLinks = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/dashboard/orders', label: 'Orders' },
  { href: '/dashboard?tab=payments', label: 'Payments' },
  { href: '/dashboard?tab=chat', label: 'Chat' },
];

const adminLinks = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/orders', label: 'Orders' },
  { href: '/admin/clients', label: 'Clients' },
  { href: '/admin?tab=meetings', label: 'Meetings' },
];

interface DashboardSidebarProps {
  variant: 'client' | 'admin';
}

export function DashboardSidebar({ variant }: DashboardSidebarProps) {
  const pathname = usePathname();
  const links = variant === 'admin' ? adminLinks : clientLinks;

  return (
    <aside className="w-64 border-r bg-muted/20 p-4">
      <nav className="flex flex-col gap-1">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'rounded-md px-3 py-2 text-sm font-medium transition-colors',
              pathname === link.href || pathname.startsWith(link.href + '/')
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
