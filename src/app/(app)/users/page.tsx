
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
import { MoreHorizontal, Edit, ShieldAlert, UserCheck, UserCog } from 'lucide-react';
import { getMockUsersForDisplay, simulateUpdateUserRole, getCurrentUser } from '@/lib/authStore';
import type { DisplayUser, UserRole } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';

export default function UserManagementPage() {
  const [users, setUsers] = React.useState<DisplayUser[]>(getMockUsersForDisplay());
  const { toast } = useToast();
  const router = useRouter();
  const currentUser = getCurrentUser();

  // Redirect if not admin
  React.useEffect(() => {
    if (currentUser && currentUser.role !== 'admin') {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "You do not have permission to view this page.",
      });
      router.push('/dashboard');
    }
  }, [currentUser, router, toast]);
  
  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    const result = await simulateUpdateUserRole(userId, newRole);
    if (result.success) {
      toast({
        title: "Role Update Simulated",
        description: result.message,
      });
      // Re-fetch mock users to reflect the "change" in the UI for this demo
      setUsers(getMockUsersForDisplay());
    } else {
      toast({
        variant: "destructive",
        title: "Role Update Failed",
        description: result.message,
      });
    }
  };

  if (currentUser?.role !== 'admin') {
    // Render minimal content or loader while redirecting
    return <div className="p-6"><p>Loading or redirecting...</p></div>;
  }

  const roleIcons: Record<UserRole | string, React.ElementType> = {
    admin: ShieldAlert,
    manager: UserCog,
    tenant: UserCheck,
    null: UserCheck, // Default icon for null role
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
        description="View and manage user roles and permissions within the system."
      />

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">System Users</CardTitle>
          <CardDescription>
            List of users registered in the system. Role changes are simulated for this demo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {users.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Current Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => {
                  const Icon = roleIcons[user.role || 'null'] || UserCheck;
                  const badgeColor = roleColors[user.role || 'null'] || 'bg-gray-400';
                  return (
                    <TableRow key={user.id}>
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
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Change Role To</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {(['admin', 'manager', 'tenant'] as UserRole[]).map((roleOption) => (
                              <DropdownMenuItem
                                key={roleOption}
                                onClick={() => handleRoleChange(user.id, roleOption)}
                                disabled={user.role === roleOption}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                {roleOption ? roleOption.charAt(0).toUpperCase() + roleOption.slice(1) : 'Undefined'}
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
            <p className="text-muted-foreground text-center py-4">No users found.</p>
          )}
           <p className="text-xs text-muted-foreground mt-4 pt-4 border-t">
            <strong>Note:</strong> User role modifications in this demo are for UI illustration purposes only.
            They do not persist and are not connected to a real backend role management system.
            Actual role management requires setting Firebase Custom Claims or managing roles in a database via a secure backend.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
