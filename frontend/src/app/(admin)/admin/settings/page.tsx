import { ChangePasswordForm } from '@/components/features/settings/change-password-form';

export default function AdminSettingsPage() {
  return (
    <div className="container mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your administrative preferences and settings.
        </p>
      </div>

      <div className="grid gap-6">
        <ChangePasswordForm />
      </div>
    </div>
  );
}
