interface ClientOrderDetailPageProps {
  params: { id: string };
}

export default function ClientOrderDetailPage({ params }: ClientOrderDetailPageProps) {
  return (
    <div>
      <h1 className="text-2xl font-bold">Manage Order {params.id}</h1>
      <p className="mt-4 text-muted-foreground">
        Assign team, upload deliverables, chat panel — Member C Day 5–6.
      </p>
    </div>
  );
}
