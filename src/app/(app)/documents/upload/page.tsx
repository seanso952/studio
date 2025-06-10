
'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { PageHeader } from '@/components/shared/PageHeader';
import { useToast } from '@/hooks/use-toast';
import { getTenants } from '@/lib/tenantStore';
import type { Tenant } from '@/lib/types';
import { ArrowLeft, Loader2, UploadCloud } from 'lucide-react';

const documentTypeValues = ['receipt', 'form2307', 'lease_agreement', 'other'] as const;
const NO_TENANT_SELECTED_VALUE = "__NO_TENANT_SELECTED__"; // Unique value for "None" option

const documentUploadFormSchema = z.object({
  documentName: z.string().min(3, "Document name is required (min 3 chars)."),
  documentType: z.enum(documentTypeValues, { required_error: "Document type is required." }),
  tenantId: z.string().optional(), // Optional: for tenant-specific documents
  file: z.any()
    .refine(
      (value) => typeof window === 'undefined' || (value instanceof FileList && value.length > 0), 
      "File is required."
    )
    .refine(
      (value) => typeof window === 'undefined' || (value instanceof FileList && value.length > 0 && value[0].size <= 10 * 1024 * 1024), // 10MB limit
      "File size must be 10MB or less."
    ),
  notes: z.string().optional(),
});

type DocumentUploadFormValues = z.infer<typeof documentUploadFormSchema>;

export default function UploadDocumentPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [tenants, setTenants] = React.useState<Tenant[]>([]);

  React.useEffect(() => {
    setTenants(getTenants());
  }, []);

  const form = useForm<DocumentUploadFormValues>({
    resolver: zodResolver(documentUploadFormSchema),
    defaultValues: {
      documentName: '',
      documentType: undefined,
      tenantId: undefined, // Changed from '' to undefined
      file: undefined,
      notes: '',
    },
  });

  const onSubmit: SubmitHandler<DocumentUploadFormValues> = async (data) => {
    setIsLoading(true);
    console.log("Document Upload Data:", data);
    // Simulate API call for document upload
    await new Promise(resolve => setTimeout(resolve, 1500));

    // In a real app, you would upload the file (data.file[0]) to cloud storage
    // and save the document metadata (name, type, URL, tenantId, notes) to your database.
    // For this mock, we'll just show a success toast.

    toast({
      title: "Document Uploaded",
      description: `${data.documentName} has been submitted.`,
    });
    form.reset();
    // Potentially redirect to /documents or a document detail page
    // router.push('/documents'); 
    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Upload New Document" description="Upload general documents or link them to a tenant.">
        <Button variant="outline" asChild>
          <Link href="/documents">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Document Center
          </Link>
        </Button>
      </PageHeader>

      <Card className="shadow-lg max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="font-headline">Document Details</CardTitle>
          <CardDescription>Fill in the form to upload a new document.</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="documentName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Document Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., January Rent Receipt, Lease Addendum" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="documentType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Document Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select type..." /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {documentTypeValues.map(type => (
                            <SelectItem key={type} value={type}>
                              {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tenantId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Associate with Tenant (Optional)</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(value === NO_TENANT_SELECTED_VALUE ? undefined : value)}
                        value={field.value ?? ""} // Pass "" to Select if field.value is undefined to show placeholder
                      >
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select tenant..." /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={NO_TENANT_SELECTED_VALUE}>None (General Document)</SelectItem>
                          {tenants.map(tenant => (
                            <SelectItem key={tenant.id} value={tenant.id}>
                              {tenant.name} ({tenant.buildingName} - {tenant.unitNumber})
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
                name="file"
                render={({ field: { onChange, onBlur, name, ref } }) => (
                    <FormItem>
                    <FormLabel>Document File (Max 10MB)</FormLabel>
                    <FormControl>
                        <Input 
                        type="file" 
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
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
                      <Textarea placeholder="Any relevant notes about this document..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading Document...
                  </>
                ) : (
                  <>
                    <UploadCloud className="mr-2 h-4 w-4" />
                    Upload Document
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
