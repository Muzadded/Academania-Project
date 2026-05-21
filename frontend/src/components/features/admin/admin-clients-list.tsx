'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { AlertCircle, CheckCircle2, Loader2, Shield, Users, X } from 'lucide-react';
import { AdminClientDto, CreateClientDto, UserRole } from '@academania/shared';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

function RoleBadge({ role }: { role: string }) {
  return role === 'ADMIN' ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
      <Shield className="h-3 w-3" /> Admin
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-700/30 dark:text-slate-300">
      <Users className="h-3 w-3" /> Client
    </span>
  );
}

export function AdminClientsList() {
  const { data: session } = useSession();
  const [allUsers, setAllUsers] = useState<AdminClientDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('CLIENT');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  async function fetchUsers(token: string) {
    const data = await apiClient<AdminClientDto[]>('/admin/clients', { token });
    setAllUsers(data);
  }

  useEffect(() => {
    async function load() {
      if (!session?.accessToken) return;
      try {
        await fetchUsers(session.accessToken);
      } catch (err: any) {
        setError(err.message || 'Failed to load users.');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [session?.accessToken]);

  function resetForm() {
    setName('');
    setEmail('');
    setPassword('');
    setRole('CLIENT');
    setCreateError(null);
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    if (!session?.accessToken) return;
    setIsCreating(true);
    setCreateError(null);
    setCreateSuccess(null);
    try {
      const payload: CreateClientDto = { name, email, role };
      if (password.trim()) payload.password = password;
      await apiClient('/admin/clients', {
        method: 'POST',
        token: session.accessToken,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const label = role === 'ADMIN' ? 'Admin' : 'Client';
      setCreateSuccess(`${label} account created successfully for ${email}.`);
      resetForm();
      setShowCreateForm(false);
      await fetchUsers(session.accessToken);
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create account.');
    } finally {
      setIsCreating(false);
    }
  }

  const admins = allUsers.filter((u) => u.role === 'ADMIN');
  const clients = allUsers.filter((u) => u.role === 'CLIENT');

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
        <h3 className="text-lg font-semibold">Error Loading Users</h3>
        <p className="mt-2 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Accounts</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {admins.length} admin{admins.length !== 1 ? 's' : ''} &middot; {clients.length} client
            {clients.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button
          onClick={() => {
            setShowCreateForm((v) => !v);
            setCreateSuccess(null);
            if (showCreateForm) resetForm();
          }}
        >
          {showCreateForm ? (
            <>
              <X className="h-4 w-4 mr-1" /> Cancel
            </>
          ) : (
            '+ New Account'
          )}
        </Button>
      </div>

      {/* Global success banner */}
      {createSuccess && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-500/15 p-3 text-sm text-emerald-600">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {createSuccess}
        </div>
      )}

      {/* Create form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {role === 'ADMIN' ? 'New Admin Account' : 'New Client Account'}
            </CardTitle>
          </CardHeader>
          <form onSubmit={handleCreateUser}>
            <CardContent className="space-y-4">
              {/* Role selector */}
              <div className="space-y-1.5">
                <Label>
                  Account Role <span className="text-destructive">*</span>
                </Label>
                <div className="flex gap-2">
                  {(['CLIENT', 'ADMIN'] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={cn(
                        'flex-1 flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-all',
                        role === r
                          ? r === 'ADMIN'
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300'
                            : 'border-primary bg-primary/5 text-primary'
                          : 'border-input bg-background text-muted-foreground hover:bg-muted',
                      )}
                    >
                      {r === 'ADMIN' ? (
                        <Shield className="h-4 w-4" />
                      ) : (
                        <Users className="h-4 w-4" />
                      )}
                      {r === 'ADMIN' ? 'Admin' : 'Client'}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {role === 'ADMIN'
                    ? 'Admin accounts have full access to manage orders, clients, and settings.'
                    : 'Client accounts can submit orders, upload payments, and track progress.'}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="user-name">
                    Full Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="user-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Smith"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="user-email">
                    Email Address <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="user-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={role === 'ADMIN' ? 'jane@academania.com' : 'jane@university.edu'}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="user-password">Password</Label>
                <Input
                  id="user-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Leave blank to auto-generate a temporary password"
                />
                <p className="text-xs text-muted-foreground">
                  If left blank, a temporary password will be generated automatically.
                </p>
              </div>

              {createError && (
                <div className="flex items-center gap-2 rounded-lg bg-destructive/15 p-3 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {createError}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button type="submit" disabled={isCreating}>
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-1" /> Creating…
                  </>
                ) : (
                  `Create ${role === 'ADMIN' ? 'Admin' : 'Client'} Account`
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setShowCreateForm(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {/* Admin Accounts table */}
      <div className="space-y-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          <Shield className="h-4 w-4" /> Admin Accounts ({admins.length})
        </h2>
        <Card>
          <CardContent className="p-0">
            {admins.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                <Shield className="h-10 w-10 text-muted-foreground/40 mb-3" />
                <p className="text-sm font-medium">No admin accounts yet</p>
                <p className="text-xs mt-1">Create an admin account using the button above.</p>
              </div>
            ) : (
              <UserTable users={admins} showOrderLink={false} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Client Accounts table */}
      <div className="space-y-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          <Users className="h-4 w-4" /> Client Accounts ({clients.length})
        </h2>
        <Card>
          <CardContent className="p-0">
            {clients.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                <Users className="h-10 w-10 text-muted-foreground/40 mb-3" />
                <p className="text-sm font-medium">No client accounts yet</p>
                <p className="text-xs mt-1">Create a client account to get started.</p>
              </div>
            ) : (
              <UserTable users={clients} showOrderLink />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function UserTable({ users, showOrderLink }: { users: AdminClientDto[]; showOrderLink: boolean }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/40">
            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Email
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Role
            </th>
            {showOrderLink && (
              <>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Total Orders
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Active
                </th>
              </>
            )}
            {showOrderLink && <th className="px-6 py-3" />}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-muted/30 transition-colors">
              <td className="px-6 py-4 font-medium">{user.name}</td>
              <td className="px-6 py-4 text-muted-foreground">{user.email}</td>
              <td className="px-6 py-4">
                <RoleBadge role={user.role} />
              </td>
              {showOrderLink && (
                <>
                  <td className="px-6 py-4">{user.orderCount}</td>
                  <td className="px-6 py-4">
                    {user.activeOrders > 0 ? (
                      <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                        {user.activeOrders} active
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/client/orders?search=${encodeURIComponent(user.email)}`}
                      className="inline-flex items-center rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
                    >
                      View Orders →
                    </Link>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
