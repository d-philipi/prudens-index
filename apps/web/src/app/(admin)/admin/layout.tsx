import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { AppShellWrapper } from '@/components/layout/AppShellWrapper';
import { parseRoleFromSessionClaims } from '@/lib/clerkRoles';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userId, sessionClaims } = await auth();
  if (!userId) redirect('/sign-in');

  const role = parseRoleFromSessionClaims(sessionClaims as Record<string, unknown> | null);
  if (role !== 'admin') redirect('/acesso-pendente');

  return <AppShellWrapper role="admin">{children}</AppShellWrapper>;
}
