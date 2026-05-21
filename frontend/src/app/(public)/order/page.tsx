import type { Metadata } from 'next';

import { OrderSubmissionForm } from '@/components/features/orders/order-submission-form';

export const metadata: Metadata = { title: 'Submit Order — Academania' };

export default function OrderPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Submit Your Order</h1>
        <p className="mt-2 text-muted-foreground">
          Complete the form below and we&apos;ll get back to you within 24 hours to confirm your
          meeting slot and project details.
        </p>
      </div>

      <div className="rounded-2xl border bg-card shadow-sm p-6 sm:p-8">
        <OrderSubmissionForm />
      </div>
    </div>
  );
}
