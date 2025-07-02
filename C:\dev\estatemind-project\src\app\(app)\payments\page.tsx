
'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
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
import { mockBillPayments, mockBouncedChecks as initialMockBouncedChecks, mockTenants, mockBuildings } from '@/lib/mockData';
import type { BillPayment, BouncedCheck, BillType, AppUser } from '@/lib/types';
import { PlusCircle, Upload, CheckCircle, XCircle, AlertTriangle, Search, Filter, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import { getCurrentUser, subscribeToUserChanges } from '@/lib/authStore';

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
  currentUser: AppUser;
}

function BillPaymentForm({ onPaymentLogged, currentUser }: BillPaymentFormProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();

  const form = useForm<BillPaymentFormValues>({
    resolver: zodResolver(billPaymentFormSchema),
    defaultValues: {
      tenantId: '',
      billType: undefined,
      amount: '' as unknown as number,
      billDueDate: '',
      proofOfPayment: null,
      notes: '',
    },
  });
  
  const tenantsForSelection = currentUser.role === 'manager'
    ? mockTenants.filter(t => currentUser.assignedBuildingIds?.some(bid => mockBuildings.find(b => b.id === bid)?.name === t.buildingName))
    : mockTenants;

  const onSubmit: SubmitHandler<BillPaymentFormValues> = async (data) => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));

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
    toast({
      variant: "destructive",
      title: "Validation Error",
      description: `Please check the form for errors. ${Object.values(errors).map(e=>e.message).join(' ')}`,
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
                        {tenantsForSelection.map(t => <SelectItem key={t.id} value={t.id}>{t.name} ({t.buildingName} - {t.unitNumber})</SelectItem>)}
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
                      <Input
                        type="number"
                        placeholder="0.00"
                        {...field}
                        value={field.value ?? ''}
                        onChange={e => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                      />
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
  canApprove: boolean;
}

function ApprovalQueueTable({ payments, onUpdatePaymentStatus, canApprove }: ApprovalQueueTableProps) {
  const { toast } = useToast();
  const pendingApproval = payments.filter(p => p.status === 'pending');

  const handleApprove = (paymentId: string) => {
    onUpdatePaymentStatus(paymentId, 'approved');
    toast({ title: "Payment Approved", description: `Payment ID ${paymentId} marked as approved.` });
  };
  const handleReject = (paymentId: string) => {
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
                    {canApprove && (
                      <>
                        <Button onClick={() => handleApprove(payment.id)} variant="ghost" size="icon" className="text-green-600 hover:text-green-700"><CheckCircle className="h-5 w-5" /></Button>
                        <Button onClick={() => handleReject(payment.id)} variant="ghost" size="icon" className="text-red-600 hover:text-red-700"><XCircle className="h-5 w-5" /></Button>
                      </>
                    )}
                    {!canApprove && <Badge variant="outline">Admin Approval Req.</Badge>}
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

const bouncedCheckStatusValues = ['pending_collection', 'resolved', 'escalated_to_legal'] as const;

const bouncedCheckFormSchema = z.object({
  tenantId: z.string().min(1, "Tenant is required"),
  checkNumber: z.string().min(1, "Check number is required"),
  amount: z.coerce.number({invalid_type_error: "Amount must be a number"}).positive("Amount must be positive"),
  bounceDate: z.string().min(1, "Bounce date is required").regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  reason: z.string().min(1, "Reason for bounce is required"),
  status: z.enum(bouncedCheckStatusValues, { required_error: "Status is required" }),
  followUpDate: z.string().optional().nullable(),
  notes: z.string().optional(),
});

type BouncedCheckFormValues = z.infer<typeof bouncedCheckFormSchema>;

interface BouncedCheckFormProps {
  onBouncedCheckLogged: (newCheck: BouncedCheck) => void;
  currentUser: AppUser;
}

function BouncedCheckForm({ onBouncedCheckLogged, currentUser }: BouncedCheckFormProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();

  const form = useForm<BouncedCheckFormValues>({
    resolver: zodResolver(bouncedCheckFormSchema),
    defaultValues: {
      tenantId: '',
      checkNumber: '',
      amount: '' as unknown as number,
      bounceDate: '',
      reason: '',
      status: 'pending_collection',
      followUpDate: '',
      notes: '',
    },
  });

  const tenantsForSelection = currentUser.role === 'manager'
    ? mockTenants.filter(t => currentUser.assignedBuildingIds?.some(bid => mockBuildings.find(b => b.id === bid)?.name === t.buildingName))
    : mockTenants;

  const onSubmit: SubmitHandler<BouncedCheckFormValues> = async (data) => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    const tenantDetails = mockTenants.find(t => t.id === data.tenantId);
    const newBouncedCheck: BouncedCheck = {
      id: `bc-${Date.now()}`,
      tenantId: data.tenantId,
      tenantName: tenantDetails?.name || 'Unknown Tenant',
      unitNumber: tenantDetails?.unitNumber || 'N/A',
      buildingName: tenantDetails?.buildingName || 'N/A',
      ...data,
      followUpDate: data.followUpDate || undefined,
    };
    onBouncedCheckLogged(newBouncedCheck);
    toast({ title: "Bounced Check Logged", description: `Check #${data.checkNumber} has been recorded.` });
    form.reset();
    setIsLoading(false);
  };

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="font-headline">Log New Bounced Check</CardTitle>
        <CardDescription>Enter the details of the bounced check.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="tenantId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tenant</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select Tenant" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {tenantsForSelection.map(t => <SelectItem key={t.id} value={t.id}>{t.name} ({t.buildingName} - {t.unitNumber})</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="checkNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Check Number</FormLabel>
                    <FormControl><Input placeholder="e.g., 10023" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0.00"
                        {...field}
                        value={field.value ?? ''}
                        onChange={e => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="bounceDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bounce Date (YYYY-MM-DD)</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason for Bounce</FormLabel>
                    <FormControl><Input placeholder="e.g., Insufficient funds" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {bouncedCheckStatusValues.map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="followUpDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Follow-up Date (YYYY-MM-DD, Optional)</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl><Textarea placeholder="e.g., Called tenant, sent notification..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Logging...</> : <><PlusCircle className="mr-2 h-4 w-4" />Log Bounced Check</>}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

interface BouncedChecksTableProps {
  checks: BouncedCheck[];
  onUpdateStatus: (checkId: string, newStatus: BouncedCheck['status']) => void;
  canUpdateStatus: boolean; // For manager role
}

function BouncedChecksTable({ checks, onUpdateStatus, canUpdateStatus }: BouncedChecksTableProps) {
  const { toast } = useToast();

  const handleUpdateBouncedCheckStatus = (checkId: string) => {
    if (!canUpdateStatus) {
        toast({variant: "destructive", title: "Permission Denied", description: "You do not have permission to update bounced check status."});
        return;
    }
    const currentCheck = checks.find(c => c.id === checkId);
    if (!currentCheck) return;
    const currentIndex = bouncedCheckStatusValues.indexOf(currentCheck.status);
    const nextIndex = (currentIndex + 1) % bouncedCheckStatusValues.length;
    const newStatus = bouncedCheckStatusValues[nextIndex];
    onUpdateStatus(checkId, newStatus);
    toast({ title: "Status Updated", description: `Bounced check ID ${checkId} status updated to ${newStatus.replace('_', ' ')}.` });
  };

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="font-headline">Recorded Bounced Checks ({checks.length})</CardTitle>
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
                    <Badge variant={check.status === 'resolved' ? 'default' : check.status === 'pending_collection' ? 'secondary' : 'destructive'}
                           className={
                             check.status === 'resolved' ? 'bg-green-100 text-green-700 border-green-300' :
                             check.status === 'pending_collection' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' : ''
                           }>
                      {check.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button onClick={() => handleUpdateBouncedCheckStatus(check.id)} variant="outline" size="sm" disabled={!canUpdateStatus}>Update Status</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-muted-foreground text-center py-4">No bounced checks recorded.</p>
        )}
      </CardContent>
    </Card>
  );
}

function PaymentsPageContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'overview';
  
  const [currentUser, setCurrentUserLocal] = React.useState<AppUser | null>(getCurrentUser());
  React.useEffect(() => {
    const updateUser = () => setCurrentUserLocal(getCurrentUser());
    updateUser();
    const unsubscribe = subscribeToUserChanges(updateUser);
    return () => unsubscribe();
  }, []);

  const [dynamicBillPayments, setDynamicBillPayments] = React.useState<BillPayment[]>(mockBillPayments);
  const [dynamicBouncedChecks, setDynamicBouncedChecks] = React.useState<BouncedCheck[]>(initialMockBouncedChecks);

  if (!currentUser) {
    return (
      <div className="flex h-[calc(100vh-theme(spacing.14))] w-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="ml-2">Loading user data...</p>
      </div>
    );
  }

  const canApprovePayments = currentUser.role === 'admin';
  const canUpdateBouncedCheckStatus = currentUser.role === 'admin';

  const paymentsToDisplay = currentUser.role === 'manager'
    ? dynamicBillPayments.filter(p => currentUser.assignedBuildingIds?.some(bid => mockBuildings.find(b => b.id === bid)?.name === p.buildingName))
    : dynamicBillPayments;

  const bouncedChecksToDisplay = currentUser.role === 'manager'
    ? dynamicBouncedChecks.filter(bc => currentUser.assignedBuildingIds?.some(bid => mockBuildings.find(b => b.id === bid)?.name === bc.buildingName))
    : dynamicBouncedChecks;


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

  const handleBouncedCheckLogged = (newCheck: BouncedCheck) => {
    setDynamicBouncedChecks(prevChecks => [newCheck, ...prevChecks]);
  };

  const handleUpdateBouncedCheckStatus = (checkId: string, newStatus: BouncedCheck['status']) => {
     setDynamicBouncedChecks(prevChecks =>
      prevChecks.map(c =>
        c.id === checkId ? { ...c, status: newStatus } : c
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
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 mb-4">
          <TabsTrigger value="overview">Overview &amp; Upload</TabsTrigger>
          <TabsTrigger value="approval">Approval Queue</TabsTrigger>
          <TabsTrigger value="all_payments">All Payments</TabsTrigger>
          <TabsTrigger value="bounced">Bounced Checks List</TabsTrigger>
          <TabsTrigger value="log_bounced_check">Log Bounced Check</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <BillPaymentForm onPaymentLogged={handlePaymentLogged} currentUser={currentUser} />
        </TabsContent>
        <TabsContent value="approval">
          <ApprovalQueueTable payments={paymentsToDisplay} onUpdatePaymentStatus={handleUpdatePaymentStatus} canApprove={canApprovePayments} />
        </TabsContent>
         <TabsContent value="all_payments">
          <AllPaymentsTable payments={paymentsToDisplay} />
        </TabsContent>
        <TabsContent value="bounced">
          <BouncedChecksTable checks={bouncedChecksToDisplay} onUpdateStatus={handleUpdateBouncedCheckStatus} canUpdateStatus={canUpdateBouncedCheckStatus} />
        </TabsContent>
        <TabsContent value="log_bounced_check">
          <BouncedCheckForm onBouncedCheckLogged={handleBouncedCheckLogged} currentUser={currentUser}/>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function PaymentsPage() {
  return (
    <React.Suspense fallback={
      <div className="flex h-[calc(100vh-theme(spacing.14))] w-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    }>
      <PaymentsPageContent />
    </React.Suspense>
  );
}
