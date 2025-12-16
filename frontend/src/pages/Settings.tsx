import { ProfileSettings } from '@/features/settings/components/ProfileSettings';
import { GeneralSettings } from '@/features/settings/components/GeneralSettings';
import { ChangePassword } from '@/features/settings/components/ChangePassword';

export default function Settings() {
  return (
    <div className="container py-8 space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-8">
          <ProfileSettings />
          <ChangePassword />
        </div>
        <div className="space-y-8">
          <GeneralSettings />
        </div>
      </div>
    </div>
  );
}
