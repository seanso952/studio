
'use client';

import * as React from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getTenantById, subscribeToTenants } from '@/lib/tenantStore';
import type { Tenant } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FileText, CalendarRange, User, Home, DollarSign, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function TenantContractPage() {
  const tenantIdForPortal = 'tenant1';
  const [tenant, setTenant] = React.useState<Tenant | undefined>(() => getTenantById(tenantIdForPortal));

  const updateTenantData = React.useCallback(() => {
    setTenant(getTenantById(tenantIdForPortal));
  }, [tenantIdForPortal]);

  React.useEffect(() => {
    updateTenantData();
    const unsubscribe = subscribeToTenants(updateTenantData);
    return () => {
      unsubscribe();
    };
  }, [updateTenantData]);

  if (!tenant) {
    return (
      <div className="space-y-6">
        <PageHeader title="My Contract" description="Details of your lease agreement." />
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Contract data could not be loaded. Please try again later or contact support.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="My Contract" description={`Lease agreement for ${tenant.buildingName} - Unit ${tenant.unitNumber}`}>
         <Button variant="outline" asChild>
          <Link href="/portal/dashboard">Back to Dashboard</Link>
        </Button>
      </PageHeader>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-2xl flex items-center"><FileText className="mr-3 h-7 w-7 text-primary" />Lease Agreement Details</CardTitle>
          <CardDescription>This information is based on your current active lease agreement.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6 text-sm">
            <InfoItem icon={User} label="Tenant Name" value={tenant.name} />
            <InfoItem icon={Home} label="Property / Unit" value={`${tenant.buildingName} / Unit ${tenant.unitNumber}`} />
            <InfoItem icon={CalendarRange} label="Contract Period" value={`${format(new Date(tenant.contractStartDate), 'MMMM d, yyyy')} - ${format(new Date(tenant.contractEndDate), 'MMMM d, yyyy')}`} />
            <InfoItem icon={DollarSign} label="Monthly Rent" value={`$${tenant.rentAmount.toLocaleString()}`} />
            <InfoItem label="Tenant Type" value={tenant.tenantType === 'receipted' ? 'Receipted (Requires Form 2307)' : 'Non-Receipted'} />
            <InfoItem label="Outstanding Balance" value={`$${tenant.outstandingBalance.toLocaleString()}`} classNameValue={tenant.outstandingBalance > 0 ? 'text-destructive font-semibold' : 'text-green-600 font-semibold'} />
             {tenant.lastPaymentDate && <InfoItem label="Last Payment Date" value={format(new Date(tenant.lastPaymentDate), 'MMMM d, yyyy')} />}
          </div>
          
          <div className="pt-4 border-t">
            <h3 className="text-lg font-semibold mb-2">Important Clauses (Sample)</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Security deposit: $ {tenant.rentAmount.toLocaleString()}.</li>
              <li>Late payment fee: 5% of monthly rent after 5 days past due.</li>
              <li>Pets: Allowed with prior approval and pet deposit.</li>
              <li>Maintenance: Tenant responsible for minor repairs, landlord for major.</li>
            </ul>
            <p className="mt-4 text-xs text-muted-foreground">
              Note: This is a summary. For full details, please refer to your signed lease agreement document. 
              You can request a copy from the administration if needed.
            </p>
          </div>
        </CardContent>
      </Card>
       <Card className="shadow-lg mt-6"> {/* Added mt-6 for spacing from previous card */}
        <CardHeader>
          <CardTitle className="font-headline">Form 2307 Submissions</CardTitle>
          <CardDescription>If you are a receipted tenant, your submitted Form 2307s are listed here.</CardDescription>
        </CardHeader>
        <CardContent>
           {tenant.tenantType !== 'receipted' ? (
             <p className="text-muted-foreground text-center py-4">You are a non-receipted tenant and do not submit Form 2307.</p>
           ) : tenant.documents2307.length > 0 ? (
            <ul className="space-y-2">
              {tenant.documents2307.map(doc => (
                <li key={doc.id} className="flex justify-between items-center p-3 border rounded-md">
                  <div>
                    <p className="font-medium">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">Submitted: {format(new Date(doc.submissionDate), 'MMM d, yyyy')}</p>
                  </div>
                  <Button variant="link" size="sm" asChild>
                    <a href={doc.url} target="_blank" rel="noopener noreferrer">View Document</a>
                  </Button>
                </li>
              ))}
            </ul>
           ) : (
             <p className="text-muted-foreground text-center py-4">No Form 2307 submissions found for your account.</p>
           )}
        </CardContent>
      </Card>
    </div>
  );
}

interface InfoItemProps {
  icon?: React.ElementType;
  label: string;
  value: string | number;
  classNameValue?: string;
}
const InfoItem: React.FC<InfoItemProps> = ({ icon: Icon, label, value, classNameValue }) => (
  <div className="flex items-start space-x-3">
    {Icon && <Icon className="h-5 w-5 mt-0.5 text-primary flex-shrink-0" />}
    <div>
      <p className="font-medium text-muted-foreground">{label}</p>
      <p className={cn("text-foreground", classNameValue)}>{value}</p>
    </div>
  </div>
);
