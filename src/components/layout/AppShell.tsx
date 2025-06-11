
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
import { auth } from '@/lib/firebaseConfig'; // Import auth

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
  const [appUser, setAppUserLocal] = React.useState<AppUser | null>(getCurrentUser());
  const [authLoading, setAuthLoading] = React.useState(true);


  React.useEffect(() => {
    const unsubscribe = subscribeToUserChanges(() => {
      const user = getCurrentUser();
      setAppUserLocal(user);
      setAuthLoading(false);

      if (!user && pathname !== '/login' && pathname !== '/logout') {
        router.push('/login');
      }
    });

    // Initial check
    const initialUser = getCurrentUser();
    setAppUserLocal(initialUser);

    if (auth && auth.currentUser === null && !initialUser) {
      // Firebase auth is available, but no user is signed in, and local store also shows no user.
      setAuthLoading(false);
       if (pathname !== '/login' && pathname !== '/logout') router.push('/login');
    } else if (initialUser) {
      // User was already available in local store (e.g., from a previous session or fast onAuthStateChanged)
      setAuthLoading(false);
    } else if (!auth) {
      // Firebase auth service itself is not available (e.g., API key was missing or initialization failed)
      console.warn('AppShell: Firebase auth service not available. Redirecting to login if necessary.');
      setAuthLoading(false);
      if (pathname !== '/login' && pathname !== '/logout') router.push('/login');
    }
    // If none of the above, authLoading remains true until the onAuthStateChanged in subscribeToUserChanges fires and sets it.

    return () => unsubscribe();
  }, [pathname, router, auth]); // Added auth to dependency array

  const handleLogout = async () => {
    await logoutFirebaseUser();
    // Redirection to /logout or /login will be handled by the effect above
  };

   const handleRoleSwitchSimulate = (rolePath: string) => {
    if (rolePath === '/portal/dashboard' && appUser?.role !== 'tenant') {
        alert("To access the tenant portal, please log in with a tenant account (e.g., one with a 'tenant' custom claim).");
        return;
    }
    if (appUser?.role === 'tenant' && rolePath === '/dashboard'){
        alert("Tenants cannot access the admin/manager dashboard. Please log out and log in with an admin/manager account.");
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
        <p className="ml-2">Authenticating...</p>
      </div>
    );
  }

  // If not loading and no user, and not on login/logout page, the useEffect will handle redirection.
  // The direct router.push here was causing the error.

  // For login page itself, or if user is not yet available but we are loading.
  if (!appUser && (pathname === '/login' || pathname === '/logout')) {
    return <>{children}</>; // Render login/logout page without AppShell
  }

  // If user is available, render AppShell
  if (appUser) {
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
  // This state should ideally be covered by the authLoading check or initial redirect within useEffect.
  return <>{children}</>;
}

