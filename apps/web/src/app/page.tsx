import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { homePathForRole, parseRoleFromSessionClaims } from '@/lib/clerkRoles';

export default async function HomePage() {
  const { userId, sessionClaims } = await auth();
  if (!userId) redirect('/sign-in');

  const role = parseRoleFromSessionClaims(sessionClaims as Record<string, unknown> | null);
  if (!role) redirect('/acesso-pendente');

  redirect(homePathForRole(role));
}
