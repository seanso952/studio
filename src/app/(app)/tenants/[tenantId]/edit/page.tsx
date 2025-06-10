
'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/shared/PageHeader';
import { useToast } from '@/hooks/use-toast';
import { getTenantById, updateTenantInStore, subscribeToTenants } from '@/lib/tenantStore';
import type { Tenant, TenantType } from '@/lib/types';
import { ArrowLeft, Loader2, Save } from 'lucide-react';

const tenantTypeValues: [TenantType, ...TenantType[]] = ['non-receipted', 'receipted'];

const editTenantFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Invalid email address."),
  phone: z.string().min(7, "Phone number seems too short.").regex(/^\+?[0-9\s-()]*$/, "Invalid phone number format."),
  contractStartDate: z.string().min(1, "Contract start date is required.").regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  contractEndDate: z.string().min(1, "Contract end date is required.").regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  rentAmount: z.coerce.number({invalid_type_error: "Rent amount must be a number"}).positive("Rent amount must be positive."),
  tenantType: z.enum(tenantTypeValues, { required_error: "Tenant type is required." }),
  outstandingBalance: z.coerce.number({invalid_type_error: "Outstanding balance must be a number"}).optional(),
});

type EditTenantFormValues = z.infer<typeof editTenantFormSchema>;

export default function EditTenantProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const tenantId = params.tenantId as string;
  const [isLoading, setIsLoading] = React.useState(false);
  const [tenant, setTenant] = React.useState<Tenant | undefined>(undefined);

  const form = useForm<EditTenantFormValues>({
    resolver: zodResolver(editTenantFormSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      contractStartDate: '',
      contractEndDate: '',
      rentAmount: '' as unknown as number,
      tenantType: undefined,
      outstandingBalance: 0,
    },
  });

  React.useEffect(() => {
    const fetchTenant = () => {
      const currentTenant = getTenantById(tenantId);
      setTenant(currentTenant);
      if (currentTenant) {
        form.reset({
          name: currentTenant.name,
          email: currentTenant.email,
          phone: currentTenant.phone,
          contractStartDate: currentTenant.contractStartDate,
          contractEndDate: currentTenant.contractEndDate,
          rentAmount: currentTenant.rentAmount,
          tenantType: currentTenant.tenantType,
          outstandingBalance: currentTenant.outstandingBalance,
        });
      }
    };
    fetchTenant();
    const unsubscribe = subscribeToTenants(fetchTenant);
    return unsubscribe;
  }, [tenantId, form]);

  const onSubmit: SubmitHandler<EditTenantFormValues> = async (data) => {
     if (!tenant) {
      toast({ variant: "destructive", title: "Error", description: "Tenant not found." });
      return;
    }
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

    try {
      updateTenantInStore({ id: tenantId, ...data });
      toast({
        title: "Tenant Updated",
        description: `${data.name}'s profile has been successfully updated.`,
      });
      router.push(`/tenants/${tenantId}`);
    } catch (error) {
      console.error("Failed to update tenant:", error);
      toast({
        variant: "destructive",
        title: "Failed to Update Tenant",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!tenant && !form.formState.isLoading) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-semibold">Tenant Not Found</h2>
        <Button asChild variant="link" className="mt-4">
          <Link href="/tenants">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Tenants
          </Link>
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <PageHeader 
        title={`Edit Profile: ${tenant?.name || 'Tenant'}`}
        description={`Tenant ID: ${tenantId}`}
      >
        <Button asChild variant="outline">
          <Link href={`/tenants/${tenantId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Tenant Profile
          </Link>
        </Button>
      </PageHeader>

      <Card className="max-w-2xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">
            Modify Tenant Information
          </CardTitle>
          <CardDescription>Update the tenant's details below.</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="e.g., john.doe@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., (555) 123-4567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="contractStartDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contract Start Date (YYYY-MM-DD)</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contractEndDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contract End Date (YYYY-MM-DD)</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="rentAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monthly Rent ($)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="e.g., 1500" 
                          {...field} 
                          value={field.value ?? ''}
                          onChange={e => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tenantType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tenant Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select tenant type..." /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {tenantTypeValues.map(type => (
                            <SelectItem key={type} value={type}>
                              {type.charAt(0).toUpperCase() + type.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
               <FormField
                control={form.control}
                name="outstandingBalance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Outstanding Balance ($)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="e.g., 0" 
                        {...field} 
                        value={field.value ?? ''}
                        onChange={e => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isLoading || !form.formState.isDirty} className="w-full md:w-auto">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
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
