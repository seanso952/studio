
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
import { PlusCircle, MoreHorizontal, FileText, MessageSquare, Phone, AlertCircle, UserCog } from 'lucide-react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

export default function TenantsPage() {
  const [tenants, setTenants] = React.useState<Tenant[]>(() => getTenants());
  const router = useRouter();
  const { toast } = useToast();

  React.useEffect(() => {
    const updateTenants = () => setTenants(getTenants());
    updateTenants(); 

    const unsubscribe = subscribeToTenants(updateTenants);
    return () => unsubscribe();
  }, []);

  const handleDropdownAction = (action: string, tenantId: string, path?: string) => {
    if (path) {
      router.push(path);
    } else {
      toast({ title: "Action (Mock)", description: `${action} for tenant ${tenantId}` });
    }
  };

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
                            <DropdownMenuItem onClick={() => handleDropdownAction("View Profile", tenant.id, `/tenants/${tenant.id}`)}>
                               <UserCog className="mr-2 h-4 w-4" /> View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDropdownAction("View Lease", tenant.id, `/tenants/${tenant.id}/lease`)}>
                              <FileText className="mr-2 h-4 w-4" /> View Lease
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDropdownAction("Send Message", tenant.id)}>
                              <MessageSquare className="mr-2 h-4 w-4" /> Send Message
                            </DropdownMenuItem>
                             <DropdownMenuItem onClick={() => handleDropdownAction("Log Call", tenant.id)}>
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
