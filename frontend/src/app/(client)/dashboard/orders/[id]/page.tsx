'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Loader2,
  Download,
  AlertCircle,
  Calendar,
  DollarSign,
  GraduationCap,
  FileText,
  RefreshCw,
  FileDown,
} from 'lucide-react';
import { OrderDetailDto } from '@academania/shared';
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
import { Label } from '@/components/ui/label';

interface OrderDetailPageProps {
  params: { id: string };
}

export default function OrderDetailPage({ params }: OrderDetailPageProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [order, setOrder] = useState<OrderDetailDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Revision state
  const [revisionNote, setRevisionNote] = useState('');
  const [isSubmittingRevision, setIsSubmittingRevision] = useState(false);
  const [revisionSuccess, setRevisionSuccess] = useState<string | null>(null);
  const [revisionError, setRevisionError] = useState<string | null>(null);

  const fetchOrderDetail = useCallback(
    async (showLoader = true) => {
      if (!session?.accessToken) return;
      try {
        if (showLoader) setIsLoading(true);
        const data = await apiClient<OrderDetailDto>(`/orders/${params.id}`, {
          token: session.accessToken,
        });
        setOrder(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load order details.');
      } finally {
        if (showLoader) setIsLoading(false);
      }
    },
    [params.id, session?.accessToken],
  );

  useEffect(() => {
    fetchOrderDetail();
  }, [fetchOrderDetail]);

  const handleRevisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisionNote.trim() || !session?.accessToken) return;

    try {
      setIsSubmittingRevision(true);
      setRevisionError(null);
      setRevisionSuccess(null);

      await apiClient(`/orders/${params.id}/revision-request`, {
        method: 'POST',
        token: session.accessToken,
        body: JSON.stringify({ note: revisionNote.trim() }),
      });

      setRevisionSuccess('Revision request submitted successfully.');
      setRevisionNote('');

      // Reload details to show updated history/notes
      await fetchOrderDetail(false);
    } catch (err: any) {
      setRevisionError(err.message || 'Failed to submit revision request.');
    } finally {
      setIsSubmittingRevision(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[500px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container mx-auto max-w-4xl space-y-6 py-8">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
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

  // Define steps for progress bar
  const steps = [
    { label: 'Received', statusKey: 'RECEIVED' },
    { label: 'In Progress', statusKey: 'IN_PROGRESS' },
    { label: 'Under Review', statusKey: 'REVIEW' },
    { label: 'Completed', statusKey: 'DONE' },
  ];

  const getStepIndex = (status: string) => {
    switch (status) {
      case 'RECEIVED':
        return 0;
      case 'IN_PROGRESS':
        return 1;
      case 'REVIEW':
        return 2;
      case 'DONE':
        return 3;
      default:
        return -1;
    }
  };

  const currentStepIdx = getStepIndex(order.status);
  const isCancelled = order.status === 'CANCELLED';

  return (
    <div className="container mx-auto space-y-8 max-w-6xl">
      {/* Back button & Page header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
        <div>
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard/orders')}
            className="p-0 hover:bg-transparent text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Orders
          </Button>
          <div className="flex items-center gap-3 mt-2">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              {order.referenceNumber}
            </h1>
            {isCancelled && (
              <span className="inline-flex items-center rounded-full bg-rose-100 px-3 py-0.5 text-xs font-semibold text-rose-800">
                Cancelled
              </span>
            )}
          </div>
          <p className="text-muted-foreground mt-1">
            Project Support Type:{' '}
            <span className="font-semibold text-foreground">{order.serviceTitle}</span>
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchOrderDetail(true)}
          className="flex items-center gap-1 self-start"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh Status
        </Button>
      </div>

      {/* Progress Timeline */}
      {!isCancelled && (
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="relative flex justify-between items-center w-full max-w-4xl mx-auto">
              {/* Connecting Line */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-muted -z-10" />
              <div
                className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary transition-all duration-500 -z-10"
                style={{ width: `${(currentStepIdx / (steps.length - 1)) * 100}%` }}
              />

              {/* Step Circles */}
              {steps.map((step, idx) => {
                const completed = idx <= currentStepIdx;
                const active = idx === currentStepIdx;

                return (
                  <div key={step.label} className="flex flex-col items-center">
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 font-semibold text-sm ${
                        completed
                          ? 'bg-primary border-primary text-primary-foreground shadow-md'
                          : 'bg-background border-muted-foreground/30 text-muted-foreground'
                      } ${active ? 'ring-4 ring-primary/20' : ''}`}
                    >
                      {completed ? <CheckCircle2 className="h-5 w-5" /> : <span>{idx + 1}</span>}
                    </div>
                    <span
                      className={`text-xs mt-2 font-medium ${completed ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {isCancelled && (
        <Card className="border-rose-500/20 bg-rose-500/5 text-rose-800">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertCircle className="h-6 w-6 text-rose-600 shrink-0" />
            <div>
              <p className="font-semibold text-sm">Order Cancelled</p>
              <p className="text-xs text-rose-700">
                This order has been cancelled by an administrator or requested by user. Please
                contact support via chat if you have any questions.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Grid: Details + Deliverables */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Side columns: Deliverables, Revision */}
        <div className="md:col-span-2 space-y-6">
          {/* Deliverables Section */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
              <FileDown className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Download Deliverables</CardTitle>
                <CardDescription>
                  View and download documents delivered by your assigned expert.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {order.deliverables.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                  <Clock className="h-10 w-10 text-muted/60 mb-2 animate-pulse" />
                  <p className="font-medium">No files uploaded yet</p>
                  <p className="text-xs mt-1">
                    Your academic expert is working on your project and will deliver the draft files
                    here shortly.
                  </p>
                </div>
              ) : (
                <div className="divide-y border rounded-lg overflow-hidden bg-background">
                  {order.deliverables.map((deliv) => (
                    <div
                      key={deliv.id}
                      className="flex items-center justify-between p-4 hover:bg-muted/20 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center text-primary shrink-0">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm truncate max-w-[200px] md:max-w-md">
                            {deliv.fileName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Delivered:{' '}
                            {new Date(deliv.uploadedAt).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                      <Button size="sm" className="flex items-center gap-1.5" asChild>
                        <a href={deliv.fileUrl} download target="_blank" rel="noreferrer">
                          <Download className="h-4 w-4" />
                          Download
                        </a>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Revision Form */}
          {!isCancelled && order.status !== 'DONE' && (
            <Card>
              <CardHeader>
                <CardTitle>Request Project Revision</CardTitle>
                <CardDescription>
                  Submit modifications, formatting tweaks, or revisions back to your expert.
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleRevisionSubmit}>
                <CardContent className="space-y-4">
                  {revisionSuccess && (
                    <div className="flex items-center gap-2 rounded-lg bg-emerald-500/15 p-3 text-xs text-emerald-600">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      <div>{revisionSuccess}</div>
                    </div>
                  )}
                  {revisionError && (
                    <div className="flex items-center gap-2 rounded-lg bg-destructive/15 p-3 text-xs text-destructive">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <div>{revisionError}</div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="revisionNotes">Revision Details / Feedback</Label>
                    <textarea
                      id="revisionNotes"
                      placeholder="Please specify chapter pages, correction instructions, formatting adjustments, or general feedback..."
                      className="flex min-h-[120px] w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      value={revisionNote}
                      onChange={(e) => setRevisionNote(e.target.value)}
                      required
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" disabled={isSubmittingRevision || !revisionNote.trim()}>
                    {isSubmittingRevision && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Submit Revision Details
                  </Button>
                </CardFooter>
              </form>
            </Card>
          )}
        </div>

        {/* Right Side: Order Specification Details Card */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Specifications</CardTitle>
              <CardDescription>Initial requirements submitted for this project.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-center gap-3 rounded-lg border p-3 bg-muted/20">
                <GraduationCap className="h-5 w-5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">University / Institution</p>
                  <p className="font-semibold">{order.university || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-lg border p-3 bg-muted/20">
                <Calendar className="h-5 w-5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Submission Deadline</p>
                  <p className="font-semibold text-foreground">
                    {new Date(order.deadline).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-lg border p-3 bg-muted/20">
                <DollarSign className="h-5 w-5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Budget Allocated</p>
                  <p className="font-semibold text-foreground">${order.budget}</p>
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t">
                <p className="text-xs font-semibold text-muted-foreground">
                  Client Notes / Description
                </p>
                <div className="bg-muted/40 p-3 rounded-lg text-xs leading-relaxed max-h-[160px] overflow-y-auto whitespace-pre-line text-foreground">
                  {order.description || 'No description provided.'}
                </div>
              </div>

              {order.requirementFileUrl && (
                <div className="pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full flex items-center justify-center gap-2"
                    asChild
                  >
                    <a href={order.requirementFileUrl} target="_blank" rel="noreferrer">
                      <Download className="h-4 w-4" />
                      View Initial Brief file
                    </a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline History log */}
          <Card>
            <CardHeader>
              <CardTitle>Status Logs</CardTitle>
              <CardDescription>Chronological sequence of status shifts.</CardDescription>
            </CardHeader>
            <CardContent>
              {order.statusHistory.length === 0 ? (
                <p className="text-xs text-muted-foreground">No logs available.</p>
              ) : (
                <div className="relative border-l pl-4 space-y-4 text-xs">
                  {order.statusHistory.map((history, idx) => (
                    <div key={history.id || idx} className="relative">
                      {/* Timeline dot */}
                      <span className="absolute -left-[21px] top-0.5 h-2 w-2 rounded-full bg-primary ring-4 ring-background" />
                      <p className="font-bold text-foreground">{history.status}</p>
                      <p className="text-muted-foreground/80 mt-0.5">
                        {history.note || 'Status updated'}
                      </p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1">
                        {new Date(history.createdAt).toLocaleDateString(undefined, {
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
        </div>
      </div>
    </div>
  );
}
