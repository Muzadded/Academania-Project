'use client';

import { useState } from 'react';
import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  async function onSubmit(data: ForgotPasswordFormValues) {
    setStatus('loading');
    setErrorMessage(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const res = await fetch(`${apiUrl}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        setErrorMessage(errorData.message || 'Failed to request password reset.');
        setStatus('error');
        return;
      }

      setStatus('success');
    } catch (err) {
      setErrorMessage('An unexpected error occurred. Please try again.');
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div className="flex flex-col space-y-6 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-white">Check your email</h1>
        <p className="text-sm text-slate-400">
          We have sent a password reset link to your email address. Please check your inbox and spam
          folder.
        </p>
        <Link href="/login" className="mt-4 text-primary hover:text-primary/80 transition-colors">
          Return to login
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-white">Forgot Password</h1>
        <p className="text-sm text-slate-400">
          Enter your email address and we will send you a reset link.
        </p>
      </div>

      {status === 'error' && errorMessage && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
          {errorMessage}
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-300">Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="name@example.com"
                    className="bg-white/10 border-white/20 text-white placeholder:text-slate-500"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-white font-medium"
            disabled={status === 'loading'}
          >
            {status === 'loading' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send Reset Link
          </Button>
        </form>
      </Form>

      <div className="text-center text-sm text-slate-400">
        Remember your password?{' '}
        <Link
          href="/login"
          className="font-medium text-primary hover:text-primary/80 transition-colors"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}
