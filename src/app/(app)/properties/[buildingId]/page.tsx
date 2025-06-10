
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { PageHeader } from '@/components/shared/PageHeader';
import { getBuildings } from '@/lib/propertyStore'; // Changed from mockData
import { mockUnits } from '@/lib/mockData'; // Units still from mockData for now
import type { Building, Unit } from '@/lib/types';
import { ArrowLeft, PlusCircle, Home, Users, BedDouble, Bath, DollarSign, Wrench } from 'lucide-react';

function UnitCard({ unit, buildingName }: { unit: Unit; buildingName: string }) {
  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-200">
      <CardHeader>
        <CardTitle className="font-headline text-lg">Unit {unit.unitNumber}</CardTitle>
        <CardDescription>{unit.status === 'occupied' ? `Occupied by ${unit.tenant?.name}` : 'Vacant'}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex items-center"><BedDouble className="h-4 w-4 mr-2 text-muted-foreground" /> {unit.bedrooms} Bedrooms</div>
        <div className="flex items-center"><Bath className="h-4 w-4 mr-2 text-muted-foreground" /> {unit.bathrooms} Bathrooms</div>
        <div className="flex items-center"><Home className="h-4 w-4 mr-2 text-muted-foreground" /> {unit.size}</div>
        <div className="flex items-center"><DollarSign className="h-4 w-4 mr-2 text-muted-foreground" /> ${unit.monthlyRent}/month</div>
      </CardContent>
      <CardFooter>
        <Button asChild variant="outline" className="w-full">
          <Link href={`/properties/${unit.buildingId}/${unit.id}`}>View Unit Details</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}


export default function BuildingDetailsPage() {
  const params = useParams();
  const buildingId = params.buildingId as string;
  
  const allBuildings = getBuildings();
  const building = allBuildings.find(b => b.id === buildingId);
  
  const unitsInBuilding = mockUnits.filter(u => u.buildingId === buildingId);

  if (!building) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-semibold">Building not found</h2>
        <Button asChild variant="link" className="mt-4">
          <Link href="/properties">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Properties
          </Link>
        </Button>
      </div>
    );
  }

  const totalRent = unitsInBuilding.reduce((sum, unit) => unit.status === 'occupied' ? sum + unit.monthlyRent : sum, 0);
  const occupancyRate = unitsInBuilding.length > 0 ? (unitsInBuilding.filter(u => u.status === 'occupied').length / unitsInBuilding.length) * 100 : 0;

  return (
    <div className="space-y-6">
      <PageHeader title={building.name} description={building.address}>
        <Button asChild variant="outline">
          <Link href="/properties">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Properties
          </Link>
        </Button>
      </PageHeader>

      <Card className="shadow-lg">
        <CardHeader className="relative h-64 md:h-80 rounded-t-lg overflow-hidden p-0">
           <Image src={building.imageUrl || 'https://placehold.co/1200x400.png'} alt={building.name} layout="fill" objectFit="cover" data-ai-hint="building panoramic" />
           <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
           <div className="absolute bottom-0 left-0 p-6">
             <h2 className="text-3xl font-headline font-bold text-white shadow-text">{building.name}</h2>
             <p className="text-gray-200 shadow-text">{building.address}</p>
           </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="text-sm font-medium text-muted-foreground">Total Units</h3>
              <p className="text-2xl font-semibold font-headline">{building.numberOfUnits}</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="text-sm font-medium text-muted-foreground">Occupancy</h3>
              <p className="text-2xl font-semibold font-headline">{occupancyRate.toFixed(1)}%</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="text-sm font-medium text-muted-foreground">Total Monthly Rent</h3>
              <p className="text-2xl font-semibold font-headline">${totalRent.toLocaleString()}</p>
            </div>
          </div>
          
          <Separator className="my-6" />

          <Tabs defaultValue="units" className="w-full">
            <div className="flex justify-between items-center mb-4">
              <TabsList>
                <TabsTrigger value="units">Units ({unitsInBuilding.length})</TabsTrigger>
                <TabsTrigger value="financials">Financials</TabsTrigger>
                <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
              </TabsList>
               <Button asChild size="sm" variant="outline">
                <Link href={`/properties/${building.id}/add-unit`}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Unit
                </Link>
              </Button>
            </div>
            
            <TabsContent value="units">
              {unitsInBuilding.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {unitsInBuilding.map(unit => (
                    <UnitCard key={unit.id} unit={unit} buildingName={building.name} />
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">No units found for this building.</p>
              )}
            </TabsContent>
            <TabsContent value="financials">
              <Card>
                <CardHeader><CardTitle className="font-headline">Financial Overview</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Detailed financial information for {building.name} will be displayed here, including income, expenses, and profitability.</p>
                  {/* Placeholder for financial charts/tables */}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="maintenance">
              <Card>
                <CardHeader><CardTitle className="font-headline">Maintenance Log</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">A log of all maintenance activities and repairs for units within {building.name}.</p>
                   {/* Placeholder for maintenance logs */}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
