
'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { PageHeader } from '@/components/shared/PageHeader';
import { getBuildings } from '@/lib/propertyStore'; 
import { getUnitsByBuildingId, subscribeToUnits } from '@/lib/unitStore'; // Using unitStore
import { mockTenants, mockRepairs } from '@/lib/mockData'; // Tenants, repairs still from mockData
import type { Unit, Tenant, Repair } from '@/lib/types';
import { ArrowLeft, UserCircle, BedDouble, Bath, Home as HomeIcon, DollarSign, Wrench, CalendarDays, Hammer, PlusCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

export default function UnitDetailsPage() {
  const params = useParams();
  const buildingId = params.buildingId as string;
  const unitId = params.unitId as string;
  const { toast } = useToast();

  const [unit, setUnit] = React.useState<Unit | undefined>(undefined);
  
  const allBuildings = getBuildings();
  const building = allBuildings.find(b => b.id === buildingId);
  
  React.useEffect(() => {
    if (!buildingId || !unitId) return;

    const updateUnit = () => {
      const unitsInBuilding = getUnitsByBuildingId(buildingId);
      const currentUnit = unitsInBuilding.find(u => u.id === unitId);
      setUnit(currentUnit);
    };

    updateUnit(); // Initial fetch

    const unsubscribe = subscribeToUnits(updateUnit); // Subscribe to all unit changes for simplicity
    return () => unsubscribe();
  }, [buildingId, unitId]);


  // Tenant and repairs are still derived from mockData for now, or from the unit object if populated
  const tenant = unit?.tenantId ? mockTenants.find(t => t.id === unit.tenantId) : (unit?.tenant);
  const repairsForUnit = unit ? (unit.repairs.length > 0 ? unit.repairs : mockRepairs.filter(r => r.unitId === unitId)) : [];


  if (!building) { // Check for building first
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-semibold">Building not found</h2>
        <Button asChild variant="link" className="mt-4">
          <Link href={`/properties`}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Properties
          </Link>
        </Button>
      </div>
    );
  }
  
  // Separate check for unit after building is confirmed
  if (!unit) {
     return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-semibold">Unit not found</h2>
        <Button asChild variant="link" className="mt-4">
          <Link href={`/properties/${buildingId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Building
          </Link>
        </Button>
      </div>
    );
  }


  const handleLogRepair = () => {
    console.log("Log Repair clicked for unit:", unitId);
    toast({ title: "Action: Log Repair", description: "Functionality to log a new repair would be triggered here." });
  };

  const handleUploadDocument = () => {
    console.log("Upload Document clicked for unit:", unitId);
    toast({ title: "Action: Upload Document", description: "Functionality to upload a unit-specific document would be triggered here." });
  };

  const handleAssignTenant = () => {
    console.log("Assign Tenant clicked for unit:", unitId);
    toast({ title: "Action: Assign Tenant", description: "Functionality to assign a tenant to this vacant unit would be triggered here." });
  };
  
  const handleEditUnitDetails = () => {
    console.log("Edit Unit Details clicked for unit:", unitId);
    toast({ title: "Action: Edit Unit Details", description: "Navigate to unit edit page or open edit modal." });
  };

  const handleManageLease = () => {
    console.log("Manage Lease clicked for unit:", unitId);
    toast({ title: "Action: Manage Lease", description: "Open lease management options for this unit." });
  };

  const handleMarkAsVacant = () => {
    console.log("Mark as Vacant clicked for unit:", unitId);
    toast({ title: "Action: Mark as Vacant", description: "Unit status would be updated to vacant (mocked)." });
    // Here you would typically update the unit's status in your state/backend
  };


  return (
    <div className="space-y-6">
      <PageHeader title={`Unit ${unit.unitNumber}`} description={`${building.name} - ${building.address}`}>
        <Button asChild variant="outline">
          <Link href={`/properties/${building.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Building
          </Link>
        </Button>
      </PageHeader>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Unit Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><strong className="font-medium text-muted-foreground">Status:</strong> <span className={`font-semibold ${unit.status === 'occupied' ? 'text-green-600' : 'text-orange-500'}`}>{unit.status.charAt(0).toUpperCase() + unit.status.slice(1)}</span></div>
              <div><strong className="font-medium text-muted-foreground">Size:</strong> {unit.size}</div>
              <div><strong className="font-medium text-muted-foreground">Bedrooms:</strong> {unit.bedrooms} <BedDouble className="inline h-4 w-4 ml-1 text-muted-foreground" /></div>
              <div><strong className="font-medium text-muted-foreground">Bathrooms:</strong> {unit.bathrooms} <Bath className="inline h-4 w-4 ml-1 text-muted-foreground" /></div>
              <div><strong className="font-medium text-muted-foreground">Monthly Rent:</strong> ${unit.monthlyRent.toLocaleString()} <DollarSign className="inline h-4 w-4 ml-1 text-muted-foreground" /></div>
            </div>
            <Separator />
             <Tabs defaultValue="tenant" className="w-full">
                <TabsList>
                  <TabsTrigger value="tenant">Tenant Details</TabsTrigger>
                  <TabsTrigger value="repairs">Repair History</TabsTrigger>
                  <TabsTrigger value="documents">Documents</TabsTrigger>
                </TabsList>
                <TabsContent value="tenant" className="mt-4">
                  {tenant ? (
                    <Card>
                      <CardHeader>
                        <CardTitle className="font-headline flex items-center"><UserCircle className="mr-2 h-6 w-6 text-primary"/>{tenant.name}</CardTitle>
                        <CardDescription>{tenant.email} &bull; {tenant.phone}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <p><strong>Contract:</strong> {format(new Date(tenant.contractStartDate), 'MMM d, yyyy')} - {format(new Date(tenant.contractEndDate), 'MMM d, yyyy')}</p>
                        <p><strong>Rent:</strong> ${tenant.rentAmount.toLocaleString()}/month</p>
                        <p><strong>Tenant Type:</strong> {tenant.tenantType.charAt(0).toUpperCase() + tenant.tenantType.slice(1)}</p>
                        <p><strong>Outstanding Balance:</strong> <span className={tenant.outstandingBalance > 0 ? "text-destructive font-semibold" : "text-green-600 font-semibold"}>${tenant.outstandingBalance.toLocaleString()}</span></p>
                      </CardContent>
                      <CardFooter>
                        <Button asChild variant="link">
                          <Link href={`/tenants/${tenant.id}`}>View Full Tenant Profile</Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <HomeIcon className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                      <p>This unit is currently vacant.</p>
                      <Button variant="outline" size="sm" className="mt-4" onClick={handleAssignTenant}>Assign Tenant</Button>
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="repairs" className="mt-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="font-headline flex items-center"><Wrench className="mr-2 h-6 w-6 text-primary"/>Repair History</CardTitle>
                       <Button variant="outline" size="sm" onClick={handleLogRepair}><PlusCircle className="mr-2 h-4 w-4" /> Log Repair</Button>
                    </CardHeader>
                    <CardContent>
                      {repairsForUnit.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead className="text-right">Cost</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {repairsForUnit.map(repair => (
                              <TableRow key={repair.id}>
                                <TableCell>{format(new Date(repair.date), 'MMM d, yyyy')}</TableCell>
                                <TableCell>{repair.description}</TableCell>
                                <TableCell className="text-right">${repair.cost.toLocaleString()}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                         <div className="text-center py-6 text-muted-foreground">
                            <Hammer className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                            <p>No repair history for this unit.</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                 <TabsContent value="documents" className="mt-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="font-headline">Unit Documents</CardTitle>
                      <Button variant="outline" size="sm" onClick={handleUploadDocument}><PlusCircle className="mr-2 h-4 w-4" /> Upload Document</Button>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">Unit-specific documents (e.g., inspection reports, floor plans) will be listed here.</p>
                      {/* Placeholder for documents list */}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
          </CardContent>
        </Card>
        <div className="space-y-6">
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="font-headline">Unit Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <Button variant="outline" className="w-full" onClick={handleEditUnitDetails}>Edit Unit Details</Button>
                    <Button variant="outline" className="w-full" onClick={handleManageLease}>Manage Lease</Button>
                    <Button variant="destructive" className="w-full" onClick={handleMarkAsVacant}>Mark as Vacant</Button>
                </CardContent>
            </Card>
            {/* Could add a small gallery or notes section here */}
        </div>
      </div>
    </div>
  );
}
