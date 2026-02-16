// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CompanySettings } from './CompanySettings';
import { UserManagement } from './UserManagement';
import { ApiUsageDashboard } from './ApiUsageDashboard';
import { PowerBIIntegration } from './PowerBIIntegration';
import { useCompany } from '@/hooks/useCompany';
import { Building2, Users, BarChart3, Shield, Settings, PieChart } from 'lucide-react';

export function EnterpriseNavigation() {
  const { company, hasPermission } = useCompany();
  const [activeTab, setActiveTab] = useState('company');

  if (!company) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-48">
          <div className="text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No company information available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const canManageCompany = hasPermission('company', 'admin');
  const canManageUsers = hasPermission('users', 'admin');
  const canViewAnalytics = hasPermission('analytics', 'read');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Enterprise Console</h1>
          <p className="text-muted-foreground">
            Manage your organization - {company.name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={company.subscription_tier === 'enterprise' ? 'default' : 'secondary'}>
            {company.subscription_tier.charAt(0).toUpperCase() + company.subscription_tier.slice(1)}
          </Badge>
          <Badge variant="outline">
            {company.subdomain || 'No subdomain'}
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="company" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Company
          </TabsTrigger>
          <TabsTrigger 
            value="users" 
            className="flex items-center gap-2"
            disabled={!canManageUsers}
          >
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger 
            value="analytics" 
            className="flex items-center gap-2"
            disabled={!canViewAnalytics}
          >
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="powerbi" className="flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            Power BI
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="space-y-0">
          <CompanySettings />
        </TabsContent>

        <TabsContent value="users" className="space-y-0">
          {canManageUsers ? (
            <UserManagement />
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-48">
                <div className="text-center">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">You don't have permission to manage users</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-0">
          {canViewAnalytics ? (
            <ApiUsageDashboard />
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-48">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">You don't have permission to view analytics</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="powerbi" className="space-y-0">
          <PowerBIIntegration />
        </TabsContent>

        <TabsContent value="security" className="space-y-0">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Multi-Tenant Security</h3>
                    <p className="text-sm text-muted-foreground">Isolated data per company</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Row Level Security</span>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Data Isolation</span>
                    <Badge variant="default">Enabled</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Access Control</span>
                    <Badge variant="default">Configured</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">API Monitoring</h3>
                    <p className="text-sm text-muted-foreground">Rate limiting and usage tracking</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Rate Limiting</span>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Usage Tracking</span>
                    <Badge variant="default">Enabled</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Audit Logs</span>
                    <Badge variant="default">Recording</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">User Permissions</h3>
                    <p className="text-sm text-muted-foreground">Role-based access control</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Role Management</span>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Permission Matrix</span>
                    <Badge variant="default">Configured</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>User Invitations</span>
                    <Badge variant="default">Available</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Settings className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Compliance</h3>
                    <p className="text-sm text-muted-foreground">Security and compliance status</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Data Encryption</span>
                    <Badge variant="default">AES-256</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Secure Transport</span>
                    <Badge variant="default">TLS 1.3</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Backup Retention</span>
                    <Badge variant="default">30 Days</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}