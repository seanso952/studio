
'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { PageHeader } from '@/components/shared/PageHeader';
import { mockTenants, mockBillPayments } from '@/lib/mockData';
import type { Tenant, BillPayment } from '@/lib/types';
import { FileText, DollarSign, AlertTriangle, CalendarDays, UploadCloud, ArrowRight } from 'lucide-react';
import { format, differenceInDays, isBefore } from 'date-fns';
import { Badge } from '@/components/ui/badge';

export default function TenantDashboardPage() {
  // For now, hardcode to the first tenant. In a real app, this would come from auth.
  const tenant: Tenant | undefined = mockTenants[0]; 
  const tenantBills: BillPayment[] = tenant ? mockBillPayments.filter(bill => bill.tenantId === tenant.id) : [];

  if (!tenant) {
    return (
      <div className="space-y-6">
        <PageHeader title="Tenant Dashboard" description="Your personal space to manage your tenancy." />
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Tenant data could not be loaded. Please try again later or contact support.</AlertDescription>
        </Alert>
      </div>
    );
  }

  const contractEndDate = new Date(tenant.contractEndDate);
  const today = new Date();
  const daysUntilExpiry = differenceInDays(contractEndDate, today);
  const isNearExpiry = daysUntilExpiry > 0 && daysUntilExpiry <= 90; // 90 days = 3 months
  const isExpired = isBefore(contractEndDate, today);

  const outstandingBills = tenantBills.filter(bill => (bill.status === 'pending' || bill.status === 'rejected' || bill.isOverdue) && bill.paymentDate === undefined);

  return (
    <div className="space-y-6">
      <PageHeader title={`Welcome, ${tenant.name}!`} description="Here's an overview of your tenancy." />

      {isExpired && (
        <Alert variant="destructive">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>Contract Expired</AlertTitle>
          <AlertDescription>
            Your lease agreement expired on {format(contractEndDate, 'MMMM d, yyyy')}. Please contact administration.
          </AlertDescription>
        </Alert>
      )}
      {isNearExpiry && !isExpired && (
         <Alert variant="default" className="bg-yellow-50 border-yellow-300 text-yellow-700 dark:bg-yellow-900/30 dark:border-yellow-700 dark:text-yellow-300">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>Contract Nearing Expiry</AlertTitle>
          <AlertDescription>
            Your lease agreement is due to expire on {format(contractEndDate, 'MMMM d, yyyy')} (in {daysUntilExpiry} days).
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline flex items-center"><CalendarDays className="mr-2 h-5 w-5 text-primary" />Contract Details</CardTitle>
            <CardDescription>Key information about your lease.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p><strong>Rent:</strong> ${tenant.rentAmount.toLocaleString()}/month</p>
            <p><strong>Start Date:</strong> {format(new Date(tenant.contractStartDate), 'MMMM d, yyyy')}</p>
            <p><strong>End Date:</strong> {format(contractEndDate, 'MMMM d, yyyy')}</p>
            <p><strong>Type:</strong> {tenant.tenantType === 'receipted' ? 'Receipted' : 'Non-Receipted'}</p>
          </CardContent>
          <CardFooter>
            <Button asChild variant="link" className="text-sm">
              <Link href="/portal/contract">View Full Contract <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline flex items-center"><DollarSign className="mr-2 h-5 w-5 text-primary" />Bills & Payments</CardTitle>
            <CardDescription>Your current financial standing.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p><strong>Outstanding Balance:</strong> <span className={tenant.outstandingBalance > 0 ? "font-semibold text-destructive" : "font-semibold text-green-600"}>${tenant.outstandingBalance.toLocaleString()}</span></p>
            {outstandingBills.length > 0 ? (
              <div>
                <p className="font-medium mt-2 mb-1">Due Bills ({outstandingBills.length}):</p>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {outstandingBills.slice(0, 3).map(bill => (
                    <li key={bill.id}>
                      {bill.billType.replace('_', ' ')}: ${bill.amount.toFixed(2)} (Due: {format(new Date(bill.dueDate), 'MMM d')})
                       {bill.isOverdue && !bill.paymentDate && <Badge variant="destructive" className="ml-2">Overdue</Badge>}
                       {bill.status === 'rejected' && <Badge variant="destructive" className="ml-2">Rejected</Badge>}
                    </li>
                  ))}
                  {outstandingBills.length > 3 && <li>And {outstandingBills.length - 3} more...</li>}
                </ul>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No outstanding bills. You're all caught up!</p>
            )}
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/portal/payments/upload"><UploadCloud className="mr-2 h-4 w-4" /> Upload Proof of Payment</Link>
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full" asChild>
                <Link href="/portal/contract">View My Lease Document</Link>
            </Button>
             <Button variant="outline" className="w-full">Request Maintenance (Coming Soon)</Button>
             <Button variant="outline" className="w-full">Contact Support (Coming Soon)</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
