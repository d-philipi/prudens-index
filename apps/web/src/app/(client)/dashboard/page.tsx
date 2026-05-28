import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { apiFetch } from '@/lib/apiClient';
import { DashboardView } from '@/components/client/DashboardView';
import type { ClientOverviewDto, ClientProductsResponseDto } from '@prudens/shared/types';

export default async function DashboardPage() {
  const { getToken } = await auth();
  const token = await getToken();
  if (!token) redirect('/sign-in');

  const [overview, products] = await Promise.all([
    apiFetch<ClientOverviewDto>('/api/client/overview', { token }),
    apiFetch<ClientProductsResponseDto>('/api/client/products?limit=50&sort=idd&order=desc', {
      token,
    }),
  ]);

  return <DashboardView initialOverview={overview} initialProducts={products} />;
}
