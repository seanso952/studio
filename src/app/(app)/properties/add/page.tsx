
'use client';

import * as React from 'react';
import Link from 'next/link';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { PageHeader } from '@/components/shared/PageHeader';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, PlusCircle } from 'lucide-react';

const propertyFormSchema = z.object({
  name: z.string().min(3, "Property name must be at least 3 characters long."),
  address: z.string().min(5, "Property address must be at least 5 characters long."),
  numberOfUnits: z.coerce
    .number({ invalid_type_error: "Number of units must be a number." })
    .int("Number of units must be an integer.")
    .positive("Number of units must be a positive number.")
    .min(1, "Property must have at least 1 unit."),
  imageUrl: z.string().url("Please enter a valid URL for the image.").optional().or(z.literal('')),
});

type PropertyFormValues = z.infer<typeof propertyFormSchema>;

export default function AddPropertyPage() {
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();

  const form = useForm<PropertyFormValues>({
    resolver: zodResolver(propertyFormSchema),
    defaultValues: {
      name: '',
      address: '',
      numberOfUnits: undefined,
      imageUrl: '',
    },
  });

  const onSubmit: SubmitHandler<PropertyFormValues> = async (data) => {
    setIsLoading(true);
    console.log("New Property Data:", data);
    // Simulate API call to add property
    // In a real application, you would make a request to your backend here.
    // For example: const newProperty = await api.addProperty(data);
    
    // For mock purposes:
    const newProperty = { 
      id: `building-${Date.now()}`, 
      ...data, 
      occupiedUnits: 0, // New properties start with 0 occupied units
      totalIncome: 0, // New properties start with 0 income
    };
    console.log("Mocked New Property Entry:", newProperty);

    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay

    toast({
      title: "Property Added (Mock)",
      description: `${data.name} has been successfully added. (This is a mock submission)`,
    });
    form.reset(); // Reset form fields
    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Add New Property" description="Enter the details for the new property.">
        <Button variant="outline" asChild>
          <Link href="/properties">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Properties
          </Link>
        </Button>
      </PageHeader>

      <Card className="shadow-lg max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="font-headline">Property Information</CardTitle>
          <CardDescription>Fill in the form below to register a new property in the system.</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Sunrise Apartments, Downtown Plaza" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property Address</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 123 Sunshine Blvd, Metro City" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="numberOfUnits"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Units</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 10" {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value, 10))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image URL (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., https://placehold.co/600x400.png" {...field} />
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
                    Adding Property...
                  </>
                ) : (
                  <>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Property
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

