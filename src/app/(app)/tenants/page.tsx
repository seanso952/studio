
'use client';

import Link from 'next/link';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { PageHeader } from '@/components/shared/PageHeader';
import { getTenants, subscribeToTenants } from '@/lib/tenantStore';
import type { Tenant } from '@/lib/types';
import { PlusCircle, MoreHorizontal, FileText, MessageSquare, Phone, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function TenantsPage() {
  const [tenants, setTenants] = React.useState<Tenant[]>(() => getTenants());

  React.useEffect(() => {
    const updateTenants = () => setTenants(getTenants());
    updateTenants(); // Initial fetch

    const unsubscribe = subscribeToTenants(updateTenants);
    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Tenants" description="Manage all tenants and their information.">
        <Button asChild>
          <Link href="/tenants/add">
            <PlusCircle className="mr-2 h-4 w-4" /> Add Tenant
          </Link>
        </Button>
      </PageHeader>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">All Tenants ({tenants.length})</CardTitle>
          <CardDescription>A list of all tenants across your properties.</CardDescription>
        </CardHeader>
        <CardContent>
          {tenants.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Property / Unit</TableHead>
                  <TableHead>Contract End</TableHead>
                  <TableHead>Rent</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants.map((tenant) => {
                  const contractEndDate = new Date(tenant.contractEndDate);
                  const today = new Date();
                  // Check if contract ends within the next 2 months for "Near Expiry"
                  const twoMonthsFromNow = new Date();
                  twoMonthsFromNow.setMonth(today.getMonth() + 2);
                  const isNearExpiry = contractEndDate > today && contractEndDate <= twoMonthsFromNow;
                  const isExpired = contractEndDate < today;


                  let statusVariant: "default" | "secondary" | "destructive" | "outline" = "default";
                  let statusText = "Active";
                  if (isExpired) {
                    statusVariant = "destructive";
                    statusText = "Expired";
                  } else if (isNearExpiry) {
                    statusVariant = "outline";
                    statusText = "Near Expiry";
                  }


                  return (
                    <TableRow key={tenant.id}>
                      <TableCell className="font-medium">
                        <Link href={`/tenants/${tenant.id}`} className="hover:underline text-primary">
                          {tenant.name}
                        </Link>
                        <p className="text-xs text-muted-foreground">{tenant.email}</p>
                      </TableCell>
                      <TableCell>
                        {tenant.buildingName || 'N/A'}
                        <span className="text-muted-foreground"> / Unit {tenant.unitNumber || 'N/A'}</span>
                      </TableCell>
                      <TableCell>
                        {format(new Date(tenant.contractEndDate), 'MMM d, yyyy')}
                        {(isNearExpiry && !isExpired) && <AlertCircle className="inline ml-1 h-4 w-4 text-orange-500" />}
                        {isExpired && <AlertCircle className="inline ml-1 h-4 w-4 text-destructive" />}
                      </TableCell>
                      <TableCell>${tenant.rentAmount.toLocaleString()}</TableCell>
                      <TableCell className={tenant.outstandingBalance > 0 ? 'text-destructive font-semibold' : 'text-green-600'}>
                        ${tenant.outstandingBalance.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant} className={isNearExpiry && !isExpired ? "bg-orange-100 text-orange-700 border-orange-300" : ""}>
                          {statusText}
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
                            <DropdownMenuItem asChild>
                              <Link href={`/tenants/${tenant.id}`}>View Profile</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <FileText className="mr-2 h-4 w-4" /> View Lease
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <MessageSquare className="mr-2 h-4 w-4" /> Send Message
                            </DropdownMenuItem>
                             <DropdownMenuItem>
                              <Phone className="mr-2 h-4 w-4" /> Log Call
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-4">No tenants found. Add your first tenant to get started.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
