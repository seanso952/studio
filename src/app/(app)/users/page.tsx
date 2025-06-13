
'use client';

import * as React from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, ShieldAlert, UserCog as ManagerIcon, UserCheck as TenantIcon, UserCog as AdminIcon, Loader2, AlertTriangle } from 'lucide-react';
import { fetchDisplayUsers, requestRoleUpdate, getCurrentUser } from '@/lib/authStore';
import type { AppUser, DisplayUser, UserRole } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

export default function UserManagementPage() {
  const [users, setUsers] = React.useState<DisplayUser[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const appUser = getCurrentUser();

  React.useEffect(() => {
    if (appUser && appUser.role !== 'admin') {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "You do not have permission to view this page.",
      });
      router.push('/dashboard');
      return; // Early exit if not admin
    }

    if (appUser?.role === 'admin') {
      const loadUsers = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const fetchedUsers = await fetchDisplayUsers();
          setUsers(fetchedUsers);
        } catch (err: any) {
          setError(err.message || "Failed to load users.");
          toast({
            variant: "destructive",
            title: "Error Loading Users",
            description: err.message || "Could not fetch user list from the server.",
          });
        } finally {
          setIsLoading(false);
        }
      };
      loadUsers();
    }
  }, [appUser, router, toast]);
  
  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    if (appUser?.role !== 'admin') {
        toast({ variant: "destructive", title: "Permission Denied", description: "Only admins can change user roles."});
        return;
    }
    // Prevent admin from demoting themselves easily from UI
    if (appUser.uid === userId && appUser.role === 'admin' && newRole !== 'admin') {
        toast({ variant: "destructive", title: "Action Not Allowed", description: "Admins cannot demote themselves from this UI."});
        return;
    }

    const originalUsers = [...users];
    setUsers(prevUsers => prevUsers.map(u => u.uid === userId ? {...u, role: newRole} : u));

    const result = await requestRoleUpdate(userId, newRole);
    if (result.success) {
      toast({
        title: "Role Update Successful",
        description: result.message,
      });
      try {
        const fetchedUsers = await fetchDisplayUsers();
        setUsers(fetchedUsers);
      } catch (err: any) {
        setUsers(originalUsers);
        toast({variant: "destructive", title: "UI Revert", description: "Failed to re-sync user list after role change."})
      }
    } else {
      setUsers(originalUsers);
      toast({
        variant: "destructive",
        title: "Role Update Failed",
        description: result.message,
      });
    }
  };

  if (appUser && appUser.role !== 'admin' && !isLoading) { 
    return <div className="p-6"><PageHeader title="User Management" /><p>Redirecting...</p></div>;
  }

  const roleIcons: Record<UserRole | string, React.ElementType> = {
    admin: AdminIcon,
    manager: ManagerIcon,
    tenant: TenantIcon,
    none: ShieldAlert, 
    null: ShieldAlert, 
  };
  
  const roleColors: Record<UserRole | string, string> = {
    admin: 'bg-red-500 hover:bg-red-600',
    manager: 'bg-blue-500 hover:bg-blue-600',
    tenant: 'bg-green-500 hover:bg-green-600',
    none: 'bg-yellow-500 hover:bg-yellow-600',
    null: 'bg-gray-400 hover:bg-gray-500',
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        description="View users and manage their roles via Firebase Functions."
      />

      {isLoading && (
        <Card>
          <CardContent className="p-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
            <p className="text-muted-foreground">Loading users...</p>
          </CardContent>
        </Card>
      )}

      {error && !isLoading && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!isLoading && !error && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline">System Users</CardTitle>
            <CardDescription>
              List of users fetched from the backend.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {users.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Display Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last Sign-In</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => {
                    const Icon = roleIcons[user.role || 'null'] || ShieldAlert;
                    const badgeColor = roleColors[user.role || 'null'] || 'bg-gray-400';
                    return (
                      <TableRow key={user.uid}>
                        <TableCell className="font-medium">{user.displayName || user.email?.split('@')[0] || 'N/A'}</TableCell>
                        <TableCell>{user.email || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge className={`${badgeColor} text-white`}>
                            <Icon className="mr-1.5 h-3.5 w-3.5" />
                            {user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Undefined'}
                          </Badge>
                        </TableCell>
                        <TableCell>{user.creationTime ? format(new Date(user.creationTime), 'MMM d, yyyy') : 'N/A'}</TableCell>
                        <TableCell>{user.lastSignInTime ? format(new Date(user.lastSignInTime), 'MMM d, yyyy, p') : 'N/A'}</TableCell>
                        <TableCell>{user.disabled ? <Badge variant="destructive">Disabled</Badge> : <Badge variant="default" className="bg-green-100 text-green-700 border-green-300">Active</Badge>}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Change Role To</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              {(['admin', 'manager', 'tenant', 'none'] as UserRole[]).map((roleOption) => (
                                <DropdownMenuItem
                                  key={roleOption || 'null-role'}
                                  onClick={() => handleRoleChange(user.uid, roleOption)}
                                  disabled={user.role === roleOption || (appUser?.uid === user.uid && roleOption !== 'admin' && user.role === 'admin')}
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  {roleOption ? (roleOption.charAt(0).toUpperCase() + roleOption.slice(1)) : 'No Role (None)'}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground text-center py-4">No users found or an error occurred.</p>
            )}
             <p className="text-xs text-muted-foreground mt-4 pt-4 border-t">
              <strong>Note:</strong> User role modifications call a backend Firebase Function.
              Users may need to re-authenticate or have their ID token refreshed for client-side role changes to take full effect in their own session.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
