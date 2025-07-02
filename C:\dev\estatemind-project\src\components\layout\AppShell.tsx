
'use client';

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
  UserCog,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCurrentUser, logoutFirebaseUser, subscribeToUserChanges } from '@/lib/authStore';
import type { AppUser } from '@/lib/types';

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

const publicRoutes = ['/login', '/logout'];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [appUser, setAppUserLocal] = React.useState<AppUser | null>(null);
  const [authLoading, setAuthLoading] = React.useState(true);

  React.useEffect(() => {
    const unsubscribe = subscribeToUserChanges((user) => {
      setAppUserLocal(user);
      setAuthLoading(false);
    });

    const initialUser = getCurrentUser();
    if (initialUser) {
        setAppUserLocal(initialUser);
        setAuthLoading(false);
    } else {
        const authLib = require('@/lib/firebaseConfig').auth;
        if(authLib && authLib.currentUser === null){
            setAuthLoading(false);
        }
    }


    return () => unsubscribe();
  }, []);

  React.useEffect(() => {
    if (!authLoading && !appUser && !publicRoutes.includes(pathname)) {
      router.push('/login');
    }
  }, [authLoading, appUser, pathname, router]);

  const handleLogout = async () => {
    await logoutFirebaseUser();
    router.push('/logout'); 
  };
  
  if (publicRoutes.includes(pathname)) {
    return <>{children}</>;
  }

  if (authLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Authenticating...</p>
      </div>
    );
  }

  if (!appUser) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="ml-2 text-muted-foreground">Redirecting to login...</p>
      </div>
    );
  }

  let navItems = navItemsBase;
  if (appUser?.role === 'admin') {
    navItems = [...navItemsBase, ...adminOnlyNavItems];
  } else if (appUser?.role === 'manager') {
    navItems = navItemsBase;
  }

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

        <SidebarInset className={cn("flex-1 flex flex-col", "bg-background")}>
          <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-card px-6 shadow-sm">
            <SidebarTrigger className="md:hidden" />
            <div className="flex-1" />
          </header>
          <main className={cn("flex-1 overflow-y-auto", "p-4 md:p-6 lg:p-8")}>
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
