
'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/shared/PageHeader';
import { useToast } from '@/hooks/use-toast';
import { getBuildings } from '@/lib/propertyStore';
import { getUnitsByBuildingId, assignTenantToUnit as assignTenantToUnitInStore } from '@/lib/unitStore';
import { mockTenants } from '@/lib/mockData'; // We'll directly modify this for now
import type { Building, Tenant, Unit } from '@/lib/types';
import { ArrowLeft, Loader2, UserPlus } from 'lucide-react';

const assignTenantFormSchema = z.object({
  tenantId: z.string().min(1, "Please select a tenant to assign."),
});

type AssignTenantFormValues = z.infer<typeof assignTenantFormSchema>;

export default function AssignTenantPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const buildingId = params.buildingId as string;
  const unitId = params.unitId as string;
  const [isLoading, setIsLoading] = React.useState(false);

  const [building, setBuilding] = React.useState<Building | undefined>(undefined);
  const [unit, setUnit] = React.useState<Unit | undefined>(undefined);

  React.useEffect(() => {
    const allBuildings = getBuildings();
    setBuilding(allBuildings.find(b => b.id === buildingId));

    const unitsInBuilding = getUnitsByBuildingId(buildingId);
    setUnit(unitsInBuilding.find(u => u.id === unitId));
  }, [buildingId, unitId]);

  const availableTenants = mockTenants.filter(tenant => !tenant.unitId);

  const form = useForm<AssignTenantFormValues>({
    resolver: zodResolver(assignTenantFormSchema),
    defaultValues: {
      tenantId: '',
    },
  });

  const onSubmit: SubmitHandler<AssignTenantFormValues> = async (data) => {
    if (!unit || !building) {
      toast({ variant: "destructive", title: "Error", description: "Unit or building details not found." });
      return;
    }
    if (unit.status === 'occupied') {
      toast({ variant: "destructive", title: "Error", description: "This unit is already occupied." });
      return;
    }

    setIsLoading(true);
    const selectedTenant = mockTenants.find(t => t.id === data.tenantId);

    if (!selectedTenant) {
      toast({ variant: "destructive", title: "Error", description: "Selected tenant not found." });
      setIsLoading(false);
      return;
    }
    
    if (selectedTenant.unitId) {
      toast({ variant: "destructive", title: "Error", description: "This tenant is already assigned to another unit." });
      setIsLoading(false);
      return;
    }

    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

    try {
      // 1. Update unit in unitStore
      assignTenantToUnitInStore(unit.id, selectedTenant);

      // 2. Update tenant in mockTenants (direct mutation for now)
      const tenantIndex = mockTenants.findIndex(t => t.id === selectedTenant.id);
      if (tenantIndex > -1) {
        mockTenants[tenantIndex].unitId = unit.id;
        mockTenants[tenantIndex].unitNumber = unit.unitNumber;
        mockTenants[tenantIndex].buildingName = building.name;
      }
      
      toast({
        title: "Tenant Assigned",
        description: `${selectedTenant.name} has been assigned to Unit ${unit.unitNumber}.`,
      });
      router.push(`/properties/${buildingId}/${unitId}`);
    } catch (error) {
      console.error("Failed to assign tenant:", error);
      toast({
        variant: "destructive",
        title: "Failed to Assign Tenant",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!building || !unit) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-semibold">Building or Unit Not Found</h2>
        <Button asChild variant="link" className="mt-4">
          <Link href={`/properties/${buildingId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Building
          </Link>
        </Button>
      </div>
    );
  }

  if (unit.status === 'occupied') {
     return (
      <div className="space-y-6">
        <PageHeader title={`Assign Tenant to Unit ${unit.unitNumber}`} description={`${building.name} - ${building.address}`}>
            <Button asChild variant="outline">
            <Link href={`/properties/${buildingId}/${unitId}`}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Unit Details
            </Link>
            </Button>
        </PageHeader>
        <Card className="max-w-2xl mx-auto shadow-lg">
            <CardHeader>
                <CardTitle className="font-headline">Unit Already Occupied</CardTitle>
            </CardHeader>
            <CardContent>
                <p>Unit {unit.unitNumber} is already occupied by {unit.tenant?.name || 'a tenant'}. You might need to mark it as vacant first if you intend to assign a new tenant.</p>
            </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={`Assign Tenant to Unit ${unit.unitNumber}`} description={`Select an available tenant for Unit ${unit.unitNumber} in ${building.name}.`}>
        <Button asChild variant="outline">
          <Link href={`/properties/${buildingId}/${unitId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Unit Details
          </Link>
        </Button>
      </PageHeader>

      <Card className="max-w-2xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Select Tenant</CardTitle>
          <CardDescription>Choose an available tenant from the list to assign to this unit.</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="tenantId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Available Tenants</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select an available tenant..." /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableTenants.length > 0 ? (
                          availableTenants.map(tenant => (
                            <SelectItem key={tenant.id} value={tenant.id}>
                              {tenant.name} ({tenant.email})
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-tenants" disabled>No available tenants found</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isLoading || availableTenants.length === 0} className="w-full md:w-auto">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Assigning Tenant...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Assign Tenant
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
