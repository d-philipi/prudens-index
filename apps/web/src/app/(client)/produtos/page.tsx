import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { apiFetch } from '@/lib/apiClient';
import { ProductsView } from '@/components/client/ProductsView';
import type { ClientOverviewDto, ClientProductsResponseDto } from '@prudens/shared/types';

export default async function ProdutosPage() {
  const { getToken } = await auth();
  const token = await getToken();
  if (!token) redirect('/login');

  const [overview, products] = await Promise.all([
    apiFetch<ClientOverviewDto>('/api/client/overview', { token }),
    apiFetch<ClientProductsResponseDto>('/api/client/products?limit=50&sort=idd&order=desc', {
      token,
    }),
  ]);

  return <ProductsView initialOverview={overview} initialProducts={products} />;
}
