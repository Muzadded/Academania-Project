'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
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

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true);
    setError(null);

    try {
      const response = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (response?.error) {
        setError('Invalid email or password.');
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-white">Welcome back</h1>
        <p className="text-sm text-slate-400">Enter your email to sign in to your account</p>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{error}</div>
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
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel className="text-slate-300">Password</FormLabel>
                  <Link
                    href="/forgot-password"
                    className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
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
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign In
          </Button>
        </form>
      </Form>

      <div className="text-center text-sm text-slate-400">
        Don&apos;t have an account?{' '}
        <Link
          href="/register"
          className="font-medium text-primary hover:text-primary/80 transition-colors"
        >
          Sign up
        </Link>
      </div>
    </div>
  );
}
