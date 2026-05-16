import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Contact' };

export default function ContactPage() {
  return (
    <div className="container mx-auto max-w-xl px-4 py-16">
      <h1 className="text-3xl font-bold">Contact Us</h1>
      <p className="mt-4 text-muted-foreground">Contact form UI — POST /contact (Member A).</p>
    </div>
  );
}
