
'use client';

import * as React from 'react';
import { useForm, type SubmitHandler, type SubmitErrorHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { PageHeader } from '@/components/shared/PageHeader';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { mockBillPayments, mockBouncedChecks, mockTenants } from '@/lib/mockData';
import type { BillPayment, BouncedCheck, BillType } from '@/lib/types';
import { PlusCircle, Upload, CheckCircle, XCircle, AlertTriangle, Search, Filter, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useSearchParams } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";

const billTypeValues = ['rent', 'electricity', 'water', 'association_dues', 'other'] as const;

const billPaymentFormSchema = z.object({
  tenantId: z.string().min(1, "Tenant is required"),
  billType: z.enum(billTypeValues, { required_error: "Bill type is required" }),
  amount: z.coerce.number({invalid_type_error: "Amount must be a number"}).positive("Amount must be positive"),
  billDueDate: z.string().min(1, "Bill due date is required").regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  proofOfPayment: z.any()
    .refine(
      (value) => {
        if (value == null) return true;
        if (typeof FileList !== 'undefined') {
          if (!(value instanceof FileList)) return false;
          if (value.length === 0) return true;
          return value[0].size <= 5 * 1024 * 1024; 
        }
        return false;
      },
      { message: 'Proof of payment must be a valid file (max 5MB) or not provided.'}
    )
    .optional()
    .nullable(),
  notes: z.string().optional(),
});

type BillPaymentFormValues = z.infer<typeof billPaymentFormSchema>;

interface BillPaymentFormProps {
  onPaymentLogged: (newPayment: BillPayment) => void;
}

function BillPaymentForm({ onPaymentLogged }: BillPaymentFormProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();

  const form = useForm<BillPaymentFormValues>({
    resolver: zodResolver(billPaymentFormSchema),
    defaultValues: {
      tenantId: '',
      billType: undefined,
      amount: undefined,
      billDueDate: '',
      proofOfPayment: null,
      notes: '',
    },
  });

  const onSubmit: SubmitHandler<BillPaymentFormValues> = async (data) => {
    console.log("Form submitted successfully with data:", data);
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call

    const tenantDetails = mockTenants.find(t => t.id === data.tenantId);
    const newPaymentId = `bill-${Date.now()}`;
    const actualPaymentDate = data.proofOfPayment && data.proofOfPayment.length > 0 ? new Date().toISOString().split('T')[0] : undefined;

    const newBillEntry: BillPayment = {
        id: newPaymentId,
        tenantId: data.tenantId,
        tenantName: tenantDetails?.name || 'Unknown Tenant',
        unitNumber: tenantDetails?.unitNumber || 'N/A',
        buildingName: tenantDetails?.buildingName || 'N/A',
        billType: data.billType,
        amount: data.amount,
        dueDate: data.billDueDate,
        paymentDate: actualPaymentDate,
        proofOfPaymentUrl: data.proofOfPayment && data.proofOfPayment.length > 0 ? `mock_proof_for_${newPaymentId}.pdf` : undefined,
        status: 'pending', 
        adminNotes: data.notes || '',
        isOverdue: new Date(data.billDueDate) < new Date() && !actualPaymentDate,
    };

    onPaymentLogged(newBillEntry);

    toast({ 
        title: "Submission Successful", 
        description: "Bill/payment has been logged and is pending approval." 
    });
    form.reset();
    setIsLoading(false);
  };

  const onInvalidSubmit: SubmitErrorHandler<BillPaymentFormValues> = (errors) => {
    console.error("Form validation failed:", errors);
    const errorMessages = Object.values(errors).map(e => e.message).filter(Boolean).join(' ');
    toast({
      variant: "destructive",
      title: "Validation Error",
      description: `Please check the form for errors. ${errorMessages || 'See console for details.'}`,
    });
  };

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="font-headline">Upload Bill Payment / Log Bill</CardTitle>
        <CardDescription>Submit proof of payment or log a new bill for a tenant. New entries will require approval.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit, onInvalidSubmit)}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tenantId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tenant</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger id="tenantSelect"><SelectValue placeholder="Select Tenant" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {mockTenants.map(t => <SelectItem key={t.id} value={t.id}>{t.name} ({t.buildingName} - {t.unitNumber})</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="billType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bill Type</FormLabel>
                     <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger id="billType"><SelectValue placeholder="Select Bill Type" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {billTypeValues.map(type => (
                          <SelectItem key={type} value={type}>{type.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0.00" {...field} onChange={e => field.onChange(e.target.valueAsNumber)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="billDueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bill Due Date (YYYY-MM-DD)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
             <FormField
                control={form.control}
                name="proofOfPayment"
                render={({ field: { onChange, onBlur, name, ref } }) => (
                    <FormItem>
                    <FormLabel>Proof of Payment (Optional, Max 5MB)</FormLabel>
                    <FormControl>
                        <Input 
                        type="file" 
                        accept="image/*,.pdf"
                        onBlur={onBlur}
                        name={name}
                        ref={ref}
                        onChange={(e) => onChange(e.target.files)}
                        />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Any relevant notes..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" /> Submit Payment / Log Bill
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

interface ApprovalQueueTableProps {
  payments: BillPayment[];
  onUpdatePaymentStatus: (paymentId: string, status: 'approved' | 'rejected', notes?: string) => void;
}

function ApprovalQueueTable({ payments, onUpdatePaymentStatus }: ApprovalQueueTableProps) {
  const { toast } = useToast();
  const pendingApproval = payments.filter(p => p.status === 'pending');

  const handleApprove = (paymentId: string) => {
    onUpdatePaymentStatus(paymentId, 'approved');
    toast({ title: "Payment Approved", description: `Payment ID ${paymentId} marked as approved.` });
  };
  const handleReject = (paymentId: string) => {
    // Potentially open a dialog here to get rejection reason
    const reason = prompt("Reason for rejection (optional):");
    onUpdatePaymentStatus(paymentId, 'rejected', reason || "Rejected via UI.");
    toast({ title: "Payment Rejected", description: `Payment ID ${paymentId} marked as rejected.` });
  };

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="font-headline">Pending Approvals ({pendingApproval.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {pendingApproval.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant</TableHead>
                <TableHead>Bill Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingApproval.map(payment => (
                <TableRow key={payment.id}>
                  <TableCell>
                    {payment.tenantName || 'N/A'}
                    <p className="text-xs text-muted-foreground">{payment.buildingName} - {payment.unitNumber}</p>
                  </TableCell>
                  <TableCell>{payment.billType.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</TableCell>
                  <TableCell>${payment.amount.toLocaleString()}</TableCell>
                  <TableCell>{format(new Date(payment.dueDate), 'MMM d, yyyy')}</TableCell>
                  <TableCell className="text-right space-x-2">
                    {payment.proofOfPaymentUrl && <Button variant="outline" size="sm" asChild><a href={payment.proofOfPaymentUrl} target="_blank" rel="noopener noreferrer">View Proof</a></Button>}
                    <Button onClick={() => handleApprove(payment.id)} variant="ghost" size="icon" className="text-green-600 hover:text-green-700"><CheckCircle className="h-5 w-5" /></Button>
                    <Button onClick={() => handleReject(payment.id)} variant="ghost" size="icon" className="text-red-600 hover:text-red-700"><XCircle className="h-5 w-5" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-muted-foreground text-center py-4">No payments pending approval.</p>
        )}
      </CardContent>
    </Card>
  );
}

function AllPaymentsTable({ payments }: { payments: BillPayment[] }) {
 return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="font-headline">All Payments &amp; Bills ({payments.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {payments.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant</TableHead>
                <TableHead>Bill Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Payment Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map(payment => (
                <TableRow key={payment.id}>
                  <TableCell>
                    {payment.tenantName || 'N/A'}
                    <p className="text-xs text-muted-foreground">{payment.buildingName} - {payment.unitNumber}</p>
                  </TableCell>
                  <TableCell>{payment.billType.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</TableCell>
                  <TableCell>${payment.amount.toLocaleString()}</TableCell>
                  <TableCell>{format(new Date(payment.dueDate), 'MMM d, yyyy')}</TableCell>
                  <TableCell>{payment.paymentDate ? format(new Date(payment.paymentDate), 'MMM d, yyyy') : 'N/A'}</TableCell>
                  <TableCell>
                    <Badge variant={
                      payment.status === 'approved' || payment.status === 'paid' ? 'default' : 
                      payment.status === 'pending' ? 'secondary' : 'destructive'
                    } className={
                       payment.status === 'approved' || payment.status === 'paid' ? 'bg-green-100 text-green-700 border-green-300' :
                       payment.status === 'pending' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' : 
                       payment.status === 'rejected' ? 'bg-red-100 text-red-700 border-red-300' : ''
                    }>
                      {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-muted-foreground text-center py-4">No payments or bills logged yet.</p>
        )}
      </CardContent>
    </Card>
  );
}


function BouncedChecksTable({ checks }: { checks: BouncedCheck[] }) {
  const { toast } = useToast();

  const handleUpdateBouncedCheckStatus = (checkId: string) => {
    console.log("Update bounced check status:", checkId);
    toast({ title: "Status Updated (Mock)", description: `Bounced check ID ${checkId} status updated.` });
    // Add logic to update status
  };
  
  const handleLogBouncedCheck = () => {
    console.log("Log Bounced Check clicked");
    toast({ title: "Action (Mock)", description: "Log Bounced Check form would open here." });
  };

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="font-headline">Bounced Checks ({checks.length})</CardTitle>
        <CardDescription>Track and manage bounced checks from tenants.</CardDescription>
      </CardHeader>
      <CardContent>
        {checks.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant</TableHead>
                <TableHead>Check #</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Bounce Date</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {checks.map(check => (
                <TableRow key={check.id}>
                  <TableCell>
                    {check.tenantName || 'N/A'}
                     <p className="text-xs text-muted-foreground">{check.buildingName} - {check.unitNumber}</p>
                  </TableCell>
                  <TableCell>{check.checkNumber}</TableCell>
                  <TableCell>${check.amount.toLocaleString()}</TableCell>
                  <TableCell>{format(new Date(check.bounceDate), 'MMM d, yyyy')}</TableCell>
                  <TableCell>{check.reason}</TableCell>
                  <TableCell>
                    <Badge variant={check.status === 'resolved' ? 'default' : 'destructive'} className={check.status === 'resolved' ? 'bg-green-100 text-green-700 border-green-300' : ''}>
                      {check.status.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button onClick={() => handleUpdateBouncedCheckStatus(check.id)} variant="outline" size="sm">Update Status</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-muted-foreground text-center py-4">No bounced checks recorded.</p>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleLogBouncedCheck} variant="outline"><PlusCircle className="mr-2 h-4 w-4" /> Log Bounced Check</Button>
      </CardFooter>
    </Card>
  );
}

export default function PaymentsPage() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'overview';
  const [dynamicBillPayments, setDynamicBillPayments] = React.useState<BillPayment[]>(mockBillPayments);

  const handlePaymentLogged = (newPayment: BillPayment) => {
    setDynamicBillPayments(prevPayments => [newPayment, ...prevPayments]);
  };

  const handleUpdatePaymentStatus = (paymentId: string, status: 'approved' | 'rejected', notes?: string) => {
    setDynamicBillPayments(prevPayments =>
      prevPayments.map(p =>
        p.id === paymentId ? { ...p, status, adminNotes: notes || p.adminNotes } : p
      )
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Payments &amp; Bills" description="Manage tenant billings, payment uploads, approvals, and bounced checks." />
      
      <div className="mb-4 flex gap-2">
        <div className="relative flex-grow">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input type="search" placeholder="Search payments or tenants..." className="pl-8 w-full" />
        </div>
        <Button variant="outline"><Filter className="mr-2 h-4 w-4"/>Filter</Button>
      </div>

      <Tabs defaultValue={initialTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-4">
          <TabsTrigger value="overview">Overview &amp; Upload</TabsTrigger>
          <TabsTrigger value="approval">Approval Queue</TabsTrigger>
          <TabsTrigger value="all_payments">All Payments</TabsTrigger>
          <TabsTrigger value="bounced">Bounced Checks</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <BillPaymentForm onPaymentLogged={handlePaymentLogged} />
        </TabsContent>
        <TabsContent value="approval">
          <ApprovalQueueTable payments={dynamicBillPayments} onUpdatePaymentStatus={handleUpdatePaymentStatus} />
        </TabsContent>
         <TabsContent value="all_payments">
          <AllPaymentsTable payments={dynamicBillPayments} />
        </TabsContent>
        <TabsContent value="bounced">
          <BouncedChecksTable checks={mockBouncedChecks} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
