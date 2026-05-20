'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  CreditCard,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  History,
  DollarSign,
} from 'lucide-react';
import { OrderSummaryDto, OrderDetailDto, PaymentDto } from '@academania/shared';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function DashboardPayments() {
  const { data: session } = useSession();
  const [orders, setOrders] = useState<OrderSummaryDto[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<OrderDetailDto | null>(null);
  const [payments, setPayments] = useState<PaymentDto[]>([]);

  // Loading & Error states
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states
  const [amount, setAmount] = useState<string>('');
  const [method, setMethod] = useState<string>('Bank Transfer');
  const [file, setFile] = useState<File | null>(null);

  // Load orders list on load
  useEffect(() => {
    async function fetchOrders() {
      if (!session?.accessToken) return;
      try {
        setIsLoadingOrders(true);
        const data = await apiClient<OrderSummaryDto[]>('/orders', {
          token: session.accessToken,
        });
        setOrders(data);
        if (data.length > 0) {
          setSelectedOrderId(data[0].id);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load orders.');
      } finally {
        setIsLoadingOrders(false);
      }
    }
    fetchOrders();
  }, [session?.accessToken]);

  // Load details and payments when order selection changes
  useEffect(() => {
    if (!selectedOrderId || !session?.accessToken) return;

    async function fetchOrderDetailsAndPayments() {
      try {
        setIsLoadingPayments(true);
        setError(null);
        setSuccessMsg(null);

        // Fetch full order details to get the budget
        const detail = await apiClient<OrderDetailDto>(`/orders/${selectedOrderId}`, {
          token: session?.accessToken,
        });
        setSelectedOrderDetail(detail);
        setAmount(detail.budget.toString());

        // Fetch payments for this order
        const paymentsList = await apiClient<PaymentDto[]>(`/payments/${selectedOrderId}`, {
          token: session?.accessToken,
        });
        setPayments(paymentsList);
      } catch (err: any) {
        setError(err.message || 'Failed to load payment history.');
      } finally {
        setIsLoadingPayments(false);
      }
    }

    fetchOrderDetailsAndPayments();
  }, [selectedOrderId, session?.accessToken]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUploadProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.accessToken || !selectedOrderId) return;
    if (!amount || Number(amount) <= 0) {
      setError('Please enter a valid amount.');
      return;
    }
    if (!file) {
      setError('Please select a payment screenshot/proof file.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      setSuccessMsg(null);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const formData = new FormData();
      formData.append('orderId', selectedOrderId);
      formData.append('amount', amount);
      formData.append('method', method);
      formData.append('screenshot', file);

      const res = await fetch(`${apiUrl}/payments/proof`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to upload payment proof.');
      }

      setSuccessMsg('Payment proof uploaded successfully. Awaiting review.');
      setFile(null);

      // Reset file input element
      const fileInput = document.getElementById('screenshot') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      // Reload payments history
      const paymentsList = await apiClient<PaymentDto[]>(`/payments/${selectedOrderId}`, {
        token: session?.accessToken,
      });
      setPayments(paymentsList);
    } catch (err: any) {
      setError(err.message || 'Failed to submit proof.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING_REVIEW':
        return (
          <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 font-medium">
            Pending Review
          </span>
        );
      case 'VERIFIED':
        return (
          <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 font-medium">
            Verified
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-medium text-rose-800 dark:bg-rose-900/30 dark:text-rose-300 font-medium">
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-900/30 dark:text-gray-300 font-medium">
            {status}
          </span>
        );
    }
  };

  if (isLoadingOrders) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <Card className="max-w-2xl mx-auto py-12 text-center">
        <CardContent className="flex flex-col items-center justify-center">
          <CreditCard className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <h3 className="text-xl font-bold">No active projects</h3>
          <p className="text-muted-foreground mt-2 max-w-sm">
            Before uploading payment screenshots, you need to submit a project order.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
        <p className="text-muted-foreground mt-2">
          Upload payment screenshots and track your transaction verification status.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Selection & Form */}
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Select Project</CardTitle>
              <CardDescription>Select the order to view payments or submit proof.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="orderSelect">Associated Order</Label>
                <select
                  id="orderSelect"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={selectedOrderId}
                  onChange={(e) => setSelectedOrderId(e.target.value)}
                >
                  {orders.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.referenceNumber} - {o.serviceTitle}
                    </option>
                  ))}
                </select>
              </div>

              {selectedOrderDetail && (
                <div className="rounded-lg bg-muted/40 p-4 border space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Original Budget:</span>
                    <span className="font-semibold text-foreground">
                      ${selectedOrderDetail.budget}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Project Status:</span>
                    <span className="font-semibold text-primary">{selectedOrderDetail.status}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle>Submit Proof of Payment</CardTitle>
              <CardDescription>Upload bank receipt or transaction screenshot.</CardDescription>
            </CardHeader>
            <form onSubmit={handleUploadProof}>
              <CardContent className="space-y-4">
                {error && (
                  <div className="flex items-center gap-2 rounded-lg bg-destructive/15 p-3 text-xs text-destructive">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <div>{error}</div>
                  </div>
                )}
                {successMsg && (
                  <div className="flex items-center gap-2 rounded-lg bg-emerald-500/15 p-3 text-xs text-emerald-600">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <div>{successMsg}</div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="amount">Amount ($)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">$</span>
                    <Input
                      id="amount"
                      type="number"
                      min="1"
                      className="pl-7 bg-background/50"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="method">Payment Method</Label>
                  <select
                    id="method"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="PayPal">PayPal</option>
                    <option value="Stripe / Credit Card">Stripe / Credit Card</option>
                    <option value="Crypto">Crypto (BTC/USDT)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="screenshot">Screenshot / Proof File</Label>
                  <div className="flex items-center justify-center border-2 border-dashed rounded-lg p-4 bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer relative">
                    <input
                      id="screenshot"
                      type="file"
                      accept="image/*,application/pdf"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={handleFileChange}
                      required
                    />
                    <div className="text-center space-y-1 text-sm text-muted-foreground">
                      <Upload className="mx-auto h-8 w-8 mb-1 text-muted-foreground/75" />
                      <span className="font-semibold text-primary">Click to upload</span> or drag
                      and drop
                      <p className="text-xs text-muted-foreground/75 mt-1">
                        {file ? file.name : 'PNG, JPG, PDF up to 5MB'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit Payment Proof
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>

        {/* Payments History */}
        <div className="md:col-span-2">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center gap-2">
              <History className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle>Payment History</CardTitle>
                <CardDescription>
                  All submitted payment transaction receipts for the selected project.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingPayments ? (
                <div className="flex h-[200px] items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : payments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
                  <DollarSign className="h-12 w-12 text-muted/50 mb-3" />
                  <p className="font-semibold">No payment history</p>
                  <p className="text-sm">
                    Submit your first payment receipt using the form on the left.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b text-muted-foreground font-medium">
                        <th className="py-3 px-3">Date</th>
                        <th className="py-3 px-3">Method</th>
                        <th className="py-3 px-3">Amount</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3 text-right">Proof File</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((p) => (
                        <tr
                          key={p.id}
                          className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                        >
                          <td className="py-4 px-3 text-muted-foreground">
                            {new Date(p.createdAt).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </td>
                          <td className="py-4 px-3 font-medium">{p.method}</td>
                          <td className="py-4 px-3 font-semibold text-foreground">${p.amount}</td>
                          <td className="py-4 px-3">
                            <div className="space-y-1">
                              {getStatusBadge(p.status)}
                              {p.rejectionReason && (
                                <p className="text-xs text-rose-500 font-normal max-w-[200px]">
                                  Reason: {p.rejectionReason}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-3 text-right">
                            {p.screenshotUrl ? (
                              <Button
                                variant="link"
                                size="sm"
                                className="p-0 text-primary hover:underline font-medium"
                                asChild
                              >
                                <a href={p.screenshotUrl} target="_blank" rel="noreferrer">
                                  View Receipt
                                </a>
                              </Button>
                            ) : (
                              <span className="text-muted-foreground text-xs">None</span>
                            )}
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
      </div>
    </div>
  );
}
