
'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, FileText } from 'lucide-react';
import { getTenantById } from '@/lib/tenantStore';
import * as React from 'react';
import type { Tenant } from '@/lib/types';

export default function ViewTenantLeasePage() {
  const params = useParams();
  const tenantId = params.tenantId as string;
  const [tenant, setTenant] = React.useState<Tenant | undefined>(undefined);

  React.useEffect(() => {
    setTenant(getTenantById(tenantId));
  }, [tenantId]);

  return (
    <div className="space-y-6">
      <PageHeader 
        title={`Lease Agreement for ${tenant?.name || 'Tenant'}`}
        description={`Tenant ID: ${tenantId}`}
      >
        <Button asChild variant="outline">
          <Link href={`/tenants/${tenantId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Tenant Profile
          </Link>
        </Button>
      </PageHeader>

      <Card className="max-w-2xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline flex items-center">
            <FileText className="mr-2 h-6 w-6 text-primary" />
            Lease Document
          </CardTitle>
          <CardDescription>Details of the lease agreement for this tenant.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground py-4 text-center">
            The lease document viewer or details for {`'${tenant?.name}'s'` || 'the tenant\'s'} lease will be displayed here.
          </p>
          {/* Placeholder for lease document or details */}
        </CardContent>
      </Card>
    </div>
  );
}
