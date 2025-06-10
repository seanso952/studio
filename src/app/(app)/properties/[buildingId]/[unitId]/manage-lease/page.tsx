
'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, FileCog } from 'lucide-react';

export default function ManageLeasePage() {
  const params = useParams();
  const buildingId = params.buildingId as string;
  const unitId = params.unitId as string;

  return (
    <div className="space-y-6">
      <PageHeader 
        title={`Manage Lease for Unit (ID: ${unitId})`}
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
          <CardTitle className="font-headline flex items-center">
            <FileCog className="mr-2 h-6 w-6 text-primary" />
            Manage Lease Agreement
          </CardTitle>
          <CardDescription>This section will allow lease management functionalities for this unit.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground py-4 text-center">
            Lease management form/options will be implemented here (e.g., renew lease, terminate, upload lease document).
          </p>
          {/* Placeholder for the actual form/options */}
        </CardContent>
      </Card>
    </div>
  );
}
