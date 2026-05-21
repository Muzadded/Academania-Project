'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  Download,
  FileText,
  GraduationCap,
  Loader2,
  RefreshCw,
  Upload,
  User,
} from 'lucide-react';
import { MeetingDto, OrderDetailDto, OrderStatus, PaymentDto } from '@academania/shared';
import { apiClient } from '@/lib/api-client';
import { MeetingStatusBadge, OrderStatusBadge, PaymentStatusBadge } from '@/lib/status-badge';
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

const ORDER_STATUSES: OrderStatus[] = ['RECEIVED', 'IN_PROGRESS', 'REVIEW', 'DONE', 'CANCELLED'];

interface Props {
  orderId: string;
}

export function AdminOrderDetail({ orderId }: Props) {
  const router = useRouter();
  const { data: session } = useSession();

  // Data state
  const [order, setOrder] = useState<OrderDetailDto | null>(null);
  const [payments, setPayments] = useState<PaymentDto[]>([]);
  const [meetings, setMeetings] = useState<MeetingDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Status update state
  const [newStatus, setNewStatus] = useState<OrderStatus | ''>('');
  const [statusNote, setStatusNote] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [statusErr, setStatusErr] = useState<string | null>(null);

  // Assign state
  const [assigneeId, setAssigneeId] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignMsg, setAssignMsg] = useState<string | null>(null);
  const [assignErr, setAssignErr] = useState<string | null>(null);

  // Deliverable upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);
  const [uploadErr, setUploadErr] = useState<string | null>(null);

  // Payment verify state
  const [verifyingPaymentId, setVerifyingPaymentId] = useState<string | null>(null);
  const [rejectingPaymentId, setRejectingPaymentId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [paymentMsg, setPaymentMsg] = useState<string | null>(null);
  const [paymentErr, setPaymentErr] = useState<string | null>(null);

  // Meeting confirm state
  const [confirmingMeetingId, setConfirmingMeetingId] = useState<string | null>(null);
  const [meetingLinkInput, setMeetingLinkInput] = useState('');
  const [addingLinkForId, setAddingLinkForId] = useState<string | null>(null);
  const [addLinkInput, setAddLinkInput] = useState('');
  const [meetingMsg, setMeetingMsg] = useState<string | null>(null);
  const [meetingErr, setMeetingErr] = useState<string | null>(null);

  const refetchAll = useCallback(
    async (showLoader = false) => {
      if (!session?.accessToken) return;
      try {
        if (showLoader) setIsLoading(true);
        const [orderData, paymentsData, meetingsData] = await Promise.all([
          apiClient<OrderDetailDto>(`/orders/${orderId}`, { token: session.accessToken }),
          apiClient<PaymentDto[]>(`/payments/${orderId}`, { token: session.accessToken }),
          apiClient<MeetingDto[]>(`/meetings/order/${orderId}`, { token: session.accessToken }),
        ]);
        setOrder(orderData);
        setPayments(paymentsData);
        setMeetings(meetingsData);
        if (showLoader) setNewStatus(orderData.status);
      } catch (err: any) {
        setError(err.message || 'Failed to load order.');
      } finally {
        if (showLoader) setIsLoading(false);
      }
    },
    [orderId, session?.accessToken],
  );

  useEffect(() => {
    refetchAll(true);
  }, [refetchAll]);

  // Sync status select with loaded order
  useEffect(() => {
    if (order && !newStatus) setNewStatus(order.status);
  }, [order, newStatus]);

  async function handleStatusUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!session?.accessToken || !newStatus || newStatus === order?.status) return;
    setIsUpdatingStatus(true);
    setStatusMsg(null);
    setStatusErr(null);
    try {
      await apiClient(`/orders/${orderId}/status`, {
        method: 'PATCH',
        token: session.accessToken,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, note: statusNote || undefined }),
      });
      setStatusMsg(`Status updated to ${newStatus.replace('_', ' ')}.`);
      setStatusNote('');
      await refetchAll();
    } catch (err: any) {
      setStatusErr(err.message || 'Failed to update status.');
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault();
    if (!session?.accessToken || !assigneeId.trim()) return;
    setIsAssigning(true);
    setAssignMsg(null);
    setAssignErr(null);
    try {
      await apiClient(`/admin/orders/${orderId}/assign`, {
        method: 'PATCH',
        token: session.accessToken,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigneeId: assigneeId.trim() }),
      });
      setAssignMsg('Order assigned successfully.');
      setAssigneeId('');
      await refetchAll();
    } catch (err: any) {
      setAssignErr(err.message || 'Failed to assign order.');
    } finally {
      setIsAssigning(false);
    }
  }

  async function handleUploadDeliverables(e: React.FormEvent) {
    e.preventDefault();
    if (!session?.accessToken || !selectedFiles || selectedFiles.length === 0) return;
    setIsUploading(true);
    setUploadMsg(null);
    setUploadErr(null);
    try {
      const formData = new FormData();
      Array.from(selectedFiles).forEach((f) => formData.append('files', f));
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const res = await fetch(`${apiUrl}/admin/orders/${orderId}/deliverables`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.accessToken}` },
        body: formData,
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.message || 'Upload failed.');
      }
      setUploadMsg(`${selectedFiles.length} file(s) uploaded successfully.`);
      setSelectedFiles(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await refetchAll();
    } catch (err: any) {
      setUploadErr(err.message || 'Failed to upload files.');
    } finally {
      setIsUploading(false);
    }
  }

  async function handleVerifyPayment(paymentId: string, approved: boolean, reason?: string) {
    if (!session?.accessToken) return;
    setVerifyingPaymentId(paymentId);
    setPaymentMsg(null);
    setPaymentErr(null);
    try {
      await apiClient(`/payments/${paymentId}/verify`, {
        method: 'PATCH',
        token: session.accessToken,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved, rejectionReason: reason || undefined }),
      });
      setPaymentMsg(approved ? 'Payment verified.' : 'Payment rejected.');
      setRejectingPaymentId(null);
      setRejectionReason('');
      await refetchAll();
    } catch (err: any) {
      setPaymentErr(err.message || 'Failed to update payment.');
    } finally {
      setVerifyingPaymentId(null);
    }
  }

  async function handleConfirmMeeting(meetingId: string) {
    if (!session?.accessToken) return;
    setConfirmingMeetingId(meetingId);
    setMeetingMsg(null);
    setMeetingErr(null);
    try {
      await apiClient(`/meetings/${meetingId}/confirm`, {
        method: 'PATCH',
        token: session.accessToken,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slotId: meetingId, meetingLink: meetingLinkInput || undefined }),
      });
      setMeetingMsg('Meeting slot confirmed.');
      setMeetingLinkInput('');
      await refetchAll();
    } catch (err: any) {
      setMeetingErr(err.message || 'Failed to confirm meeting.');
    } finally {
      setConfirmingMeetingId(null);
    }
  }

  async function handleAddMeetingLink(meetingId: string) {
    if (!session?.accessToken || !addLinkInput.trim()) return;
    setConfirmingMeetingId(meetingId);
    setMeetingMsg(null);
    setMeetingErr(null);
    try {
      await apiClient(`/meetings/${meetingId}/add-link`, {
        method: 'POST',
        token: session.accessToken,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ link: addLinkInput.trim() }),
      });
      setMeetingMsg('Meeting link added.');
      setAddingLinkForId(null);
      setAddLinkInput('');
      await refetchAll();
    } catch (err: any) {
      setMeetingErr(err.message || 'Failed to add link.');
    } finally {
      setConfirmingMeetingId(null);
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-[500px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          onClick={() => router.push('/client/orders')}
          className="p-0 hover:bg-transparent text-muted-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Orders
        </Button>
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-6 text-center text-destructive">
          <AlertCircle className="mx-auto h-12 w-12 mb-4" />
          <h3 className="text-lg font-semibold">Error Loading Order</h3>
          <p className="mt-2 text-sm">{error || 'Order could not be found.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Button
            variant="ghost"
            onClick={() => router.push('/client/orders')}
            className="p-0 hover:bg-transparent text-muted-foreground hover:text-foreground mb-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Orders
          </Button>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight font-mono">{order.referenceNumber}</h1>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {order.serviceTitle} &mdash; {order.clientName}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetchAll(false)}
          className="self-start sm:self-center gap-1.5"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </div>

      {/* Main grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* ── Left column (2/3) ── */}
        <div className="md:col-span-2 space-y-6">
          {/* Status Update */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Update Order Status</CardTitle>
              <CardDescription>Change the order stage and optionally leave a note.</CardDescription>
            </CardHeader>
            <form onSubmit={handleStatusUpdate}>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label>New Status</Label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {ORDER_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Note (optional)</Label>
                  <textarea
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    placeholder="Add a note about this status change…"
                    className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                {statusMsg && (
                  <div className="flex items-center gap-2 rounded-lg bg-emerald-500/15 p-3 text-xs text-emerald-600">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    {statusMsg}
                  </div>
                )}
                {statusErr && (
                  <div className="flex items-center gap-2 rounded-lg bg-destructive/15 p-3 text-xs text-destructive">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {statusErr}
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button
                  type="submit"
                  disabled={isUpdatingStatus || !newStatus || newStatus === order.status}
                >
                  {isUpdatingStatus ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-1" /> Updating…
                    </>
                  ) : (
                    'Update Status'
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>

          {/* Assign Order */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Assign Order</CardTitle>
              <CardDescription>
                Currently:{' '}
                {order.assignedTo ? (
                  <span className="font-medium text-foreground">Assigned</span>
                ) : (
                  <span className="text-muted-foreground">Unassigned</span>
                )}
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleAssign}>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="assignee-id">Admin User ID</Label>
                  <div className="flex gap-2">
                    <Input
                      id="assignee-id"
                      value={assigneeId}
                      onChange={(e) => setAssigneeId(e.target.value)}
                      placeholder="Enter the admin user ID to assign…"
                    />
                  </div>
                </div>
                {assignMsg && (
                  <div className="flex items-center gap-2 rounded-lg bg-emerald-500/15 p-3 text-xs text-emerald-600">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    {assignMsg}
                  </div>
                )}
                {assignErr && (
                  <div className="flex items-center gap-2 rounded-lg bg-destructive/15 p-3 text-xs text-destructive">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {assignErr}
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={isAssigning || !assigneeId.trim()}>
                  {isAssigning ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-1" /> Assigning…
                    </>
                  ) : (
                    'Assign'
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>

          {/* Upload Deliverables */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Upload Deliverables</CardTitle>
              <CardDescription>Upload final files for the client to download.</CardDescription>
            </CardHeader>
            <form onSubmit={handleUploadDeliverables}>
              <CardContent className="space-y-4">
                <label
                  htmlFor="deliverable-upload"
                  className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-input bg-muted/20 p-8 text-center hover:bg-muted/40 transition-colors cursor-pointer"
                >
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm font-medium">Click to select files</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedFiles && selectedFiles.length > 0
                      ? `${selectedFiles.length} file(s) selected`
                      : 'Multiple files supported'}
                  </p>
                  <input
                    id="deliverable-upload"
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => setSelectedFiles(e.target.files)}
                  />
                </label>
                {uploadMsg && (
                  <div className="flex items-center gap-2 rounded-lg bg-emerald-500/15 p-3 text-xs text-emerald-600">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    {uploadMsg}
                  </div>
                )}
                {uploadErr && (
                  <div className="flex items-center gap-2 rounded-lg bg-destructive/15 p-3 text-xs text-destructive">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {uploadErr}
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button
                  type="submit"
                  disabled={isUploading || !selectedFiles || selectedFiles.length === 0}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-1" /> Uploading…
                    </>
                  ) : (
                    'Upload Files'
                  )}
                </Button>
              </CardFooter>
            </form>

            {/* Existing deliverables list */}
            {order.deliverables.length > 0 && (
              <CardContent className="border-t pt-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Uploaded Deliverables ({order.deliverables.length})
                </p>
                <div className="divide-y border rounded-lg overflow-hidden">
                  {order.deliverables.map((d) => (
                    <div
                      key={d.id}
                      className="flex items-center justify-between p-3 hover:bg-muted/20 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate max-w-xs">{d.fileName}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(d.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" asChild>
                        <a href={d.fileUrl} download target="_blank" rel="noreferrer">
                          <Download className="h-3 w-3 mr-1" /> Download
                        </a>
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>

          {/* Payments Management */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Payments</CardTitle>
              <CardDescription>
                Review and verify payment proofs submitted by the client.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {paymentMsg && (
                <div className="flex items-center gap-2 rounded-lg bg-emerald-500/15 p-3 text-xs text-emerald-600 mb-4">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  {paymentMsg}
                </div>
              )}
              {paymentErr && (
                <div className="flex items-center gap-2 rounded-lg bg-destructive/15 p-3 text-xs text-destructive mb-4">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {paymentErr}
                </div>
              )}
              {payments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                  <DollarSign className="h-10 w-10 text-muted-foreground/40 mb-2" />
                  <p className="text-sm font-medium">No payments submitted</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {payments.map((payment) => (
                    <div key={payment.id} className="rounded-lg border p-4 space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">
                              ${Number(payment.amount).toLocaleString()}
                            </span>
                            <span className="text-xs text-muted-foreground">{payment.method}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {new Date(payment.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <PaymentStatusBadge status={payment.status} />
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {payment.screenshotUrl && (
                          <Button size="sm" variant="outline" asChild>
                            <a href={payment.screenshotUrl} target="_blank" rel="noreferrer">
                              View Proof
                            </a>
                          </Button>
                        )}

                        {payment.status === 'PENDING_REVIEW' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleVerifyPayment(payment.id, true)}
                              disabled={verifyingPaymentId === payment.id}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                              {verifyingPaymentId === payment.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                              )}
                              Verify
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() =>
                                setRejectingPaymentId(
                                  rejectingPaymentId === payment.id ? null : payment.id,
                                )
                              }
                              disabled={verifyingPaymentId === payment.id}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                      </div>

                      {/* Rejection reason input */}
                      {rejectingPaymentId === payment.id && (
                        <div className="space-y-2 border-t pt-3">
                          <Input
                            placeholder="Rejection reason (required)"
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() =>
                                handleVerifyPayment(payment.id, false, rejectionReason)
                              }
                              disabled={
                                !rejectionReason.trim() || verifyingPaymentId === payment.id
                              }
                            >
                              {verifyingPaymentId === payment.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : null}
                              Confirm Reject
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setRejectingPaymentId(null);
                                setRejectionReason('');
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}

                      {payment.rejectionReason && (
                        <p className="text-xs text-rose-600 border-t pt-2">
                          Rejection reason: {payment.rejectionReason}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Right column (1/3) ── */}
        <div className="space-y-6">
          {/* Order Specs */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Project Specifications</CardTitle>
              <CardDescription>Client-submitted order details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-3 rounded-lg border p-3 bg-muted/20">
                <User className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Client</p>
                  <p className="font-semibold">{order.clientName}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border p-3 bg-muted/20">
                <GraduationCap className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">University</p>
                  <p className="font-semibold">{order.university}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border p-3 bg-muted/20">
                <Calendar className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Deadline</p>
                  <p className="font-semibold">
                    {new Date(order.deadline).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border p-3 bg-muted/20">
                <DollarSign className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Budget</p>
                  <p className="font-semibold">${Number(order.budget).toLocaleString()}</p>
                </div>
              </div>
              <div className="space-y-1 pt-2 border-t">
                <p className="text-xs font-semibold text-muted-foreground">Description</p>
                <div className="bg-muted/40 p-3 rounded-lg text-xs leading-relaxed max-h-[140px] overflow-y-auto whitespace-pre-line">
                  {order.description || 'No description provided.'}
                </div>
              </div>
              {order.requirementFileUrl && (
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <a href={order.requirementFileUrl} target="_blank" rel="noreferrer">
                    <Download className="h-4 w-4 mr-1" /> View Brief File
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Status History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Status History</CardTitle>
            </CardHeader>
            <CardContent>
              {order.statusHistory.length === 0 ? (
                <p className="text-xs text-muted-foreground">No history yet.</p>
              ) : (
                <div className="relative border-l pl-4 space-y-4 text-xs">
                  {order.statusHistory.map((h, idx) => (
                    <div key={h.id || idx} className="relative">
                      <span className="absolute -left-[21px] top-0.5 h-2 w-2 rounded-full bg-primary ring-4 ring-background" />
                      <p className="font-bold">{h.status.replace('_', ' ')}</p>
                      {h.note && <p className="text-muted-foreground mt-0.5">{h.note}</p>}
                      <p className="text-[10px] text-muted-foreground/60 mt-1">
                        {new Date(h.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Meetings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Meeting Slots</CardTitle>
              <CardDescription>Client&apos;s preferred meeting times.</CardDescription>
            </CardHeader>
            <CardContent>
              {meetingMsg && (
                <div className="flex items-center gap-2 rounded-lg bg-emerald-500/15 p-3 text-xs text-emerald-600 mb-3">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  {meetingMsg}
                </div>
              )}
              {meetingErr && (
                <div className="flex items-center gap-2 rounded-lg bg-destructive/15 p-3 text-xs text-destructive mb-3">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {meetingErr}
                </div>
              )}
              {meetings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
                  <Clock className="h-8 w-8 text-muted-foreground/40 mb-2" />
                  <p className="text-xs">No meeting slots requested.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {meetings.map((meeting) => (
                    <div key={meeting.id} className="rounded-lg border p-3 space-y-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div>
                          <p className="text-xs font-semibold">
                            Priority #{meeting.priority} &mdash;{' '}
                            {new Date(meeting.preferredAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {meeting.clientName} &lt;{meeting.clientEmail}&gt;
                          </p>
                        </div>
                        <MeetingStatusBadge status={meeting.status} />
                      </div>

                      {meeting.meetingLink && (
                        <a
                          href={meeting.meetingLink}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-primary hover:underline block truncate"
                        >
                          Join: {meeting.meetingLink}
                        </a>
                      )}

                      {/* Confirm slot action */}
                      {meeting.status === 'PENDING' && (
                        <div className="space-y-2 border-t pt-2">
                          <Input
                            placeholder="Meeting link (optional)"
                            value={confirmingMeetingId === meeting.id ? meetingLinkInput : ''}
                            onFocus={() => {}}
                            onChange={(e) => setMeetingLinkInput(e.target.value)}
                            className="text-xs h-8"
                          />
                          <Button
                            size="sm"
                            className="w-full"
                            onClick={() => handleConfirmMeeting(meeting.id)}
                            disabled={confirmingMeetingId === meeting.id}
                          >
                            {confirmingMeetingId === meeting.id ? (
                              <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            ) : (
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                            )}
                            Confirm This Slot
                          </Button>
                        </div>
                      )}

                      {/* Add link action for confirmed slots without link */}
                      {meeting.status === 'CONFIRMED' && !meeting.meetingLink && (
                        <div className="border-t pt-2">
                          {addingLinkForId === meeting.id ? (
                            <div className="space-y-2">
                              <Input
                                placeholder="Paste meeting link…"
                                value={addLinkInput}
                                onChange={(e) => setAddLinkInput(e.target.value)}
                                className="text-xs h-8"
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleAddMeetingLink(meeting.id)}
                                  disabled={
                                    !addLinkInput.trim() || confirmingMeetingId === meeting.id
                                  }
                                >
                                  {confirmingMeetingId === meeting.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : null}
                                  Save Link
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setAddingLinkForId(null);
                                    setAddLinkInput('');
                                  }}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full"
                              onClick={() => setAddingLinkForId(meeting.id)}
                            >
                              + Add Meeting Link
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
