
import { useState } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { useAdminUsers, AdminUser } from "@/hooks/useAdminUsers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Search, ShieldAlert, ShieldCheck, Ban, CheckCircle, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

export const UserManagement = () => {
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const { users, isLoading, updateRole, toggleSuspend } = useAdminUsers(page, search);

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
                        {isLoading ? (
                            <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>User</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Joined</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No users found.</TableCell>
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
                                                {user.suspended ? (
                                                    <Badge variant="destructive" className="items-center gap-1"><Ban className="h-3 w-3" /> Suspended</Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-green-600 border-green-200 items-center gap-1"><CheckCircle className="h-3 w-3" /> Active</Badge>
                                                )}
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
            </div>
        </PageLayout>
    );
};
