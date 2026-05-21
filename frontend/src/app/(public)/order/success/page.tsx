import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { OrderSuccessContent } from './success-content';

export const metadata: Metadata = { title: 'Order Submitted — Academania' };

export default function OrderSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-24 text-center text-muted-foreground">
          Loading…
        </div>
      }
    >
      <OrderSuccessContent />
    </Suspense>
  );
}
