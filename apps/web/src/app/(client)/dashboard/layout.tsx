import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { AppShellWrapper } from '@/components/layout/AppShellWrapper';
import { parseRoleFromSessionClaims } from '@/lib/clerkRoles';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { userId, sessionClaims } = await auth();
  if (!userId) redirect('/login');

  const role = parseRoleFromSessionClaims(sessionClaims as Record<string, unknown> | null);
  if (role !== 'client') redirect('/acesso-pendente');

  return <AppShellWrapper role="client">{children}</AppShellWrapper>;
}
