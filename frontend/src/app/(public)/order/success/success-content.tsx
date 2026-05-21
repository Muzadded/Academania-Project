'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Check, CheckCircle2, Copy } from 'lucide-react';

import { Button } from '@/components/ui/button';

export function OrderSuccessContent() {
  const params = useSearchParams();
  const ref = params.get('ref');
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    if (!ref) return;
    navigator.clipboard.writeText(ref).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="container mx-auto px-4 py-20 max-w-lg text-center">
      <div className="flex justify-center mb-6">
        <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center">
          <CheckCircle2 className="h-10 w-10 text-emerald-500" />
        </div>
      </div>

      <h1 className="text-3xl font-bold tracking-tight mb-3">Order Submitted!</h1>
      <p className="text-muted-foreground mb-8 leading-relaxed">
        Thank you for your order. Our team will review your request and reach out to confirm your
        meeting slot and project details within 24 hours.
      </p>

      {ref && (
        <div className="inline-flex items-center gap-3 rounded-xl bg-muted px-5 py-3 mb-8">
          <span className="text-sm text-muted-foreground">Reference number:</span>
          <span className="font-mono font-semibold text-primary tracking-wide">{ref}</span>
          <button
            onClick={handleCopy}
            title={copied ? 'Copied!' : 'Copy reference number'}
            className="ml-1 rounded-md p-1 text-muted-foreground transition-colors hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
            <span className="sr-only">{copied ? 'Copied' : 'Copy reference number'}</span>
          </button>
        </div>
      )}

      <p className="text-xs text-muted-foreground mb-8">
        Keep your reference number handy — you can use it to track your order status.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button asChild variant="outline">
          <Link href="/">Return Home</Link>
        </Button>
        <Button asChild>
          <Link href="/contact">Contact Support</Link>
        </Button>
      </div>
    </div>
  );
}
