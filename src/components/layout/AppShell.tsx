
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
  Loader2,
  UserCog,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCurrentUser, logoutFirebaseUser, subscribeToUserChanges } from '@/lib/authStore';
import type { AppUser } from '@/lib/types';
import { auth } from '@/lib/firebaseConfig';

const navItemsBase = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/properties', label: 'Properties', icon: Building2 },
  { href: '/tenants', label: 'Tenants', icon: Users },
  { href: '/payments', label: 'Payments & Bills', icon: CreditCard },
  { href: '/documents', label: 'Documents', icon: FileText },
];

const adminOnlyNavItems = [
  { href: '/users', label: 'User Management', icon: UserCog },
  { href: '/contract-analysis', label: 'Contract Analysis', icon: FileClock },
];


export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [appUser, setAppUserLocal] = React.useState<AppUser | null>(getCurrentUser()); // Changed variable name
  const [authLoading, setAuthLoading] = React.useState(true);


  React.useEffect(() => {
    const unsubscribe = subscribeToUserChanges(() => {
      const user = getCurrentUser();
      setAppUserLocal(user); // Changed variable name
      setAuthLoading(false); 

      if (!user && pathname !== '/login' && pathname !== '/logout') {
        router.push('/login');
      }
    });
    
    // Initial check
    const initialUser = getCurrentUser();
    setAppUserLocal(initialUser); // Changed variable name
    if (auth && auth.currentUser === null && !initialUser) {
      // Only set loading to false if we are sure auth state is resolved (no user)
      setAuthLoading(false);
       if (pathname !== '/login' && pathname !== '/logout') router.push('/login');
    } else if (initialUser) {
      setAuthLoading(false); // User is already known
    }
    // If !auth (Firebase not initialized), authLoading will also be set to false by the first subscription callback

    return () => unsubscribe();
  }, [pathname, router]);

  const handleLogout = async () => {
    await logoutFirebaseUser();
    // Redirection to /logout or /login will be handled by the effect above
  };

   const handleRoleSwitchSimulate = (rolePath: string) => {
    // This simulation logic might need refinement based on real custom claims behavior
    if (rolePath === '/portal/dashboard' && appUser?.role !== 'tenant') { // Changed variable name
        alert("To access the tenant portal, please log in with a tenant account (e.g., one with a 'tenant' custom claim).");
        return;
    }
    if (appUser?.role === 'tenant' && rolePath === '/dashboard'){ // Changed variable name
        alert("Tenants cannot access the admin/manager dashboard. Please log out and log in with an admin/manager account.");
        return;
    }
    router.push(rolePath);
  };
  
  let navItems = navItemsBase;
  if (appUser?.role === 'admin') { // Changed variable name
    navItems = [...navItemsBase, ...adminOnlyNavItems];
  } else if (appUser?.role === 'manager') { // Changed variable name
    navItems = navItemsBase.map(item => item.href === '/properties' ? {...item, label: 'My Properties'} : item);
  }


  if (authLoading && pathname !== '/login' && pathname !== '/logout') {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="ml-2">Authenticating...</p>
      </div>
    );
  }

  // If not loading and no user, and not on login/logout page, redirect.
  // This check is now primarily handled by the effect, but good as a fallback.
  if (!authLoading && !appUser && pathname !== '/login' && pathname !== '/logout') { // Changed variable name
     if (typeof window !== 'undefined') router.push('/login'); // Ensure router.push only runs client-side
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <p>Redirecting to login...</p>
        </div>
    );
  }
  
  // For login page itself, or if user is not yet available but we are loading.
  if (!appUser && (pathname === '/login' || pathname === '/logout')) { // Changed variable name
    return <>{children}</>; // Render login/logout page without AppShell
  }
  
  // If user is available, render AppShell
  if (appUser) { // Changed variable name
    return (
      <SidebarProvider defaultOpen>
        <div className="flex min-h-screen">
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
                      <AvatarImage src={`https://placehold.co/100x100.png?text=${(appUser.name || 'U').substring(0,2)}`} alt={appUser.name || 'User'} data-ai-hint="user avatar"/>
                      <AvatarFallback>{(appUser.name || 'U').substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="ml-2 group-data-[collapsible=icon]:hidden">{appUser.name || 'User'} ({appUser.role || 'No Role'})</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="right" align="start" className="w-56">
                  <DropdownMenuLabel>Switch View / Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleRoleSwitchSimulate('/dashboard')} disabled={appUser.role === 'admin' || appUser.role === 'manager'}>
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    <span>Admin/Manager View</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleRoleSwitchSimulate('/portal/dashboard')} disabled={appUser.role === 'tenant'}>
                    <UserSquare className="mr-2 h-4 w-4" />
                    <span>Tenant Portal View</span>
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

          <SidebarInset className={cn(
              "flex-1 flex flex-col",
              "bg-background" 
          )}>
            <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-card px-6 shadow-sm">
              <SidebarTrigger className="md:hidden" />
              <div className="flex-1">
              </div>
            </header>
            <main className={cn(
              "flex-1 overflow-y-auto",
              "p-4 md:p-6 lg:p-8" 
              )}>
              {children}
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }
  // Fallback for when auth is loading or no user and on login/logout page.
  // This state should ideally be covered by the authLoading check or initial redirect.
  return <>{children}</>;
}
