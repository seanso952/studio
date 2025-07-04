
'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { mockBuildings, mockTenants, mockBillPayments, mockBouncedChecks } from "@/lib/mockData";
import { Building2, Users, AlertTriangle, FileWarning, ArrowRight, DollarSign, CalendarClock, UploadCloud, Briefcase, Loader2 } from "lucide-react";
import Image from "next/image";
import { getCurrentUser, subscribeToUserChanges, type AppUser } from '@/lib/authStore'; // Changed MockAuthUser to AppUser
import { PageHeader } from '@/components/shared/PageHeader';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description?: string;
  link?: string;
  linkLabel?: string;
  color?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, description, link, linkLabel, color = "text-primary" }) => (
  <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className={`h-5 w-5 ${color}`} />
    </CardHeader>
    <CardContent>
      <div className={`text-2xl font-bold font-headline ${color}`}>{value}</div>
      {description && <p className="text-xs text-muted-foreground pt-1">{description}</p>}
      {link && linkLabel && (
        <Button variant="link" asChild className="px-0 pt-2 text-sm text-accent">
          <Link href={link} className="flex items-center">
            {linkLabel} <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      )}
    </CardContent>
  </Card>
);


export default function DashboardPage() {
  const [currentUser, setCurrentUserLocal] = React.useState<AppUser | null>(getCurrentUser());

  React.useEffect(() => {
    const updateUser = () => setCurrentUserLocal(getCurrentUser());
    updateUser();
    const unsubscribe = subscribeToUserChanges(updateUser);
    return () => unsubscribe();
  }, []);

  if (!currentUser) {
    return (
      <div className="flex h-[calc(100vh-theme(spacing.14))] w-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="ml-2">Loading dashboard...</p>
      </div>
    );
  }

  const buildingsToDisplay = currentUser.role === 'manager' 
    ? mockBuildings.filter(b => currentUser.assignedBuildingIds?.includes(b.id)) 
    : mockBuildings;

  const tenantsToDisplay = currentUser.role === 'manager'
    ? mockTenants.filter(t => buildingsToDisplay.some(b => b.name === t.buildingName))
    : mockTenants;

  const totalProperties = buildingsToDisplay.length;
  const totalTenants = tenantsToDisplay.length;
  
  const upcomingRenewals = tenantsToDisplay.filter(t => {
    const endDate = new Date(t.contractEndDate);
    const today = new Date();
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(today.getMonth() + 3);
    return endDate > today && endDate <= threeMonthsFromNow;
  }).length;

  const paymentsToConsider = currentUser.role === 'manager'
    ? mockBillPayments.filter(p => buildingsToDisplay.some(b => b.name === p.buildingName))
    : mockBillPayments;
  
  const pendingPayments = paymentsToConsider.filter(p => p.status === 'pending').length;
  
  const bouncedChecksToConsider = currentUser.role === 'manager'
    ? mockBouncedChecks.filter(bc => buildingsToDisplay.some(b => b.name === bc.buildingName))
    : mockBouncedChecks;
  const bouncedChecksCount = bouncedChecksToConsider.length;

  const totalIncome = buildingsToDisplay.reduce((sum, building) => sum + (building.totalIncome || 0), 0);

  const recentActivities = [
    { type: "New Tenant", description: "John Doe moved into Unit 3B, Downtown Lofts", time: "2 hours ago" },
    { type: "Payment Approved", description: "Alice Wonderland's electricity bill approved", time: "5 hours ago" },
    { type: "Repair Logged", description: "Plumbing issue in Unit 1A, Sunset Apts.", time: "1 day ago" },
  ];
  
  const criticalAlerts = [
    { id: "alert1", message: "Contract for Unit 1B (Charlie Brown) expiring in 2 weeks.", severity: "high" },
    { id: "alert2", message: "Bounced check from Bob The Builder needs follow-up.", severity: "medium" },
  ].filter(alert => { // Basic filter, could be more sophisticated
    if (currentUser.role === 'manager') {
      // Ensure currentUser and assignedBuildingIds are checked
      return alert.message.includes("Unit 1B") && currentUser.assignedBuildingIds?.includes('building1'); // Example
    }
    return true;
  });

  const pageTitle = currentUser.role === 'manager' ? "Manager Dashboard" : "Admin Dashboard";
  const pageDescription = currentUser.role === 'manager' ? `Welcome, ${currentUser.name || 'Manager'}! Overview of your assigned properties.` : "Welcome to EstateMind Admin Panel";


  return (
    <div className="space-y-6">
      <PageHeader title={pageTitle} description={pageDescription} />
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Total Properties" value={totalProperties} icon={currentUser.role === 'manager' ? Briefcase : Building2} link="/properties" linkLabel="View Properties" />
        <StatCard title="Total Tenants" value={totalTenants} icon={Users} link="/tenants" linkLabel="Manage Tenants" />
        <StatCard title="Monthly Income" value={`$${totalIncome.toLocaleString()}`} icon={DollarSign} description="Estimated current monthly rent" color="text-green-600" />
        <StatCard title="Upcoming Renewals" value={upcomingRenewals} icon={CalendarClock} description="Contracts expiring in next 3 months" link="/tenants" linkLabel="View Contracts" color="text-orange-500" />
        <StatCard title="Pending Bill Approvals" value={pendingPayments} icon={FileWarning} link="/payments?tab=approval" linkLabel="Review Payments" color="text-blue-500" />
        <StatCard title="Bounced Checks" value={bouncedChecksCount} icon={AlertTriangle} link="/payments?tab=bounced" linkLabel="Track Checks" color="text-red-600" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline">Quick Links</CardTitle>
            <CardDescription>Fast access to common tasks.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Button asChild variant="outline"><Link href="/properties/add">Add New Property</Link></Button>
            <Button asChild variant="outline"><Link href="/tenants/add">Add New Tenant</Link></Button>
            <Button asChild variant="outline"><Link href="/payments?tab=overview">Log a Payment</Link></Button>
            <Button asChild variant="outline"><Link href="/documents/upload">Upload Document</Link></Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline">Recent Properties</CardTitle>
            <CardDescription>Your most recently managed properties.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {buildingsToDisplay.slice(0, 3).map(building => (
              <Link href={`/properties/${building.id}`} key={building.id} className="block hover:bg-muted/50 p-3 rounded-md transition-colors">
                <div className="flex items-center gap-3">
                  <Image src={building.imageUrl || "https://placehold.co/80x80.png"} alt={building.name} width={60} height={60} className="rounded-md" data-ai-hint="building exterior" />
                  <div>
                    <h3 className="font-semibold text-foreground">{building.name}</h3>
                    <p className="text-sm text-muted-foreground">{building.address}</p>
                  </div>
                </div>
              </Link>
            ))}
             {buildingsToDisplay.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No properties assigned or found.</p>}
          </CardContent>
        </Card>
      </div>
       <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline">Critical Alerts</CardTitle>
            <CardDescription>Important items requiring your attention.</CardDescription>
          </CardHeader>
          <CardContent>
            {criticalAlerts.length > 0 ? (
              <ul className="space-y-3">
                {criticalAlerts.map(alert => (
                  <li key={alert.id} className={`p-3 rounded-md flex items-start gap-3 ${alert.severity === 'high' ? 'bg-destructive/10 border-l-4 border-destructive' : 'bg-orange-500/10 border-l-4 border-orange-500'}`}>
                    <AlertTriangle className={`h-5 w-5 mt-0.5 ${alert.severity === 'high' ? 'text-destructive' : 'text-orange-600'}`} />
                    <p className="text-sm text-foreground">{alert.message}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No critical alerts at the moment.</p>
            )}
          </CardContent>
        </Card>
    </div>
  );
}
