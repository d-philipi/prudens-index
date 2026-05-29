import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { apiFetch } from '@/lib/apiClient';
import { DashboardView } from '@/components/client/DashboardView';
import type {
  ClientDashboardSummaryDto,
  ClientOverviewDto,
  ClientProductsResponseDto,
} from '@prudens/shared/types';

export default async function DashboardPage() {
  const { getToken } = await auth();
  const token = await getToken();
  if (!token) redirect('/login');

  const [overview, products, summary] = await Promise.all([
    apiFetch<ClientOverviewDto>('/api/client/overview', { token }),
    apiFetch<ClientProductsResponseDto>('/api/client/products?limit=50&sort=idd&order=desc', {
      token,
    }),
    apiFetch<ClientDashboardSummaryDto>('/api/client/dashboard/summary', { token }).catch(() => ({
      totalProjectedRevenue: 0,
      totalTiedUpCapital: 0,
      totalLostRevenue: 0,
      statusCounts: [],
      topRiskProducts: [],
      minStockDays: null,
      maxStockDays: null,
      minIdd: null,
      maxIdd: null,
      minProjectedRevenue: null,
      maxProjectedRevenue: null,
      maxTiedUpCapital: null,
      maxLostRevenue: null,
    })),
  ]);

  return (
    <DashboardView
      initialOverview={overview}
      initialSummary={summary}
      initialChartData={products.chart_data}
    />
  );
}
