
'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Construction } from 'lucide-react';

export default function LogRepairPage() {
  const params = useParams();
  const buildingId = params.buildingId as string;
  const unitId = params.unitId as string;

  return (
    <div className="space-y-6">
      <PageHeader 
        title={`Log Repair for Unit (ID: ${unitId})`}
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
            <Construction className="mr-2 h-6 w-6 text-primary" />
            Log New Repair
          </CardTitle>
          <CardDescription>This form will allow you to log repair details for this unit.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground py-4 text-center">
            Repair logging form will be implemented here.
          </p>
          {/* Placeholder for the actual form */}
        </CardContent>
      </Card>
    </div>
  );
}
