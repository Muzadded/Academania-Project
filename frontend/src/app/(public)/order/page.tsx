import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Submit Order' };

export default function OrderPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold">Submit Your Order</h1>
      <p className="mt-4 text-muted-foreground">
        Multi-step order form (4 steps) — Member A Day 3.
      </p>
    </div>
  );
}
