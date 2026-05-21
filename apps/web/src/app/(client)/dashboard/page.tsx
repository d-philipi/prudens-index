'use client';

import { useAuth } from '@clerk/nextjs';
import { useEffect } from 'react';
import { apiFetch } from '@/lib/apiClient';
import { DashboardKpiCards } from '@/components/DashboardKpiCards';
import { ProductsTable } from '@/components/ProductsTable';
import { BranchDistributionChart } from '@/components/BranchDistributionChart';
import { DashboardFilters } from '@/components/DashboardFilters';
import { ExportPdfButton } from '@/components/ExportPdfButton';
import {
  useDashboardStore,
  useFilteredBranchDistribution,
  useFilteredProducts,
  useFilteredSummary,
} from '@/store/dashboardStore';
import type { BranchDistributionPointDto, DashboardSummaryDto, StockProductDto } from '@prudens/shared/types';

export default function DashboardPage() {
  const { getToken } = useAuth();
  const loaded = useDashboardStore((s) => s.loaded);
  const setSnapshot = useDashboardStore((s) => s.setSnapshot);
  const filters = useDashboardStore((s) => s.filters);
  const setFilters = useDashboardStore((s) => s.setFilters);
  const clearFilters = useDashboardStore((s) => s.clearFilters);
  const allProducts = useDashboardStore((s) => s.products);

  const filtered = useFilteredProducts();
  const summary = useFilteredSummary();
  const branchData = useFilteredBranchDistribution();

  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (!token) return;
      const start = performance.now();
      const [summaryRes, productsRes, branchRes] = await Promise.all([
        apiFetch<DashboardSummaryDto>('/api/client/dashboard/summary', { token }),
        apiFetch<{ items: StockProductDto[]; total: number }>(
          '/api/client/dashboard/products?pageSize=5000',
          { token },
        ),
        apiFetch<BranchDistributionPointDto[]>('/api/client/dashboard/branch-distribution', {
          token,
        }),
      ]);
      void branchRes;
      void summaryRes;
      setSnapshot(productsRes.items, summaryRes.activeImportJobId);
      console.debug('Dashboard load ms', performance.now() - start);
    })();
  }, [getToken, setSnapshot]);

  if (!loaded) {
    return <p className="text-sm text-slate-600">Carregando dashboard…</p>;
  }

  if (allProducts.length === 0) {
    return (
      <p className="rounded border bg-white p-6 text-sm text-slate-600">
        Nenhum dado de estoque disponível ainda. Aguarde o admin concluir um import.
      </p>
    );
  }

  const hasFilters =
    filters.branches.length > 0 ||
    filters.categories.length > 0 ||
    filters.itemStatuses.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <DashboardFilters
          products={allProducts}
          filters={filters}
          onChange={setFilters}
          onClear={clearFilters}
        />
        <ExportPdfButton products={filtered} filters={filters} />
      </div>
      {hasFilters && filtered.length === 0 && (
        <p className="text-sm text-amber-700">
          Nenhum produto corresponde aos filtros.{' '}
          <button type="button" className="underline" onClick={clearFilters}>
            Limpar filtros
          </button>
        </p>
      )}
      <DashboardKpiCards summary={summary} />
      <BranchDistributionChart data={branchData} />
      <ProductsTable products={filtered} />
    </div>
  );
}
