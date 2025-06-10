
'use client';

import * as React from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { PageHeader } from '@/components/shared/PageHeader';
import { useToast } from '@/hooks/use-toast';
import { mockTenants, mockBillPayments } from '@/lib/mockData';
import type { BillPayment, Tenant } from '@/lib/types'; // Ensure Tenant is imported
import { UploadCloud, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

const paymentUploadFormSchema = z.object({
  billId: z.string().min(1, "Please select the bill you are paying for."),
  paymentDate: z.string().min(1, "Payment date is required.").regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  proofOfPayment: z.any()
    .refine(
      (value) => typeof window === 'undefined' || (value instanceof FileList && value.length > 0),
      "Proof of payment (file) is required."
    )
    .refine(
      (value) => typeof window === 'undefined' || (value instanceof FileList && value.length > 0 && value[0].size <= 5 * 1024 * 1024),
      "File size must be 5MB or less."
    ),
  notes: z.string().optional(),
});

type PaymentUploadFormValues = z.infer<typeof paymentUploadFormSchema>;

export default function TenantPaymentUploadPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);

  // Simulate fetching the logged-in tenant. In a real app, this would come from auth.
  const tenant: Tenant | undefined = mockTenants[0]; 

  const tenantUnpaidBills: BillPayment[] = tenant
    ? mockBillPayments.filter(bill => bill.tenantId === tenant.id && (bill.status === 'pending' || bill.status === 'rejected' || !bill.paymentDate))
    : [];

  const form = useForm<PaymentUploadFormValues>({
    resolver: zodResolver(paymentUploadFormSchema),
    defaultValues: {
      billId: '',
      paymentDate: new Date().toISOString().split('T')[0], // Default to today
      proofOfPayment: undefined,
      notes: '',
    },
  });

  const onSubmit: SubmitHandler<PaymentUploadFormValues> = async (data) => {
    setIsLoading(true);
    console.log("Tenant Payment Upload Data:", data);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    toast({
      title: "Payment Submitted",
      description: "Your proof of payment has been uploaded and is pending review. Thank you!",
    });
    form.reset();
    setIsLoading(false);
  };

  const onInvalidSubmit = (errors: any) => {
    console.error("Tenant Payment Upload Validation Errors:", errors);
    toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please check the form for errors and try again.",
    });
  };


  if (!tenant) {
    return (
         <div className="space-y-6">
            <PageHeader title="Upload Proof of Payment" description="Submit your payment confirmation here."/>
            <Card><CardContent className="p-6 text-center text-muted-foreground">Could not load tenant information. Please try again.</CardContent></Card>
        </div>
    ); // Critical: Ensure this return statement is properly terminated.
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Upload Proof of Payment" description="Submit your payment confirmation for an outstanding bill.">
         <Button variant="outline" asChild>
          <Link href="/portal/dashboard">Back to Dashboard</Link>
        </Button>
      </PageHeader>

      <Card className="shadow-lg max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="font-headline">Submit Your Payment</CardTitle>
          <CardDescription>
            Select the bill, enter the payment date, and upload your proof (e.g., bank transfer screenshot, deposit slip).
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit, onInvalidSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="billId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Bill</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Choose a bill to pay..." /></SelectValue>
                      </FormControl>
                      <SelectContent>
                        {tenantUnpaidBills.length > 0 ? tenantUnpaidBills.map(bill => (
                          <SelectItem key={bill.id} value={bill.id}>
                            {bill.billType.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} - ${bill.amount.toFixed(2)} (Due: {format(new Date(bill.dueDate), 'MMM d, yyyy')})
                          </SelectItem>
                        )) : <SelectItem value="no-bills" disabled>No outstanding bills found</SelectItem>}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Date (YYYY-MM-DD)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="proofOfPayment"
                render={({ field: { onChange, onBlur, name, ref } }) => (
                    <FormItem>
                    <FormLabel>Proof of Payment (Max 5MB: PDF, JPG, PNG)</FormLabel>
                    <FormControl>
                        <Input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
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
                      <Textarea placeholder="e.g., Reference number, bank name..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isLoading || tenantUnpaidBills.length === 0}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
                  </>
                ) : (
                  <>
                    <UploadCloud className="mr-2 h-4 w-4" /> Submit Proof of Payment
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
