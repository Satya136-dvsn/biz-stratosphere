// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.


import { useState } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { useAdminUsers, AdminUser } from "@/hooks/useAdminUsers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Search, ShieldAlert, ShieldCheck, Ban, CheckCircle, Users, FileText, Clock, Info, Eye, Activity } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export const UserManagement = () => {
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
    const { users, isLoading, error, updateRole, toggleSuspend } = useAdminUsers(page, search);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
        setPage(1); // Reset to page 1
    };

    return (
        <PageLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
                    <p className="text-muted-foreground">Manage user access and roles.</p>
                </div>

                <div className="flex justify-between items-center">
                    <div className="relative w-72">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search users..." className="pl-8" value={search} onChange={handleSearch} />
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Users Directory</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {error && (
                            <Alert variant="destructive" className="mb-4">
                                <AlertTitle>Unable to load users</AlertTitle>
                                <AlertDescription>
                                    {(error as any)?.message ?? "Unknown error"}
                                </AlertDescription>
                            </Alert>
                        )}
                        {isLoading ? (
                            <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>User</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Uploads</TableHead>
                                        <TableHead>Last Active</TableHead>
                                        <TableHead>Joined</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                                {error ? "Failed to load users." : "No users found."}
                                            </TableCell>
                                        </TableRow>
                                    ) : users.map((user: AdminUser) => (
                                        <TableRow key={user.id}>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{user.full_name || 'No Name'}</span>
                                                    <span className="text-xs text-muted-foreground">{user.email}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={user.role === 'admin' || user.role === 'super_admin' ? 'default' : 'secondary'}>
                                                    {user.role}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                                    <span className="font-medium text-indigo-600 dark:text-indigo-400">
                                                        {user.dataset_count || 0}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2 text-xs">
                                                    <Clock className="h-3 w-3 text-muted-foreground" />
                                                    {user.last_sign_in ? (
                                                        <span title={new Date(user.last_sign_in).toLocaleString()}>
                                                            {formatDistanceToNow(new Date(user.last_sign_in), { addSuffix: true })}
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted-foreground italic">Never</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm">
                                                {new Date(user.created_at).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => setSelectedUser(user)}>
                                                            <Eye className="mr-2 h-4 w-4" /> View Details
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => updateRole({ id: user.id, role: 'admin' })}>
                                                            <ShieldCheck className="mr-2 h-4 w-4" /> Make Admin
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => updateRole({ id: user.id, role: 'user' })}>
                                                            <Users className="mr-2 h-4 w-4" /> Make User
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className={user.suspended ? "text-green-600" : "text-red-600"}
                                                            onClick={() => toggleSuspend({ id: user.id, suspend: !user.suspended })}
                                                        >
                                                            {user.suspended ? (
                                                                <><ShieldCheck className="mr-2 h-4 w-4" /> Unsuspend</>
                                                            ) : (
                                                                <><ShieldAlert className="mr-2 h-4 w-4" /> Suspend User</>
                                                            )}
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>

                <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
                    <DialogContent className="max-w-2xl bg-background/95 backdrop-blur-xl border-indigo-500/20 shadow-2xl">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-2xl">
                                <Users className="h-6 w-6 text-primary" />
                                User Transparency Portal
                            </DialogTitle>
                            <DialogDescription>
                                Detailed system metadata for {selectedUser?.full_name || selectedUser?.email}
                            </DialogDescription>
                        </DialogHeader>
                        
                        {selectedUser && (
                            <div className="grid gap-6 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-muted-foreground uppercase">Internal ID</p>
                                        <p className="font-mono text-sm bg-muted p-1 rounded truncate">{selectedUser.id}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-muted-foreground uppercase">Email Address</p>
                                        <p className="text-sm font-semibold">{selectedUser.email}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-muted-foreground uppercase">Global Role</p>
                                        <Badge variant={selectedUser.role === 'admin' || selectedUser.role === 'super_admin' ? 'default' : 'secondary'}>
                                            {selectedUser.role}
                                        </Badge>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-muted-foreground uppercase">Account Status</p>
                                        {selectedUser.suspended ? (
                                            <Badge variant="destructive">Suspended</Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-green-600 border-green-200">Active</Badge>
                                        )}
                                    </div>
                                </div>

                                <div className="border-t pt-4">
                                    <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
                                        <Activity className="h-4 w-4 text-primary" />
                                        Platform Activity
                                    </h4>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="bg-indigo-500/5 p-3 rounded-lg border border-indigo-500/10">
                                            <p className="text-2xl font-bold text-indigo-600">{selectedUser.dataset_count || 0}</p>
                                            <p className="text-[10px] text-muted-foreground uppercase">Total Uploads</p>
                                        </div>
                                        <div className="bg-blue-500/5 p-3 rounded-lg border border-blue-500/10">
                                            <p className="text-sm font-semibold">
                                                {selectedUser.last_sign_in ? new Date(selectedUser.last_sign_in).toLocaleDateString() : 'N/A'}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground uppercase">Last Session</p>
                                        </div>
                                        <div className="bg-green-500/5 p-3 rounded-lg border border-green-500/10">
                                            <p className="text-sm font-semibold">
                                                {new Date(selectedUser.created_at).toLocaleDateString()}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground uppercase">Member Since</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t pt-4">
                                    <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
                                        <Info className="h-4 w-4 text-primary" />
                                        Raw Profile Metadata
                                    </h4>
                                    <pre className="bg-muted p-3 rounded-md text-[10px] overflow-auto max-h-40 font-mono">
                                        {JSON.stringify({
                                            full_name: selectedUser.full_name,
                                            role: selectedUser.role,
                                            suspended: selectedUser.suspended,
                                            created_at: selectedUser.created_at,
                                            last_sign_in: selectedUser.last_sign_in,
                                            dataset_count: selectedUser.dataset_count
                                        }, null, 2)}
                                    </pre>
                                </div>
                            </div>
                        )}
                        <div className="flex justify-end pt-4 border-t">
                            <Button variant="outline" onClick={() => setSelectedUser(null)}>Close Portal</Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </PageLayout>
    );
};
