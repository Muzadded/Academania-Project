import { DashboardSidebar } from '@/components/layout/dashboard-sidebar';
import { NotificationBell } from '@/components/features/notifications/notification-bell';

export default function ClientDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <DashboardSidebar variant="client" />
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center justify-end border-b px-6">
          <NotificationBell />
        </header>
        <div className="flex-1 p-6">{children}</div>
      </div>
    </div>
  );
}
