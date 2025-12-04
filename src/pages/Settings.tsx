import { UsageQuotas } from "@/components/settings/UsageQuotas";

export function Settings() {
  return (
    <div className="min-h-screen bg-gradient-bg">
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Settings
            </h1>
            <p className="text-muted-foreground text-lg">
              Configure your application preferences
            </p>
          </div>

          {/* Usage & Quotas Section */}
          <UsageQuotas />

          {/* Placeholder for future settings */}
          <div className="bg-card/50 rounded-lg p-8 text-center">
            <h2 className="text-xl font-semibold mb-4">Additional Settings Coming Soon</h2>
            <p className="text-muted-foreground">
              More user preferences, account settings, and system configuration options will be available here.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}