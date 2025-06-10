
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
import { PageHeader } from '@/components/shared/PageHeader';
import { useToast } from '@/hooks/use-toast';
import { getUnitById, updateUnitInStore, subscribeToUnits } from '@/lib/unitStore';
import type { Unit } from '@/lib/types';
import { ArrowLeft, Loader2, Save } from 'lucide-react';

const editUnitFormSchema = z.object({
  unitNumber: z.string().min(1, "Unit number is required."),
  size: z.string().min(1, "Size is required (e.g., 70 sqm)."),
  bedrooms: z.coerce
    .number({ invalid_type_error: "Number of bedrooms must be a number." })
    .int("Number of bedrooms must be an integer.")
    .min(0, "Number of bedrooms cannot be negative."),
  bathrooms: z.coerce
    .number({ invalid_type_error: "Number of bathrooms must be a number." })
    .min(0.5, "Number of bathrooms must be at least 0.5.")
    .step(0.5, "Number of bathrooms can be in increments of 0.5."),
  monthlyRent: z.coerce
    .number({ invalid_type_error: "Monthly rent must be a number." })
    .positive("Monthly rent must be a positive number.")
});

type EditUnitFormValues = z.infer<typeof editUnitFormSchema>;

export default function EditUnitPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const buildingId = params.buildingId as string;
  const unitId = params.unitId as string;
  const [isLoading, setIsLoading] = React.useState(false);
  const [unit, setUnit] = React.useState<Unit | undefined>(undefined);

  const form = useForm<EditUnitFormValues>({
    resolver: zodResolver(editUnitFormSchema),
    defaultValues: {
      unitNumber: '',
      size: '',
      bedrooms: 0,
      bathrooms: 0,
      monthlyRent: 0,
    },
  });

  React.useEffect(() => {
    const fetchUnit = () => {
      const currentUnit = getUnitById(unitId);
      setUnit(currentUnit);
      if (currentUnit) {
        form.reset({
          unitNumber: currentUnit.unitNumber,
          size: currentUnit.size,
          bedrooms: currentUnit.bedrooms,
          bathrooms: currentUnit.bathrooms,
          monthlyRent: currentUnit.monthlyRent,
        });
      }
    };
    fetchUnit();
    const unsubscribe = subscribeToUnits(fetchUnit);
    return unsubscribe;
  }, [unitId, form]);

  const onSubmit: SubmitHandler<EditUnitFormValues> = async (data) => {
    if (!unit) {
      toast({ variant: "destructive", title: "Error", description: "Unit not found." });
      return;
    }
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

    try {
      updateUnitInStore({ id: unitId, ...data });
      toast({
        title: "Unit Updated",
        description: `Unit ${data.unitNumber} has been successfully updated.`,
      });
      router.push(`/properties/${buildingId}/${unitId}`);
    } catch (error) {
      console.error("Failed to update unit:", error);
      toast({
        variant: "destructive",
        title: "Failed to Update Unit",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!unit && !form.formState.isLoading) { // Check isLoading to prevent flash of "not found"
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-semibold">Unit Not Found</h2>
        <Button asChild variant="link" className="mt-4">
          <Link href={`/properties/${buildingId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Building
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title={`Edit Unit ${unit?.unitNumber || ''}`}
        description={`Building ID: ${buildingId}`}
      >
        <Button asChild variant="outline">
          <Link href={`/properties/${buildingId}/${unitId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Unit Details
          </Link>
        </Button>
      </PageHeader>

      <Card className="max-w-2xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">
            Modify Unit Information
          </CardTitle>
          <CardDescription>Update the details for this unit.</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="unitNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit Number</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., A101, PH2, Unit 5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="size"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Size (e.g., 75 sqm, 800 sqft)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 75 sqm" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="bedrooms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bedrooms</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 2" {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value, 10))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bathrooms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bathrooms</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.5" placeholder="e.g., 1.5" {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="monthlyRent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monthly Rent ($)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 1200" {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))} />
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
