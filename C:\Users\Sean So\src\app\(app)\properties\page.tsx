
'use client';

import Link from 'next/link';
import Image from 'next/image';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/PageHeader';
import { getBuildings, subscribeToBuildings } from '@/lib/propertyStore'; 
import type { Building } from '@/lib/types';
import { PlusCircle, MapPin, Users, Home, Loader2 } from 'lucide-react';
import { getCurrentUser, subscribeToUserChanges } from '@/lib/authStore';
import type { AppUser } from '@/lib/types';

function PropertyCard({ building }: { building: Building }) {
  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
      <CardHeader className="p-0">
        <div className="aspect-[16/9] relative w-full">
          <Image
            src={building.imageUrl || 'https://placehold.co/600x400.png'}
            alt={building.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
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
  const [allBuildings, setAllBuildings] = React.useState<Building[]>([]);
  const [currentUser, setCurrentUserLocal] = React.useState<AppUser | null>(null);

  React.useEffect(() => {
    const updateUser = () => setCurrentUserLocal(getCurrentUser());
    updateUser();
    const unsubscribeUser = subscribeToUserChanges(updateUser);
    
    const updateBuildings = () => setAllBuildings(getBuildings());
    updateBuildings();
    const unsubscribeBuildings = subscribeToBuildings(updateBuildings);
    
    return () => {
      unsubscribeUser();
      unsubscribeBuildings();
    };
  }, []);

  if (!currentUser) {
    return (
      <div className="flex h-[calc(100vh-theme(spacing.14))] w-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="ml-2">Loading properties...</p>
      </div>
    );
  }

  const buildingsToDisplay = currentUser.role === 'manager'
    ? allBuildings.filter(b => currentUser.assignedBuildingIds?.includes(b.id))
    : allBuildings;
  
  const pageTitle = currentUser.role === 'manager' ? "My Assigned Properties" : "All Properties";
  const pageDescription = currentUser.role === 'manager' ? "Manage properties assigned to you." : "Manage all your real estate properties.";

  return (
    <div className="space-y-6">
      <PageHeader title={pageTitle} description={pageDescription}>
        {currentUser.role === 'admin' && (
          <Button asChild>
            <Link href="/properties/add">
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Property
            </Link>
          </Button>
        )}
      </PageHeader>

      {buildingsToDisplay.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {buildingsToDisplay.map((building) => (
            <PropertyCard key={building.id} building={building} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">
              {currentUser.role === 'manager' ? "No properties are currently assigned to you." : "No properties found. Add your first property to get started."}
            </p>
            {currentUser.role === 'admin' && (
              <Button asChild className="mt-4">
                <Link href="/properties/add">
                  <PlusCircle className="mr-2 h-4 w-4" /> Add New Property
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
