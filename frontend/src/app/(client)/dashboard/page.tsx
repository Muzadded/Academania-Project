'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { DashboardOverview } from '@/components/features/dashboard/dashboard-overview';
import { DashboardPayments } from '@/components/features/dashboard/dashboard-payments';
import { DashboardChat } from '@/components/features/dashboard/dashboard-chat';
import { Loader2 } from 'lucide-react';

function DashboardContent() {
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab') || 'overview';

  switch (tab) {
    case 'payments':
      return <DashboardPayments />;
    case 'chat':
      return <DashboardChat />;
    case 'overview':
    default:
      return <DashboardOverview />;
  }
}

export default function Page() {
  return (
    <div className="w-full">
      <Suspense
        fallback={
          <div className="flex h-[400px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        }
      >
        <DashboardContent />
      </Suspense>
    </div>
  );
}
