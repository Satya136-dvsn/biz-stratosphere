import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCompany } from '@/hooks/useCompany';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Users, UserPlus, Settings, Shield, Trash2 } from 'lucide-react';

interface CompanyUser {
  id: string;
  user_id: string;
  display_name: string;
  role: 'super_admin' | 'company_admin' | 'manager' | 'analyst' | 'viewer';
  company_name: string;
  avatar_url?: string;
  created_at: string;
}

interface RolePermissions {
  [key: string]: string[];
}

const ROLE_PERMISSIONS: RolePermissions = {
  super_admin: ['All permissions across all companies'],
  company_admin: ['Manage company', 'Manage users', 'Manage datasets', 'View analytics'],
  manager: ['Manage datasets', 'View analytics', 'Export data'],
  analyst: ['View datasets', 'Create insights', 'Export data'],
  viewer: ['View datasets', 'View insights'],
};

export function UserManagement() {
  const { company, hasPermission, grantPermission, revokePermission } = useCompany();
  const { toast } = useToast();
  const [users, setUsers] = useState<CompanyUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<CompanyUser | null>(null);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'analyst' as 'super_admin' | 'company_admin' | 'manager' | 'analyst' | 'viewer',
    displayName: '',
  });

  useEffect(() => {
    if (company) {
      fetchUsers();
    }
  }, [company]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('company_id', company?.id);

      if (error) throw error;
      
      // Map the data to match CompanyUser interface
      const mappedUsers: CompanyUser[] = (data || []).map(user => ({
        id: user.id,
        user_id: user.user_id,
        display_name: user.display_name || '',
        role: user.role as 'super_admin' | 'company_admin' | 'manager' | 'analyst' | 'viewer',
        company_name: user.company_name || '',
        avatar_url: user.avatar_url,
        created_at: user.created_at,
      }));
      
      setUsers(mappedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch company users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInviteUser = async () => {
    try {
      // In a real implementation, you'd send an invitation email
      // For now, we'll create a placeholder user that can be activated later
      const { data, error } = await supabase.auth.admin.createUser({
        email: inviteForm.email,
        password: 'temporary-password-to-change',
        email_confirm: true,
        user_metadata: {
          display_name: inviteForm.displayName,
          role: inviteForm.role,
          company_id: company?.id,
          invited: true,
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Invitation sent to ${inviteForm.email}`,
      });

      setInviteForm({ email: '', role: 'analyst', displayName: '' });
      setIsInviteOpen(false);
      await fetchUsers();
    } catch (error: any) {
      console.error('Error inviting user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to invite user",
        variant: "destructive",
      });
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'super_admin' | 'company_admin' | 'manager' | 'analyst' | 'viewer') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "User role updated successfully",
      });

      await fetchUsers();
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
    }
  };

  const canManageUsers = hasPermission('users', 'admin');

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-48">
          <p>Loading users...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">Manage users and permissions for your organization</p>
        </div>
        {canManageUsers && (
          <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Invite User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite New User</DialogTitle>
                <DialogDescription>
                  Send an invitation to add a new user to your organization
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    placeholder="user@example.com"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    value={inviteForm.displayName}
                    onChange={(e) => setInviteForm({ ...inviteForm, displayName: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={inviteForm.role} onValueChange={(value) => setInviteForm({ ...inviteForm, role: value as 'super_admin' | 'company_admin' | 'manager' | 'analyst' | 'viewer' })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viewer">Viewer</SelectItem>
                      <SelectItem value="analyst">Analyst</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="company_admin">Company Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsInviteOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleInviteUser}>
                  Send Invitation
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Company Users ({users.length}/{company?.max_users || 0})
          </CardTitle>
          <CardDescription>
            Manage user roles and permissions within your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Joined</TableHead>
                {canManageUsers && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.user_id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{user.display_name}</p>
                      <p className="text-sm text-muted-foreground">{String(user.user_id)}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {canManageUsers ? (
                      <Select
                        value={user.role}
                        onValueChange={(value) => handleRoleChange(user.user_id, value as 'super_admin' | 'company_admin' | 'manager' | 'analyst' | 'viewer')}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="viewer">Viewer</SelectItem>
                          <SelectItem value="analyst">Analyst</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="company_admin">Company Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant={user.role === 'company_admin' ? 'default' : 'secondary'}>
                        {user.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {ROLE_PERMISSIONS[user.role]?.slice(0, 2).map((permission, index) => (
                        <span key={index} className="text-xs bg-muted px-2 py-1 rounded">
                          {permission}
                        </span>
                      ))}
                      {ROLE_PERMISSIONS[user.role]?.length > 2 && (
                        <span className="text-xs text-muted-foreground">
                          +{ROLE_PERMISSIONS[user.role].length - 2} more
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(user.created_at).toLocaleDateString()}
                  </TableCell>
                  {canManageUsers && (
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Role Permissions
            </CardTitle>
            <CardDescription>
              Overview of permissions for each role
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(ROLE_PERMISSIONS).map(([role, permissions]) => (
                <div key={role} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant={role === 'super_admin' ? 'default' : 'secondary'}>
                      {role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Badge>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {permissions.map((permission, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <div className="h-1 w-1 bg-muted-foreground rounded-full" />
                        {permission}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Usage Statistics</CardTitle>
            <CardDescription>
              Current usage across your organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded">
                <span>Active Users</span>
                <Badge>{users.length}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 border rounded">
                <span>Available Seats</span>
                <Badge>{(company?.max_users || 0) - users.length}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 border rounded">
                <span>Admin Users</span>
                <Badge>
                  {users.filter(u => u.role === 'company_admin' || u.role === 'super_admin').length}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}