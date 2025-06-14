
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
import { auth } from '@/lib/firebaseConfig'; // Import auth for explicit check

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
  const [appUser, setAppUserLocal] = React.useState<AppUser | null>(null);
  const [authLoading, setAuthLoading] = React.useState(true);


  React.useEffect(() => {
    const initialUserFromStore = getCurrentUser();
    if (initialUserFromStore) {
      setAppUserLocal(initialUserFromStore);
      setAuthLoading(false); 
    }

    const unsubscribe = subscribeToUserChanges(() => {
      const user = getCurrentUser();
      console.log('AppShell: User state updated via subscription. User:', user ? user.email : 'null', 'Role:', user?.role);
      setAppUserLocal(user);
      setAuthLoading(false);

      if (!auth) {
          console.error("AppShell: Firebase Auth service is not available. Redirecting to login.");
          if (pathname !== '/login' && pathname !== '/logout') {
            router.push('/login');
          }
          return;
      }
      
      if (!user && pathname !== '/login' && pathname !== '/logout') {
        console.log('AppShell: No user from subscription, redirecting to /login.');
        router.push('/login');
      }
    });

    // Initial check after mount for scenarios where store might not be populated yet
    // but Firebase Auth object might be.
    if (!initialUserFromStore) {
      if (auth && auth.currentUser) {
        // If auth.currentUser exists but store is null, onAuthStateChanged should soon update the store.
        // We set authLoading to false if it's clear there's no user, or wait for onAuthStateChanged.
        console.log('AppShell: auth.currentUser exists on mount, waiting for authStore update.');
        // authLoading remains true, allowing onAuthStateChanged to populate and then setAuthLoading(false)
      } else {
         // No user in Firebase (auth.currentUser is null) or auth service unavailable, and not in local store
         setAuthLoading(false); 
         if (pathname !== '/login' && pathname !== '/logout') {
            console.log('AppShell: No initial user from store or Firebase (auth.currentUser is null). Redirecting to /login.');
            router.push('/login');
         }
      }
    }

    return () => unsubscribe();
  }, [pathname, router]); 

  const handleLogout = async () => {
    await logoutFirebaseUser();
    router.push('/logout'); 
  };

   const handleRoleSwitchSimulate = (rolePath: string) => {
    // This is purely for simulating UI, actual access is controlled by role
    if (rolePath === '/portal/dashboard' && appUser?.role !== 'tenant') {
        alert("To access the tenant portal, please log in with a tenant account (e.g., one with a 'tenant' custom claim). This button is for UI simulation.");
        return;
    }
    if ((rolePath === '/dashboard') && appUser?.role === 'tenant'){
        alert("Tenants cannot access the admin/manager dashboard. Please log out and log in with an admin/manager account. This button is for UI simulation.");
        return;
    }
    router.push(rolePath);
  };

  let navItems = navItemsBase;
  if (appUser?.role === 'admin') {
    navItems = [...navItemsBase, ...adminOnlyNavItems];
  } else if (appUser?.role === 'manager') {
    navItems = navItemsBase.map(item => item.href === '/properties' ? {...item, label: 'My Properties'} : item);
  }


  if (authLoading && pathname !== '/login' && pathname !== '/logout') {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Authenticating...</p>
      </div>
    );
  }

  if (!appUser && pathname !== '/login' && pathname !== '/logout') {
    // This case indicates that authLoading is false, and appUser is still null.
    // The useEffect should have redirected. If somehow reached, show loading or redirect.
     console.log('AppShell: Render - No appUser and not on login/logout. Redirecting again or showing loader.');
    return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="ml-2 text-muted-foreground">Redirecting to login...</p>
        </div>
    );
  }
  
  if (!appUser && (pathname === '/login' || pathname === '/logout')) {
    return <>{children}</>; 
  }
  
  // If appUser is null here, it means we are on /login or /logout and should render children without AppShell
  if (!appUser) {
    return <>{children}</>;
  }


  // If user is available, render AppShell
  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen">
        <Sidebar variant="sidebar" collapsible="icon" className="border-r bg-sidebar text-sidebar-foreground">
          <SidebarHeader className="p-4 flex items-center gap-2">
            <Link href="/dashboard" className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
              <Landmark className="h-7 w-7 text-primary group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8" />
              <h1 className="text-xl font-headline font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">EstateMind</h1>
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
          <SidebarFooter className="p-2 border-t border-sidebar-border">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start p-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:aspect-square text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                  <Avatar className="h-8 w-8 group-data-[collapsible=icon]:h-7 group-data-[collapsible=icon]:w-7">
                    <AvatarImage src={`https://placehold.co/100x100.png?text=${(appUser.name || 'U').substring(0,2)}`} alt={appUser.name || 'User'} data-ai-hint="user avatar"/>
                    <AvatarFallback>{(appUser.name || 'U').substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="ml-2 text-left group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium leading-none">{appUser.name || 'User'}</p>
                    <p className="text-xs text-sidebar-foreground/70 leading-none">{appUser.role ? appUser.role.charAt(0).toUpperCase() + appUser.role.slice(1) : 'No Role'}</p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="start" className="w-56">
                <DropdownMenuLabel>{appUser.name || appUser.email}</DropdownMenuLabel>
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
          <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-card px-6 shadow-sm">
            <SidebarTrigger className="md:hidden" />
            <div className="flex-1">
              {/* Can add breadcrumbs or page title here if needed */}
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
