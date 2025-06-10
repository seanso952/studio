
// @/components/layout/AppShell.tsx
"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import * as React from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  FileText,
  FileClock,
  Settings,
  LogOut,
  Landmark,
  UserSquare,
  ShieldCheck,
  Briefcase,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCurrentUser, logoutFirebaseUser, subscribeToUserChanges, type MockAuthUser } from '@/lib/authStore';

const navItemsAdmin = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/properties', label: 'Properties', icon: Building2 },
  { href: '/tenants', label: 'Tenants', icon: Users },
  { href: '/payments', label: 'Payments & Bills', icon: CreditCard },
  { href: '/documents', label: 'Documents', icon: FileText },
  { href: '/contract-analysis', label: 'Contract Analysis', icon: FileClock },
];

const navItemsManager = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/properties', label: 'My Properties', icon: Building2 },
  { href: '/tenants', label: 'Tenants', icon: Users },
  { href: '/payments', label: 'Payments & Bills', icon: CreditCard },
  { href: '/documents', label: 'Documents', icon: FileText },
];


export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUserLocal] = React.useState<MockAuthUser | null>(getCurrentUser());
  const [authLoading, setAuthLoading] = React.useState(true);


  React.useEffect(() => {
    const unsubscribe = subscribeToUserChanges(() => {
      const user = getCurrentUser();
      setCurrentUserLocal(user);
      setAuthLoading(false); // Auth state confirmed

      if (!user && pathname !== '/login') {
        router.push('/login');
      }
    });
    
    // Initial check in case subscription fires after first render
    if (getCurrentUser() === null && typeof window !== 'undefined' && auth.currentUser === null) {
       setAuthLoading(false);
       if (pathname !== '/login') router.push('/login');
    }


    return () => unsubscribe();
  }, [pathname, router]);

  const handleLogout = async () => {
    await logoutFirebaseUser();
    // onAuthStateChanged in authStore will push to /login via the useEffect above
  };

  // Simulating role switch for dev by just navigating, actual role comes from logged in user
   const handleRoleSwitchSimulate = (rolePath: string) => {
    if (rolePath === '/portal/dashboard' && currentUser?.role !== 'tenant') {
        alert("Please login with a tenant account (e.g. alice@example.com) to access the tenant portal.");
        return;
    }
    if (currentUser?.role === 'tenant' && rolePath === '/dashboard'){
        alert("Tenants cannot access the admin/manager dashboard. Please log out and log in with an admin/manager account.");
        return;
    }
    router.push(rolePath);
  };
  
  const navItems = currentUser?.role === 'manager' ? navItemsManager : navItemsAdmin;

  if (authLoading && pathname !== '/login') {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="ml-2">Loading authentication...</p>
      </div>
    );
  }

  if (!currentUser && pathname !== '/login') {
    // Should be caught by useEffect, but as a fallback
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <p>Redirecting to login...</p>
        </div>
    );
  }
  
  // If user is not authenticated and is not on login page, AppShell contents are not rendered
  // The useEffect above handles the redirect.
  // If user is authenticated OR is on the login page, render the shell or children.
  if (!currentUser && pathname !== '/login') {
    return null; // Or a minimal loader, but redirect should handle it
  }


  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen">
        {currentUser && pathname !== '/login' && ( // Only show sidebar if logged in and not on login page
          <Sidebar variant="sidebar" collapsible="icon" className="border-r">
            <SidebarHeader className="p-4 flex items-center gap-2">
              <Link href="/dashboard" className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
                <Landmark className="h-7 w-7 text-primary group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8" />
                <h1 className="text-xl font-headline font-semibold group-data-[collapsible=icon]:hidden">EstateMind</h1>
              </Link>
            </SidebarHeader>
            <SidebarContent className="flex-1 overflow-y-auto">
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))}
                      tooltip={{ children: item.label, className: "font-body" }}
                      className={cn(
                        (pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href)))
                        ? 'bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90'
                        : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                        'justify-start group-data-[collapsible=icon]:justify-center'
                      )}
                    >
                      <Link href={item.href}>
                        <item.icon className="h-5 w-5" />
                        <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarContent>
            <SidebarFooter className="p-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start p-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:aspect-square">
                    <Avatar className="h-8 w-8 group-data-[collapsible=icon]:h-7 group-data-[collapsible=icon]:w-7">
                      <AvatarImage src={`https://placehold.co/100x100.png?text=${currentUser.name.substring(0,2)}`} alt={currentUser.name} data-ai-hint="user avatar"/>
                      <AvatarFallback>{currentUser.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="ml-2 group-data-[collapsible=icon]:hidden">{currentUser.name} ({currentUser.role})</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="right" align="start" className="w-56">
                  <DropdownMenuLabel>Switch View / Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleRoleSwitchSimulate('/dashboard')} disabled={currentUser.role === 'admin'}>
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    <span>Admin Dashboard</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleRoleSwitchSimulate('/dashboard')} disabled={currentUser.role === 'manager'}>
                    <Briefcase className="mr-2 h-4 w-4" />
                    <span>Manager Dashboard</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleRoleSwitchSimulate('/portal/dashboard')}>
                    <UserSquare className="mr-2 h-4 w-4" />
                    <span>Tenant Portal</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem disabled>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarFooter>
          </Sidebar>
        )}

        <SidebarInset className={cn(
            "flex-1 flex flex-col",
            (!currentUser || pathname === '/login') ? "bg-muted/40" : "bg-background" // Full width if not logged in or on login page
        )}>
          {currentUser && pathname !== '/login' && ( // Only show header if logged in and not on login page
            <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-card px-6 shadow-sm">
              <SidebarTrigger className="md:hidden" />
              <div className="flex-1">
                {/* Could add breadcrumbs or page title here */}
              </div>
            </header>
          )}
          <main className={cn(
            "flex-1 overflow-y-auto",
            (currentUser && pathname !== '/login') ? "p-4 md:p-6 lg:p-8" : "" // No padding if login page
            )}>
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
