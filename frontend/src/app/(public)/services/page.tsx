import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Services',
  description: 'Explore our academic project and research services.',
};

export default function ServicesPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold">Services</h1>
      <p className="mt-4 text-muted-foreground">
        Service cards will load from GET /services. Implement feature in Member A sprint.
      </p>
    </div>
  );
}
