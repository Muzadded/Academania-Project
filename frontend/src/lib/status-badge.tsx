import { cn } from '@/lib/utils';

const ORDER_STATUS_STYLES: Record<string, string> = {
  RECEIVED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  IN_PROGRESS: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  REVIEW: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  DONE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  CANCELLED: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
};

const PAYMENT_STATUS_STYLES: Record<string, string> = {
  PENDING_REVIEW: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  VERIFIED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  REJECTED: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
};

const MEETING_STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  CONFIRMED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  REJECTED: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
  COMPLETED: 'bg-slate-100 text-slate-700 dark:bg-slate-700/30 dark:text-slate-300',
};

const BASE = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold';

export function OrderStatusBadge({ status }: { status: string }) {
  return (
    <span className={cn(BASE, ORDER_STATUS_STYLES[status] ?? 'bg-slate-100 text-slate-700')}>
      {status.replace('_', ' ')}
    </span>
  );
}

export function PaymentStatusBadge({ status }: { status: string }) {
  return (
    <span className={cn(BASE, PAYMENT_STATUS_STYLES[status] ?? 'bg-slate-100 text-slate-700')}>
      {status.replace('_', ' ')}
    </span>
  );
}

export function MeetingStatusBadge({ status }: { status: string }) {
  return (
    <span className={cn(BASE, MEETING_STATUS_STYLES[status] ?? 'bg-slate-100 text-slate-700')}>
      {status}
    </span>
  );
}
