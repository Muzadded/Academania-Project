import { AdminOrderDetail } from '@/components/features/admin/admin-order-detail';

interface Props {
  params: { id: string };
}

export default function AdminOrderDetailPage({ params }: Props) {
  return <AdminOrderDetail orderId={params.id} />;
}
