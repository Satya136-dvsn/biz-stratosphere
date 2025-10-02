import { DashboardHeader } from '@/components/dashboard/DashboardHeader';

export function Profile() {
  return (
    <div className="min-h-screen bg-gradient-bg">
      <DashboardHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Profile
            </h1>
            <p className="text-muted-foreground text-lg">
              Manage your profile information
            </p>
          </div>
          <div className="bg-card/50 rounded-lg p-8 text-center">
            <h2 className="text-xl font-semibold mb-4">Profile Management Coming Soon</h2>
            <p className="text-muted-foreground">
              Update your profile information, avatar, and personal preferences here.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}