'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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

const resetPasswordSchema = z
  .object({
    password: z.string().min(6, 'Password must be at least 6 characters.'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(data: ResetPasswordFormValues) {
    if (!token) {
      setErrorMessage('Invalid or missing reset token.');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setErrorMessage(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const res = await fetch(`${apiUrl}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: data.password }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        setErrorMessage(
          errorData.message || 'Failed to reset password. The link might be expired.',
        );
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
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Password Reset Successfully
        </h1>
        <p className="text-sm text-slate-400">
          Your password has been successfully updated. You can now use your new password to log in.
        </p>
        <Button onClick={() => router.push('/login')} className="mt-4 bg-primary text-white">
          Go to Login
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-white">Reset Password</h1>
        <p className="text-sm text-slate-400">Enter your new password below.</p>
      </div>

      {!token && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
          Warning: No reset token found in URL.
        </div>
      )}

      {status === 'error' && errorMessage && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
          {errorMessage}
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-300">New Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    className="bg-white/10 border-white/20 text-white placeholder:text-slate-500"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-300">Confirm New Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="••••••••"
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
            disabled={status === 'loading' || !token}
          >
            {status === 'loading' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Reset Password
          </Button>
        </form>
      </Form>
    </div>
  );
}
