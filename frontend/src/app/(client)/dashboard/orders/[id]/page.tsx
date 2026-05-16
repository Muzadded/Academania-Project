interface OrderDetailPageProps {
  params: { id: string };
}

export default function OrderDetailPage({ params }: OrderDetailPageProps) {
  return (
    <div>
      <h1 className="text-2xl font-bold">Order {params.id}</h1>
      <p className="mt-4 text-muted-foreground">
        Progress tracker, deliverables, revision form — Member B Day 4.
      </p>
    </div>
  );
}
