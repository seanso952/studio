
'use client';

import Link from 'next/link';
import Image from 'next/image';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/PageHeader';
import { getBuildings, subscribeToBuildings } from '@/lib/propertyStore'; // Import store functions
import type { Building } from '@/lib/types';
import { PlusCircle, MapPin, Users, Home } from 'lucide-react';

function PropertyCard({ building }: { building: Building }) {
  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
      <CardHeader className="p-0">
        <div className="aspect-[16/9] relative w-full">
          <Image
            src={building.imageUrl || 'https://placehold.co/600x400.png'}
            alt={building.name}
            layout="fill"
            objectFit="cover"
            data-ai-hint="building exterior"
          />
        </div>
      </CardHeader>
      <CardContent className="p-6 flex-grow">
        <CardTitle className="text-xl font-headline mb-2">{building.name}</CardTitle>
        <div className="text-sm text-muted-foreground space-y-2">
          <div className="flex items-center">
            <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
            <span>{building.address}</span>
          </div>
          <div className="flex items-center">
            <Home className="h-4 w-4 mr-2 flex-shrink-0" />
            <span>{building.numberOfUnits} Units</span>
          </div>
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-2 flex-shrink-0" />
            <span>{building.occupiedUnits} Occupied ({((building.occupiedUnits / building.numberOfUnits) * 100 || 0).toFixed(0)}%)</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-6 bg-muted/30">
        <Button asChild className="w-full">
          <Link href={`/properties/${building.id}`}>View Details</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function PropertiesPage() {
  // Initialize state with a function to get initial buildings only once
  const [buildings, setBuildings] = React.useState<Building[]>(() => getBuildings());

  React.useEffect(() => {
    const unsubscribe = subscribeToBuildings(() => {
      setBuildings(getBuildings()); // Update state when store changes
    });
    
    // It's good practice to also fetch the latest state right after subscribing,
    // in case the store was updated between the initial useState and the effect running.
    // However, this might be redundant if subscribeToBuildings immediately calls back
    // or if the initial useState(() => getBuildings()) is sufficient.
    // For robustness in case of timing issues:
    setBuildings(getBuildings());


    return () => unsubscribe(); // Cleanup subscription on component unmount
  }, []); // Empty dependency array ensures this runs once on mount

  return (
    <div className="space-y-6">
      <PageHeader title="Properties" description="Manage all your real estate properties.">
        <Button asChild>
          <Link href="/properties/add">
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Property
          </Link>
        </Button>
      </PageHeader>

      {buildings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {buildings.map((building) => (
            <PropertyCard key={building.id} building={building} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">No properties found. Add your first property to get started.</p>
            <Button asChild className="mt-4">
              <Link href="/properties/add">
                <PlusCircle className="mr-2 h-4 w-4" /> Add New Property
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
