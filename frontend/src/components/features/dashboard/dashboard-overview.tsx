'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Calendar,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { OrderSummaryDto } from '@academania/shared';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function DashboardOverview() {
  const { data: session } = useSession();
  const [orders, setOrders] = useState<OrderSummaryDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrders() {
      if (!session?.accessToken) return;
      try {
        setIsLoading(true);
        const data = await apiClient<OrderSummaryDto[]>('/orders', {
          token: session.accessToken,
        });
        setOrders(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load orders.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchOrders();
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

  // Calculate statistics
  const totalOrders = orders.length;
  const inProgress = orders.filter((o) => o.status === 'IN_PROGRESS').length;
  const inReview = orders.filter((o) => o.status === 'REVIEW').length;
  const completed = orders.filter((o) => o.status === 'DONE').length;

  const recentOrders = orders.slice(0, 5);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'RECEIVED':
        return (
          <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
            Received
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
            In Progress
          </span>
        );
      case 'REVIEW':
        return (
          <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">
            In Review
          </span>
        );
      case 'DONE':
        return (
          <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
            Completed
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-medium text-rose-800 dark:bg-rose-900/30 dark:text-rose-300">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-900/30 dark:text-gray-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-indigo-600 p-8 text-white shadow-lg">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight">
            Welcome back, {session?.user?.name || 'Academic'}!
          </h2>
          <p className="mt-2 text-white/80">
            Track your thesis, dissertation, and course assignments in real-time, communicate
            directly with your dedicated expert, and view downloadable deliverables.
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <Button asChild variant="secondary" className="bg-white text-primary hover:bg-white/95">
              <Link href="/order" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Submit New Project
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10"
            >
              <Link href="/book-meeting" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Book Consultation
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Projects
            </CardTitle>
            <FileText className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground mt-1">Submitted in total</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgress}</div>
            <p className="text-xs text-muted-foreground mt-1">Currently being drafted</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Under Review
            </CardTitle>
            <Clock className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inReview}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting client review</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completed}</div>
            <p className="text-xs text-muted-foreground mt-1">Fully approved & delivered</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Projects</CardTitle>
            <CardDescription>
              A list of your 5 most recently submitted academic projects.
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/orders" className="flex items-center gap-1">
              View All Orders
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <FileText className="h-12 w-12 text-muted/60 mb-4" />
              <p className="font-medium text-base">No projects submitted yet</p>
              <p className="text-sm mt-1 mb-4">
                Submit a project description to get started with Academania.
              </p>
              <Button asChild size="sm">
                <Link href="/order" className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Submit Your Project
                </Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground font-medium">
                    <th className="py-3 px-4">Ref Number</th>
                    <th className="py-3 px-4">Service</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Deadline</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="py-4 px-4 font-mono font-medium text-foreground">
                        {order.referenceNumber}
                      </td>
                      <td className="py-4 px-4">{order.serviceTitle}</td>
                      <td className="py-4 px-4">{getStatusBadge(order.status)}</td>
                      <td className="py-4 px-4 text-muted-foreground">
                        {new Date(order.deadline).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/dashboard/orders/${order.id}`}>Track & View</Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
