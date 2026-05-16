import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Projects',
  description: 'Portfolio showcase of completed academic projects.',
};

export default function ProjectsPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold">Project Showcase</h1>
      <p className="mt-4 text-muted-foreground">Portfolio grid placeholder — Member A Day 1–2.</p>
    </div>
  );
}
