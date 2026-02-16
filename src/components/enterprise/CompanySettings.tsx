// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useCompany } from '@/hooks/useCompany';
import { useToast } from '@/hooks/use-toast';
import { Building2, Users, Settings, Shield } from 'lucide-react';

export function CompanySettings() {
  const { company, updateCompany, hasPermission } = useCompany();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: company?.name || '',
    subdomain: company?.subdomain || '',
    max_users: company?.max_users || 10,
  });

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

  const handleSave = async () => {
    const { error } = await updateCompany(formData);
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to update company settings",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Company settings updated successfully",
      });
      setIsEditing(false);
    }
  };

  const canManageCompany = hasPermission('company', 'admin');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Company Settings</h1>
          <p className="text-muted-foreground">Manage your organization's configuration and settings</p>
        </div>
        <Badge variant={company.subscription_tier === 'enterprise' ? 'default' : 'secondary'}>
          {company.subscription_tier.charAt(0).toUpperCase() + company.subscription_tier.slice(1)}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Company Information
            </CardTitle>
            <CardDescription>
              Basic information about your organization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="company-name">Company Name</Label>
              {isEditing && canManageCompany ? (
                <Input
                  id="company-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              ) : (
                <p className="text-sm text-foreground">{company.name}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="subdomain">Subdomain</Label>
              {isEditing && canManageCompany ? (
                <Input
                  id="subdomain"
                  value={formData.subdomain}
                  onChange={(e) => setFormData({ ...formData, subdomain: e.target.value })}
                  placeholder="your-company"
                />
              ) : (
                <p className="text-sm text-foreground">{company.subdomain || 'Not set'}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label>Company ID</Label>
              <p className="text-sm text-muted-foreground font-mono">{company.id}</p>
            </div>

            <Separator />

            {canManageCompany && (
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <Button onClick={handleSave} size="sm">
                      Save Changes
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        setFormData({
                          name: company.name,
                          subdomain: company.subdomain || '',
                          max_users: company.max_users,
                        });
                      }}
                      size="sm"
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                    size="sm"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Edit Settings
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Subscription Details
            </CardTitle>
            <CardDescription>
              Current plan and usage information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>Subscription Tier</Label>
              <Badge variant={company.subscription_tier === 'enterprise' ? 'default' : 'secondary'}>
                {company.subscription_tier.charAt(0).toUpperCase() + company.subscription_tier.slice(1)}
              </Badge>
            </div>

            <div className="grid gap-2">
              <Label>Maximum Users</Label>
              {isEditing && canManageCompany ? (
                <Input
                  type="number"
                  value={formData.max_users}
                  onChange={(e) => setFormData({ ...formData, max_users: parseInt(e.target.value) || 10 })}
                  min="1"
                />
              ) : (
                <p className="text-sm text-foreground">{company.max_users} users</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label>Created</Label>
              <p className="text-sm text-muted-foreground">
                {new Date(company.created_at).toLocaleDateString()}
              </p>
            </div>

            <div className="grid gap-2">
              <Label>Last Updated</Label>
              <p className="text-sm text-muted-foreground">
                {new Date(company.updated_at).toLocaleDateString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security & Compliance
          </CardTitle>
          <CardDescription>
            Security settings and compliance information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Data Encryption</p>
                <p className="text-sm text-muted-foreground">AES-256 encryption</p>
              </div>
              <Badge variant="default">Active</Badge>
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Access Control</p>
                <p className="text-sm text-muted-foreground">Role-based permissions</p>
              </div>
              <Badge variant="default">Configured</Badge>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Audit Logging</p>
                <p className="text-sm text-muted-foreground">API usage tracking</p>
              </div>
              <Badge variant="default">Enabled</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}