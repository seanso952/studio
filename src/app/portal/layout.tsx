
'use client';

import * as React from 'react';
// import type { Metadata } from 'next'; // Metadata can't be dynamic in client components easily
import Link from 'next/link';
import { Landmark, UserCircle, FileText, UploadCloud, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getTenantById, subscribeToTenants } from '@/lib/tenantStore';
import type { Tenant } from '@/lib/types';

// export const metadata: Metadata = {
//   title: 'Tenant Portal',
//   description: 'Manage your tenancy agreement and payments.',
// };

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tenantIdForPortal = 'tenant1'; // Alice Wonderland
  const [tenant, setTenant] = React.useState<Tenant | undefined>(() => getTenantById(tenantIdForPortal));

  const updateTenantData = React.useCallback(() => {
    setTenant(getTenantById(tenantIdForPortal));
  }, [tenantIdForPortal]);

  React.useEffect(() => {
    updateTenantData(); // Call to set initial/updated data
    const unsubscribe = subscribeToTenants(updateTenantData);
    return () => {
      unsubscribe();
    };
  }, [updateTenantData]);

  const tenantName = tenant ? tenant.name : "Tenant"; 

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-40 w-full border-b bg-card shadow-sm">
        <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0 px-4 md:px-6">
          <Link href="/portal/dashboard" className="flex items-center gap-2">
            <Landmark className="h-7 w-7 text-primary" />
            <span className="text-xl font-headline font-semibold text-foreground">Tenant Portal</span>
          </Link>
          <nav className="hidden md:flex items-center space-x-2">
            <Button variant="ghost" asChild>
              <Link href="/portal/dashboard">Dashboard</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/portal/contract">My Contract</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/portal/payments/upload">Upload Payment</Link>
            </Button>
          </nav>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground hidden sm:inline">Welcome, {tenantName}!</span>
            <Button variant="outline" size="sm" asChild>
              <Link href="/logout">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1 container py-6 md:py-8 px-4 md:px-6">
        {children}
      </main>
      <footer className="py-6 md:px-6 md:py-4 border-t bg-muted/50">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-12 md:flex-row">
          <p className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-left">
            &copy; {new Date().getFullYear()} EstateMind. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
