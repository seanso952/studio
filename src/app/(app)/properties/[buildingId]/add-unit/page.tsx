
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
import { getBuildings } from '@/lib/propertyStore';
import { addUnitToStore } from '@/lib/unitStore';
import { ArrowLeft, Loader2, PlusCircle } from 'lucide-react';

const unitFormSchema = z.object({
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

type UnitFormValues = z.infer<typeof unitFormSchema>;

export default function AddUnitPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const buildingId = params.buildingId as string;
  const [isLoading, setIsLoading] = React.useState(false);

  const allBuildings = getBuildings();
  const building = allBuildings.find(b => b.id === buildingId);

  const form = useForm<UnitFormValues>({
    resolver: zodResolver(unitFormSchema),
    defaultValues: {
      unitNumber: '',
      size: '',
      bedrooms: '' as unknown as number, 
      bathrooms: '' as unknown as number, 
      monthlyRent: '' as unknown as number, 
    },
  });

  const onSubmit: SubmitHandler<UnitFormValues> = async (data) => {
    if (!buildingId) return;
    setIsLoading(true);
    
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

    try {
      addUnitToStore(data, buildingId);
      toast({
        title: "Unit Added",
        description: `Unit ${data.unitNumber} has been successfully added to ${building?.name}.`,
      });
      form.reset();
      router.push(`/properties/${buildingId}`);
    } catch (error) {
      console.error("Failed to add unit:", error);
      toast({
        variant: "destructive",
        title: "Failed to Add Unit",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!building) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-semibold">Building not found</h2>
        <p className="text-muted-foreground">Cannot add a unit to a non-existent building.</p>
        <Button asChild variant="link" className="mt-4">
          <Link href="/properties">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Properties
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={`Add Unit to ${building.name}`} description={`Enter details for a new unit in ${building.address}.`}>
        <Button asChild variant="outline">
          <Link href={`/properties/${buildingId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Building Details
          </Link>
        </Button>
      </PageHeader>

      <Card className="max-w-2xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">New Unit Information</CardTitle>
          <CardDescription>Fill in the form below to add a new unit to this building.</CardDescription>
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
                        <Input 
                          type="number" 
                          placeholder="e.g., 2" 
                          {...field} 
                          value={field.value ?? ''}
                          onChange={e => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value, 10))} 
                        />
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
                        <Input 
                          type="number" 
                          step="0.5" 
                          placeholder="e.g., 1.5" 
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
              <FormField
                control={form.control}
                name="monthlyRent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monthly Rent ($)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="e.g., 1200" 
                        {...field} 
                        value={field.value ?? ''}
                        onChange={e => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))} 
                      />
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
                    Adding Unit...
                  </>
                ) : (
                  <>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Unit
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
