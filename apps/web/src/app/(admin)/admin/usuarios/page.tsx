import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { UsersPage } from '@/features/admin/components/UsersPage';

export default async function AdminUsuariosPage() {
  const { getToken } = await auth();
  const token = await getToken();
  if (!token) redirect('/login');

  return <UsersPage />;
}
