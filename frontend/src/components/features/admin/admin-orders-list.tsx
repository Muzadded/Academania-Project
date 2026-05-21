'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { AlertCircle, FileText, Loader2, Search } from 'lucide-react';
import { AdminOrderSummaryDto, OrderStatus } from '@academania/shared';
import { apiClient } from '@/lib/api-client';
import { OrderStatusBadge } from '@/lib/status-badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const STATUS_FILTERS: Array<OrderStatus | 'ALL'> = [
  'ALL',
  'RECEIVED',
  'IN_PROGRESS',
  'REVIEW',
  'DONE',
  'CANCELLED',
];

function isUrgent(deadline: string, status: string): boolean {
  if (status === 'DONE' || status === 'CANCELLED') return false;
  return new Date(deadline).getTime() - Date.now() < 48 * 3600 * 1000;
}

export function AdminOrdersList() {
  const { data: session } = useSession();
  const [orders, setOrders] = useState<AdminOrderSummaryDto[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<AdminOrderSummaryDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL');
  const [deadlineBefore, setDeadlineBefore] = useState('');

  useEffect(() => {
    async function load() {
      if (!session?.accessToken) return;
      try {
        const data = await apiClient<AdminOrderSummaryDto[]>('/admin/orders', {
          token: session.accessToken,
        });
        setOrders(data);
        setFilteredOrders(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load orders.');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [session?.accessToken]);

  useEffect(() => {
    let result = orders;

    if (statusFilter !== 'ALL') {
      result = result.filter((o) => o.status === statusFilter);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (o) =>
          o.referenceNumber.toLowerCase().includes(term) ||
          o.clientName.toLowerCase().includes(term) ||
          o.service.title.toLowerCase().includes(term),
      );
    }

    if (deadlineBefore) {
      result = result.filter((o) => new Date(o.deadline) <= new Date(deadlineBefore));
    }

    setFilteredOrders(result);
  }, [searchTerm, statusFilter, deadlineBefore, orders]);

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-6 text-center text-destructive">
        <AlertCircle className="mx-auto h-12 w-12 mb-4" />
        <h3 className="text-lg font-semibold">Error Loading Orders</h3>
        <p className="mt-2 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">All Orders</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage and track all client orders. {orders.length} total order
          {orders.length !== 1 ? 's' : ''}.
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by ref, client, or service…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            {/* Deadline before */}
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground whitespace-nowrap">Due before</label>
              <input
                type="date"
                value={deadlineBefore}
                onChange={(e) => setDeadlineBefore(e.target.value)}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              {deadlineBefore && (
                <button
                  onClick={() => setDeadlineBefore('')}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
          {/* Status pills */}
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  'px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all',
                  statusFilter === s
                    ? 'bg-primary border-primary text-primary-foreground shadow-sm'
                    : 'bg-background hover:bg-muted text-muted-foreground',
                )}
              >
                {s === 'ALL' ? 'All' : s.replace('_', ' ')}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Orders table */}
      <Card>
        <CardContent className="p-0">
          {filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
              <FileText className="h-16 w-16 text-muted-foreground/40 mb-4" />
              <p className="font-semibold text-lg">No orders found</p>
              <p className="text-sm mt-1">
                {orders.length === 0
                  ? 'No orders have been submitted yet.'
                  : 'Try adjusting your search or filter.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Ref
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Service
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Deadline
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Budget
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Assignee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredOrders.map((order) => {
                    const urgent = isUrgent(order.deadline, order.status);
                    return (
                      <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs font-medium">
                          {order.referenceNumber}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium">
                            {order.client?.name ?? order.clientName}
                          </div>
                          {order.client?.email && (
                            <div className="text-xs text-muted-foreground">
                              {order.client.email}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">{order.service.title}</td>
                        <td className="px-6 py-4">
                          <OrderStatusBadge status={order.status} />
                        </td>
                        <td
                          className={cn(
                            'px-6 py-4 text-xs',
                            urgent ? 'text-rose-600 font-semibold' : 'text-muted-foreground',
                          )}
                        >
                          {new Date(order.deadline).toLocaleDateString()}
                          {urgent && ' ⚠'}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          ${Number(order.budget).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-xs text-muted-foreground">
                          {order.assigneeId ? (
                            <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                              Assigned
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <Link
                            href={`/client/orders/${order.id}`}
                            className="inline-flex items-center rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
                          >
                            Manage →
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
