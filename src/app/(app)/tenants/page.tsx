'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { PageHeader } from '@/components/shared/PageHeader';
import { mockTenants } from '@/lib/mockData';
import type { Tenant } from '@/lib/types';
import { PlusCircle, MoreHorizontal, FileText, MessageSquare, Phone, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function TenantsPage() {
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
          <CardTitle className="font-headline">All Tenants ({mockTenants.length})</CardTitle>
          <CardDescription>A list of all tenants across your properties.</CardDescription>
        </CardHeader>
        <CardContent>
          {mockTenants.length > 0 ? (
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
                {mockTenants.map((tenant) => {
                  const contractEndDate = new Date(tenant.contractEndDate);
                  const today = new Date();
                  const isNearExpiry = contractEndDate > today && contractEndDate.setMonth(contractEndDate.getMonth() - 2) <= today.setMonth(today.getMonth());
                  contractEndDate.setMonth(contractEndDate.getMonth() + 2); // Reset date for display
                  const isExpired = new Date(tenant.contractEndDate) < new Date();


                  let statusVariant: "default" | "secondary" | "destructive" | "outline" = "default";
                  let statusText = "Active";
                  if (isExpired) {
                    statusVariant = "destructive";
                    statusText = "Expired";
                  } else if (isNearExpiry) {
                    statusVariant = "outline"; // Visually distinct, often yellow/orange in themes
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
            <p className="text-muted-foreground text-center py-4">No tenants found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
