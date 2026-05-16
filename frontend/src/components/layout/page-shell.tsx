import { SiteFooter } from './site-footer';
import { SiteHeader } from './site-header';

interface PageShellProps {
  children: React.ReactNode;
  className?: string;
}

export function PageShell({ children, className }: PageShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className={className ?? 'flex-1'}>{children}</main>
      <SiteFooter />
    </div>
  );
}
