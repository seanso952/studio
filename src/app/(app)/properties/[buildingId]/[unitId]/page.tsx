
'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation'; 
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { PageHeader } from '@/components/shared/PageHeader';
import { getBuildings } from '@/lib/propertyStore'; 
import { getUnitsByBuildingId, subscribeToUnits, unassignTenantFromUnit as unassignTenantFromUnitInStore } from '@/lib/unitStore'; 
import { updateTenantInStore, getTenantById } from '@/lib/tenantStore';
import { mockRepairs } from '@/lib/mockData'; 
import type { Unit, Tenant, Repair } from '@/lib/types';
import { ArrowLeft, UserCircle, BedDouble, Bath, Home as HomeIcon, DollarSign, Wrench, CalendarDays, Hammer, PlusCircle, UserPlus, Edit, FileCog, LogOut, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { getCurrentUser, subscribeToUserChanges, type MockAuthUser } from '@/lib/authStore';

export default function UnitDetailsPage() {
  const params = useParams();
  const router = useRouter(); 
  const buildingId = params.buildingId as string;
  const unitId = params.unitId as string;
  const { toast } = useToast();

  const [currentUser, setCurrentUserLocal] = React.useState<MockAuthUser>(getCurrentUser());
  const [unit, setUnit] = React.useState<Unit | undefined>(undefined);
  
  const allBuildings = getBuildings(); // Static, consider subscription if buildings change
  const building = allBuildings.find(b => b.id === buildingId);
  
  React.useEffect(() => {
    const updateUserAuth = () => setCurrentUserLocal(getCurrentUser());
    updateUserAuth();
    const unsubscribeAuth = subscribeToUserChanges(updateUserAuth);

    if (!buildingId || !unitId) return;

    const updateUnit = () => {
      const unitsInBuilding = getUnitsByBuildingId(buildingId);
      const currentUnit = unitsInBuilding.find(u => u.id === unitId);
      setUnit(currentUnit);
    };

    updateUnit(); 
    const unsubscribeUnits = subscribeToUnits(updateUnit); 
    
    return () => {
      unsubscribeAuth();
      unsubscribeUnits();
    };
  }, [buildingId, unitId]);

  const tenant = unit?.tenant;
  const repairsForUnit = unit ? (unit.repairs.length > 0 ? unit.repairs : mockRepairs.filter(r => r.unitId === unitId)) : [];

  const canViewUnit = currentUser.role === 'admin' || (currentUser.role === 'manager' && currentUser.assignedBuildingIds?.includes(buildingId));

  if (!building) { 
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
  
  if (!unit && canViewBuilding) { // Check canViewBuilding before showing unit not found for this building
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

  if (!canViewUnit) {
    return (
     <div className="text-center py-10">
       <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
       <h2 className="text-2xl font-semibold text-destructive">Access Denied</h2>
       <p className="text-muted-foreground">You do not have permission to view this unit.</p>
       <Button asChild variant="link" className="mt-4">
         <Link href={`/properties`}> {/* Or /properties/${buildingId} if they could see the building but not unit */}
           <ArrowLeft className="mr-2 h-4 w-4" /> Back to Properties
         </Link>
       </Button>
     </div>
   );
 }


  const handleLogRepair = () => {
    router.push(`/properties/${buildingId}/${unitId}/log-repair`);
  };

  const handleUploadDocument = () => {
     router.push(`/properties/${buildingId}/${unitId}/upload-document`);
  };

  const handleAssignTenant = () => {
    if (unit && unit.status === 'vacant') {
      router.push(`/properties/${buildingId}/${unitId}/assign-tenant`);
    } else {
      toast({ title: "Unit Occupied", description: "This unit is already occupied or cannot be assigned a tenant."});
    }
  };
  
  const handleEditUnitDetails = () => {
    router.push(`/properties/${buildingId}/${unitId}/edit`);
  };

  const handleManageLease = () => {
    router.push(`/properties/${buildingId}/${unitId}/manage-lease`);
  };

  const handleMarkAsVacant = async () => {
    if (!unit || !unit.tenant) {
        toast({ variant: "destructive", title: "Error", description: "No tenant assigned to this unit." });
        return;
    }
    const tenantToUnassignId = unit.tenant.id;

    try {
      unassignTenantFromUnitInStore(unit.id);
      const currentTenant = getTenantById(tenantToUnassignId);
      if (currentTenant) {
        updateTenantInStore({
          id: tenantToUnassignId,
          unitId: '',
          unitNumber: '',
          buildingName: '',
        });
      }
      toast({
        title: "Tenant Unassigned",
        description: `Tenant has been unassigned and Unit ${unit.unitNumber} is now marked as vacant.`,
      });
    } catch (error) {
      console.error("Failed to unassign tenant:", error);
      toast({
        variant: "destructive",
        title: "Failed to Unassign Tenant",
        description: "An unexpected error occurred. Please try again.",
      });
    }
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
                      <Button variant="outline" size="sm" className="mt-4 flex items-center" onClick={handleAssignTenant}>
                        <UserPlus className="mr-2 h-4 w-4" /> Assign Tenant
                      </Button>
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
                    <Button variant="outline" className="w-full" onClick={handleEditUnitDetails}><Edit className="mr-2 h-4 w-4"/>Edit Unit Details</Button>
                    <Button variant="outline" className="w-full" onClick={handleManageLease} disabled={!tenant}><FileCog className="mr-2 h-4 w-4"/>Manage Lease</Button>
                    {unit.status === 'occupied' && tenant && (
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" className="w-full"><LogOut className="mr-2 h-4 w-4"/>Mark as Vacant / Unassign Tenant</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will unassign {tenant.name} from Unit {unit.unitNumber} and mark the unit as vacant. 
                                    This action cannot be undone easily from the UI.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleMarkAsVacant}>Confirm Unassign</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                     {unit.status === 'vacant' && (
                        <Button variant="default" className="w-full flex items-center" onClick={handleAssignTenant}>
                            <UserPlus className="mr-2 h-4 w-4" /> Assign Tenant to Unit
                        </Button>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
