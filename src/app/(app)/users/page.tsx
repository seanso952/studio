
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
import { MoreHorizontal, Edit, ShieldAlert, UserCog as ManagerIcon, UserCheck as TenantIcon, UserCog as AdminIcon } from 'lucide-react'; // Renamed UserCog to AdminIcon for clarity
import { getDisplayUsers, requestRoleUpdate, getCurrentUser } from '@/lib/authStore';
import type { DisplayUser, UserRole } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';

export default function UserManagementPage() {
  const [users, setUsers] = React.useState<DisplayUser[]>(getDisplayUsers());
  const { toast } = useToast();
  const router = useRouter();
  const appUser = getCurrentUser(); // Changed from currentUser to appUser to avoid conflict

  React.useEffect(() => {
    // Fetch initial users - in a real app, this might be an API call
    setUsers(getDisplayUsers());
  }, []);

  // Redirect if not admin
  React.useEffect(() => {
    if (appUser && appUser.role !== 'admin') {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "You do not have permission to view this page.",
      });
      router.push('/dashboard');
    }
  }, [appUser, router, toast]);
  
  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    // Ensure the current user is an admin before attempting role change
    if (appUser?.role !== 'admin') {
        toast({ variant: "destructive", title: "Permission Denied", description: "Only admins can change user roles."});
        return;
    }

    const result = await requestRoleUpdate(userId, newRole);
    if (result.success) {
      toast({
        title: "Role Update Requested",
        description: result.message,
      });
      // Re-fetch mock users to reflect the "change" in the UI for this demo
      // In a real app, you might optimistically update or re-fetch from the backend.
      setUsers(getDisplayUsers()); 
    } else {
      toast({
        variant: "destructive",
        title: "Role Update Failed",
        description: result.message,
      });
    }
  };

  if (appUser?.role !== 'admin') {
    // Render minimal content or loader while redirecting
    return <div className="p-6"><PageHeader title="User Management" /><p>Loading or redirecting...</p></div>;
  }

  const roleIcons: Record<UserRole | string, React.ElementType> = {
    admin: AdminIcon,
    manager: ManagerIcon,
    tenant: TenantIcon,
    null: TenantIcon, // Default icon
  };
  
  const roleColors: Record<UserRole | string, string> = {
    admin: 'bg-red-500 hover:bg-red-600',
    manager: 'bg-blue-500 hover:bg-blue-600',
    tenant: 'bg-green-500 hover:bg-green-600',
    null: 'bg-gray-400 hover:bg-gray-500',
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        description="View users and request role changes (requires backend Firebase Function)."
      />

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">System Users (Demo Data)</CardTitle>
          <CardDescription>
            List of users. Role changes trigger a simulated backend request. Implement a Firebase Function (e.g., 'setUserRole') to make this functional.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {users.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Current Role (Claim)</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => {
                  const Icon = roleIcons[user.role || 'null'] || TenantIcon;
                  const badgeColor = roleColors[user.role || 'null'] || 'bg-gray-400';
                  return (
                    <TableRow key={user.uid}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge className={`${badgeColor} text-white`}>
                          <Icon className="mr-1.5 h-3.5 w-3.5" />
                          {user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Undefined'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" disabled={appUser?.uid === user.uid && user.role === 'admin'}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Change Role To</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {(['admin', 'manager', 'tenant'] as UserRole[]).map((roleOption) => (
                              <DropdownMenuItem
                                key={roleOption || 'null-role'}
                                onClick={() => handleRoleChange(user.uid, roleOption)}
                                disabled={user.role === roleOption || (appUser?.uid === user.uid && roleOption !== 'admin' && user.role === 'admin')} // Prevent admin from accidentally demoting themselves from this UI easily
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                {roleOption ? roleOption.charAt(0).toUpperCase() + roleOption.slice(1) : 'No Role'}
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
            <p className="text-muted-foreground text-center py-4">No users found (using mock data).</p>
          )}
           <p className="text-xs text-muted-foreground mt-4 pt-4 border-t">
            <strong>Note:</strong> User role modifications here simulate a call to a backend Firebase Function.
            You need to implement a Firebase Function (e.g., `setUserRole`) that uses the Firebase Admin SDK to set custom user claims.
            Users will need to re-authenticate or have their ID token refreshed for client-side role changes to take effect.
            The user list is currently mock data; a real implementation would fetch this from a backend function.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
