import { AppShell } from '@/components/layout/AppShell';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'EstateMind Dashboard',
  description: 'Manage your real estate properties and tenants efficiently.',
};

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
