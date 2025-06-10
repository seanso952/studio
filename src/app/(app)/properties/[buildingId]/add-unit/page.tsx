
'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { getBuildings } from '@/lib/propertyStore';

export default function AddUnitPage() {
  const params = useParams();
  const buildingId = params.buildingId as string;
  
  const allBuildings = getBuildings();
  const building = allBuildings.find(b => b.id === buildingId);

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
          <CardDescription>
            This is a placeholder page for adding a new unit.
            The actual form will be implemented here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Unit form fields (e.g., Unit Number, Size, Bedrooms, Bathrooms, Monthly Rent) would go here.
          </p>
          {/* Placeholder for the actual form */}
        </CardContent>
      </Card>
    </div>
  );
}
