
'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { PageHeader } from '@/components/shared/PageHeader';
import { getTenantById, subscribeToTenants } from '@/lib/tenantStore';
import { mockBillPayments, mockUnits, mockBuildings } from '@/lib/mockData'; // BillPayments still from mock for now
import type { Tenant, BillPayment } from '@/lib/types';
import { ArrowLeft, Edit3, Mail, Phone, FileText, DollarSign, PlusCircle, AlertTriangle, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';


export default function TenantProfilePage() {
  const params = useParams();
  const tenantId = params.tenantId as string;
  
  const [tenant, setTenant] = React.useState<Tenant | undefined>(() => getTenantById(tenantId));

  React.useEffect(() => {
    const updateTenant = () => setTenant(getTenantById(tenantId));
    updateTenant(); 

    const unsubscribe = subscribeToTenants(updateTenant);
    return () => unsubscribe();
  }, [tenantId]);


  // Note: BillPayments, Units, Buildings are still from mockData for this specific page's deeper details.
  // This would need further refactoring if those also need to be fully dynamic based on stores.
  const paymentsForTenant = mockBillPayments.filter(p => p.tenantId === tenantId);
  const unit = tenant ? mockUnits.find(u => u.id === tenant.unitId) : undefined; // Use tenant from store
  const building = unit ? mockBuildings.find(b => b.id === unit.buildingId) : undefined;


  if (!tenant) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-semibold">Tenant not found</h2>
        <Button asChild variant="link" className="mt-4">
          <Link href="/tenants">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Tenants
          </Link>
        </Button>
      </div>
    );
  }
  
  const contractEndDate = new Date(tenant.contractEndDate);
  const today = new Date();
  const isNearExpiry = contractEndDate > today && new Date(contractEndDate).setMonth(contractEndDate.getMonth() - 3) <= today.getTime();
  const isExpired = new Date(tenant.contractEndDate) < today;


  return (
    <div className="space-y-6">
      <PageHeader title={tenant.name} description={`Tenant Profile - ${tenant.tenantType === 'receipted' ? 'Receipted' : 'Non-Receipted'}`}>
        <div className="flex gap-2">
          <Button variant="outline">
            <Edit3 className="mr-2 h-4 w-4" /> Edit Profile
          </Button>
          <Button asChild variant="outline">
            <Link href="/tenants">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Tenants
            </Link>
          </Button>
        </div>
      </PageHeader>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 shadow-lg">
          <CardHeader className="items-center text-center">
            <Avatar className="h-24 w-24 mb-4 ring-2 ring-primary ring-offset-2">
              <AvatarImage src={`https://placehold.co/100x100.png?text=${tenant.name.substring(0,2)}`} alt={tenant.name} data-ai-hint="person avatar"/>
              <AvatarFallback>{tenant.name.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <CardTitle className="font-headline text-2xl">{tenant.name}</CardTitle>
            <CardDescription>
              {tenant.unitNumber && tenant.buildingName ? `${tenant.unitNumber}, ${tenant.buildingName}` : 'No unit assigned'}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm space-y-3">
            <div className="flex items-center"><Mail className="h-4 w-4 mr-3 text-muted-foreground" /> {tenant.email}</div>
            <div className="flex items-center"><Phone className="h-4 w-4 mr-3 text-muted-foreground" /> {tenant.phone}</div>
            <Separator />
            <div>
              <p className="font-medium text-muted-foreground">Contract Period</p>
              <p>{format(new Date(tenant.contractStartDate), 'MMM d, yyyy')} - {format(new Date(tenant.contractEndDate), 'MMM d, yyyy')}</p>
              {(isNearExpiry && !isExpired) && <Badge variant="outline" className="mt-1 bg-orange-100 text-orange-700 border-orange-300"><AlertTriangle className="h-3 w-3 mr-1"/>Nearing Expiry</Badge>}
              {isExpired && <Badge variant="destructive" className="mt-1"><AlertTriangle className="h-3 w-3 mr-1"/>Expired</Badge>}
            </div>
            <div>
              <p className="font-medium text-muted-foreground">Monthly Rent</p>
              <p>${tenant.rentAmount.toLocaleString()}</p>
            </div>
            <div>
              <p className="font-medium text-muted-foreground">Outstanding Balance</p>
              <p className={`font-semibold ${tenant.outstandingBalance > 0 ? 'text-destructive' : 'text-green-600'}`}>${tenant.outstandingBalance.toLocaleString()}</p>
            </div>
          </CardContent>
           <CardFooter className="flex-col items-start gap-2">
             <Button className="w-full"><MessageCircle className="mr-2 h-4 w-4"/>Send Message</Button>
             <Button variant="outline" className="w-full"><DollarSign className="mr-2 h-4 w-4"/>Log Payment</Button>
           </CardFooter>
        </Card>

        <div className="md:col-span-2 space-y-6">
          <Tabs defaultValue="payments" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="payments">Payments</TabsTrigger>
              <TabsTrigger value="documents2307">2307 Forms</TabsTrigger>
              <TabsTrigger value="communication">Log</TabsTrigger>
            </TabsList>

            <TabsContent value="payments" className="mt-4">
              <Card className="shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="font-headline">Payment History</CardTitle>
                   <Button variant="outline" size="sm"><PlusCircle className="mr-2 h-4 w-4" /> Add Bill/Payment</Button>
                </CardHeader>
                <CardContent>
                  {paymentsForTenant.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paymentsForTenant.map(payment => (
                          <TableRow key={payment.id}>
                            <TableCell>{payment.paymentDate ? format(new Date(payment.paymentDate), 'MMM d, yyyy') : format(new Date(payment.dueDate), 'MMM d, yyyy')}</TableCell>
                            <TableCell>{payment.billType.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</TableCell>
                            <TableCell>${payment.amount.toLocaleString()}</TableCell>
                            <TableCell>
                              <Badge variant={
                                payment.status === 'approved' || payment.status === 'paid' ? 'default' : 
                                payment.status === 'pending' ? 'secondary' : 'destructive'
                              } className={
                                payment.status === 'approved' || payment.status === 'paid' ? 'bg-green-100 text-green-700 border-green-300' :
                                payment.status === 'pending' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' : ''
                              }>
                                {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">No payment history found.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents2307" className="mt-4">
              <Card className="shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="font-headline">Form 2307 Submissions</CardTitle>
                   <Button variant="outline" size="sm" disabled={tenant.tenantType !== 'receipted'}><PlusCircle className="mr-2 h-4 w-4" /> Upload 2307</Button>
                </CardHeader>
                <CardContent>
                  {tenant.tenantType !== 'receipted' ? (
                     <p className="text-muted-foreground text-center py-4">This tenant is non-receipted and does not submit Form 2307.</p>
                  ) : tenant.documents2307.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Document Name</TableHead>
                          <TableHead>Submission Date</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tenant.documents2307.map(doc => (
                          <TableRow key={doc.id}>
                            <TableCell className="font-medium">{doc.name}</TableCell>
                            <TableCell>{format(new Date(doc.submissionDate), 'MMM d, yyyy')}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="link" size="sm" asChild>
                                <a href={doc.url} target="_blank" rel="noopener noreferrer">View</a>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">No Form 2307 submissions found.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="communication" className="mt-4">
              <Card className="shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="font-headline">Communication Log</CardTitle>
                   <Button variant="outline" size="sm"><PlusCircle className="mr-2 h-4 w-4" /> Add Log</Button>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center py-4">Communication history (emails, calls, notes) will be displayed here.</p>
                  {/* Placeholder for communication logs */}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
