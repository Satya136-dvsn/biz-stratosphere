import { EnterpriseNavigation } from '@/components/enterprise/EnterpriseNavigation';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export function Enterprise() {
  return (
    <ProtectedRoute>
      <main className="container mx-auto px-4 py-8">
        <EnterpriseNavigation />
      </main>
    </ProtectedRoute>
  );
}