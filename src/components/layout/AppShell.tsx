
// @/components/layout/AppShell.tsx
"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation'; // Added useRouter
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
  Briefcase // Icon for Manager View
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCurrentUser, setCurrentUserRole, subscribeToUserChanges, type MockAuthUser } from '@/lib/authStore';

const navItemsAdmin = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/properties', label: 'Properties', icon: Building2 },
  { href: '/tenants', label: 'Tenants', icon: Users },
  { href: '/payments', label: 'Payments & Bills', icon: CreditCard },
  { href: '/documents', label: 'Documents', icon: FileText },
  { href: '/contract-analysis', label: 'Contract Analysis', icon: FileClock },
];

// Managers might have a slightly different set or filtered view on these pages
const navItemsManager = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/properties', label: 'My Properties', icon: Building2 },
  { href: '/tenants', label: 'Tenants', icon: Users }, // Will be filtered by managed properties
  { href: '/payments', label: 'Payments & Bills', icon: CreditCard }, // Will be filtered and no approval
  { href: '/documents', label: 'Documents', icon: FileText }, // Could be filtered
  // Contract Analysis might not be relevant or could be filtered
];


export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUserLocal] = React.useState<MockAuthUser>(getCurrentUser());

  React.useEffect(() => {
    const updateUser = () => setCurrentUserLocal(getCurrentUser());
    updateUser(); // Initial set
    const unsubscribe = subscribeToUserChanges(updateUser);
    return () => unsubscribe();
  }, []);

  const handleRoleSwitch = (role: 'admin' | 'manager' | 'tenant') => {
    setCurrentUserRole(role);
    if (role === 'tenant') {
      router.push('/portal/dashboard');
    } else {
      router.push('/dashboard'); // Admin and Manager share the same base dashboard for now
    }
  };
  
  const navItems = currentUser.role === 'manager' ? navItemsManager : navItemsAdmin;


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
                    <AvatarImage src={`https://placehold.co/100x100.png?text=${currentUser.name.substring(0,2)}`} alt={currentUser.name} data-ai-hint="user avatar"/>
                    <AvatarFallback>{currentUser.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="ml-2 group-data-[collapsible=icon]:hidden">{currentUser.name} ({currentUser.role})</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="start" className="w-56">
                <DropdownMenuLabel>Switch View / Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleRoleSwitch('admin')}>
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  <span>Switch to Admin View</span>
                </DropdownMenuItem>
                 <DropdownMenuItem onClick={() => handleRoleSwitch('manager')}>
                  <Briefcase className="mr-2 h-4 w-4" />
                  <span>Switch to Manager View</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleRoleSwitch('tenant')}>
                  <UserSquare className="mr-2 h-4 w-4" />
                  <span>Switch to Tenant View</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/logout">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex-1 flex flex-col bg-background">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-card px-6 shadow-sm">
            <SidebarTrigger className="md:hidden" />
            <div className="flex-1">
              {/* Could add breadcrumbs or page title here */}
            </div>
            {/* Additional header content can go here */}
          </header>
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
