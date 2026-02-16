// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

import { EnterpriseNavigation } from '@/components/enterprise/EnterpriseNavigation';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PageLayout } from '@/components/layout/PageLayout';

export function Enterprise() {
  return (
    <ProtectedRoute>
      <PageLayout>
        <EnterpriseNavigation />
      </PageLayout>
    </ProtectedRoute>
  );
}