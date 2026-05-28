'use client';

import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useRef } from 'react';
import { apiFetch } from '@/lib/apiClient';
import {
  buildProductsQuery,
  useDashboardStore,
} from '@/store/dashboardStore';
import type {
  ClientOverviewDto,
  ClientProductsResponseDto,
  ItemStatus,
} from '@prudens/shared/types';
import { IndexHeader } from './IndexHeader';
import { FilterSidebar } from './FilterSidebar';
import { IddBarChart } from './IddBarChart';
import { ProductTable } from './ProductTable';
import { ExportButton } from './ExportButton';
import { strings } from '@/lib/strings';

interface Props {
  initialOverview: ClientOverviewDto;
  initialProducts: ClientProductsResponseDto;
}

export function DashboardView({ initialOverview, initialProducts }: Props) {
  const { getToken } = useAuth();
  const setInitial = useDashboardStore((s) => s.setInitial);
  const overview = useDashboardStore((s) => s.overview);
  const products = useDashboardStore((s) => s.products);
  const chartData = useDashboardStore((s) => s.chartData);
  const total = useDashboardStore((s) => s.total);
  const term = useDashboardStore((s) => s.term);
  const itemStatuses = useDashboardStore((s) => s.itemStatuses);
  const sort = useDashboardStore((s) => s.sort);
  const order = useDashboardStore((s) => s.order);
  const setFilters = useDashboardStore((s) => s.setFilters);
  const setSort = useDashboardStore((s) => s.setSort);
  const setPage = useDashboardStore((s) => s.setPage);
  const applyProductsPage = useDashboardStore((s) => s.applyProductsPage);
  const currentPage = useDashboardStore((s) => s.currentPage);
  const totalPages = useDashboardStore((s) => s.totalPages);
  const setLoading = useDashboardStore((s) => s.setLoading);
  const loading = useDashboardStore((s) => s.loading);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipFirstRefetch = useRef(true);

  useEffect(() => {
    setInitial(initialOverview, initialProducts);
  }, [initialOverview, initialProducts, setInitial]);

  const refetchProducts = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    setLoading(true);
    const state = useDashboardStore.getState();
    const qs = buildProductsQuery(state);
    const page = await apiFetch<ClientProductsResponseDto>(
      `/api/client/products?${qs}`,
      { token },
    );
    applyProductsPage(page);
  }, [getToken, applyProductsPage, setLoading]);

  useEffect(() => {
    if (skipFirstRefetch.current) {
      skipFirstRefetch.current = false;
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void refetchProducts();
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [term, itemStatuses, sort, order, currentPage, refetchProducts]);

  const displayOverview = overview ?? initialOverview;

  if (!displayOverview.lastUpdatedAt) {
    return (
      <p className="rounded border bg-white p-8 text-center text-sm text-slate-600">
        {strings.client.noStockData}
      </p>
    );
  }

  const toggleStatus = (status: ItemStatus) => {
    const next = itemStatuses.includes(status)
      ? itemStatuses.filter((s) => s !== status)
      : [...itemStatuses, status];
    setFilters({ itemStatuses: next });
  };

  const handleSort = (column: string) => {
    if (sort === column) {
      setSort(column, order === 'asc' ? 'desc' : 'asc');
    } else {
      setSort(column, 'desc');
    }
  };

  return (
    <div className="flex flex-col gap-3 overflow-x-hidden lg:flex-row lg:gap-4">
      <div className="flex min-w-0 flex-1 flex-col gap-3 overflow-x-hidden lg:gap-4">
        <IndexHeader overview={displayOverview} />
        {loading && (
          <p className="text-xs text-slate-500">{strings.client.updatingProducts}</p>
        )}
        <IddBarChart data={chartData} />
        <ProductTable
          products={products}
          total={total}
          sort={sort}
          order={order}
          onSort={handleSort}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => setPage(page)}
        />
      </div>
      <div className="space-y-4">
        <FilterSidebar
          term={term}
          itemStatuses={itemStatuses}
          onTermChange={(t) => setFilters({ term: t })}
          onStatusToggle={toggleStatus}
        />
        <ExportButton term={term} itemStatuses={itemStatuses} />
      </div>
    </div>
  );
}
