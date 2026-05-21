'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  Package,
  Clock,
  CheckCircle2,
  DollarSign,
  AlertCircle,
  Loader2,
  FileText,
  ArrowRight,
} from 'lucide-react';
import { AdminAnalyticsDto, AdminOrderSummaryDto, OrderStatus } from '@academania/shared';
import { apiClient } from '@/lib/api-client';
import { OrderStatusBadge } from '@/lib/status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const STATUS_ORDER: OrderStatus[] = ['RECEIVED', 'IN_PROGRESS', 'REVIEW', 'DONE', 'CANCELLED'];

export function AdminDashboardOverview() {
  const { data: session } = useSession();
  const [analytics, setAnalytics] = useState<AdminAnalyticsDto | null>(null);
  const [recentOrders, setRecentOrders] = useState<AdminOrderSummaryDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!session?.accessToken) return;
      try {
        const [analyticsData, ordersData] = await Promise.all([
          apiClient<AdminAnalyticsDto>('/admin/analytics', { token: session.accessToken }),
          apiClient<AdminOrderSummaryDto[]>('/admin/orders', { token: session.accessToken }),
        ]);
        setAnalytics(analyticsData);
        setRecentOrders(ordersData.slice(0, 5));
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard data.');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [session?.accessToken]);

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
        <h3 className="text-lg font-semibold">Error Loading Dashboard</h3>
        <p className="mt-2 text-sm">{error}</p>
      </div>
    );
  }

  const kpiCards = [
    {
      label: 'Total Orders',
      value: analytics?.totalOrders ?? 0,
      icon: Package,
      iconClass: 'text-primary',
      bgClass: 'bg-primary/10',
    },
    {
      label: 'Active Orders',
      value: analytics?.activeOrders ?? 0,
      icon: Clock,
      iconClass: 'text-amber-600',
      bgClass: 'bg-amber-500/10',
    },
    {
      label: 'Completed',
      value: analytics?.completedOrders ?? 0,
      icon: CheckCircle2,
      iconClass: 'text-emerald-600',
      bgClass: 'bg-emerald-500/10',
    },
    {
      label: 'Total Revenue',
      value: `$${(analytics?.totalRevenue ?? 0).toLocaleString()}`,
      icon: DollarSign,
      iconClass: 'text-primary',
      bgClass: 'bg-primary/10',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Welcome back, {session?.user?.name}. Here&apos;s your platform overview.
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((card) => (
          <Card key={card.label}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {card.label}
                  </p>
                  <p className="mt-1 text-2xl font-bold">{card.value}</p>
                </div>
                <div
                  className={cn(
                    'flex h-12 w-12 items-center justify-center rounded-xl',
                    card.bgClass,
                  )}
                >
                  <card.icon className={cn('h-6 w-6', card.iconClass)} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Status breakdown */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Orders by Status
        </h2>
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {STATUS_ORDER.map((status) => (
            <Card key={status}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{analytics?.ordersByStatus?.[status] ?? 0}</p>
                  <div className="mt-1">
                    <OrderStatusBadge status={status} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent orders table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-semibold">Recent Orders</CardTitle>
          <Link
            href="/client/orders"
            className="flex items-center gap-1 text-xs text-primary hover:underline font-medium"
          >
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {recentOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <FileText className="h-12 w-12 text-muted-foreground/40 mb-3" />
              <p className="font-semibold">No orders yet</p>
              <p className="text-sm mt-1">Orders will appear here once clients submit them.</p>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentOrders.map((order) => {
                    const isUrgent =
                      new Date(order.deadline).getTime() - Date.now() < 48 * 3600 * 1000 &&
                      order.status !== 'DONE' &&
                      order.status !== 'CANCELLED';
                    return (
                      <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs font-medium">
                          {order.referenceNumber}
                        </td>
                        <td className="px-6 py-4">{order.client?.name ?? order.clientName}</td>
                        <td className="px-6 py-4 text-muted-foreground">{order.service.title}</td>
                        <td className="px-6 py-4">
                          <OrderStatusBadge status={order.status} />
                        </td>
                        <td
                          className={cn(
                            'px-6 py-4 text-xs',
                            isUrgent ? 'text-rose-600 font-semibold' : 'text-muted-foreground',
                          )}
                        >
                          {new Date(order.deadline).toLocaleDateString()}
                          {isUrgent && ' ⚠'}
                        </td>
                        <td className="px-6 py-4">
                          <Link
                            href={`/client/orders/${order.id}`}
                            className="text-xs font-medium text-primary hover:underline"
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
