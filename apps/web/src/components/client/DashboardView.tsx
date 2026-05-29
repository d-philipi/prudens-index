'use client';

import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useRef } from 'react';
import type { ProductRangesResponseDto } from '@prudens/shared/types';
import { apiFetch } from '@/lib/apiClient';
import {
  buildProductsQuery,
  hasActiveFilters,
  useDashboardStore,
} from '@/store/dashboardStore';
import type {
  ClientOverviewDto,
  ClientProductsResponseDto,
  ItemStatus,
} from '@prudens/shared/types';
import { ExportButton } from '@/features/dashboard/components/ExportButton';
import { IndexHeader } from './IndexHeader';
import { FilterBar } from './FilterBar';
import { IddBarChart } from './IddBarChart';
import { ProductTable } from './ProductTable';
import { strings } from '@/lib/strings';

interface Props {
  initialOverview: ClientOverviewDto;
  initialProducts: ClientProductsResponseDto;
}

export function DashboardView({ initialOverview, initialProducts }: Props) {
  const { getToken } = useAuth();
  const setInitial = useDashboardStore((s) => s.setInitial);
  const setRangeBounds = useDashboardStore((s) => s.setRangeBounds);
  const overview = useDashboardStore((s) => s.overview);
  const filterBounds = useDashboardStore((s) => s.filterBounds);
  const products = useDashboardStore((s) => s.products);
  const chartData = useDashboardStore((s) => s.chartData);
  const total = useDashboardStore((s) => s.total);
  const term = useDashboardStore((s) => s.term);
  const itemStatuses = useDashboardStore((s) => s.itemStatuses);
  const iddMin = useDashboardStore((s) => s.iddMin);
  const iddMax = useDashboardStore((s) => s.iddMax);
  const stockDaysMin = useDashboardStore((s) => s.stockDaysMin);
  const stockDaysMax = useDashboardStore((s) => s.stockDaysMax);
  const tiedUpCapitalMin = useDashboardStore((s) => s.tiedUpCapitalMin);
  const tiedUpCapitalMax = useDashboardStore((s) => s.tiedUpCapitalMax);
  const filtersPanelOpen = useDashboardStore((s) => s.filtersPanelOpen);
  const sort = useDashboardStore((s) => s.sort);
  const order = useDashboardStore((s) => s.order);
  const setFilters = useDashboardStore((s) => s.setFilters);
  const setSort = useDashboardStore((s) => s.setSort);
  const setPage = useDashboardStore((s) => s.setPage);
  const applyProductsPage = useDashboardStore((s) => s.applyProductsPage);
  const clearFilters = useDashboardStore((s) => s.clearFilters);
  const toggleFiltersPanel = useDashboardStore((s) => s.toggleFiltersPanel);
  const currentPage = useDashboardStore((s) => s.currentPage);
  const totalPages = useDashboardStore((s) => s.totalPages);
  const setLoading = useDashboardStore((s) => s.setLoading);
  const loading = useDashboardStore((s) => s.loading);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipFirstRefetch = useRef(true);

  useEffect(() => {
    setInitial(initialOverview, initialProducts);
  }, [initialOverview, initialProducts, setInitial]);

  useEffect(() => {
    void (async () => {
      const token = await getToken();
      if (!token) return;
      try {
        const ranges = await apiFetch<ProductRangesResponseDto>(
          '/api/client/products/ranges',
          { token },
        );
        setRangeBounds(ranges);
      } catch {
        /* keep defaults */
      }
    })();
  }, [getToken, setRangeBounds]);

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
  }, [
    term,
    itemStatuses,
    iddMin,
    iddMax,
    stockDaysMin,
    stockDaysMax,
    tiedUpCapitalMin,
    tiedUpCapitalMax,
    sort,
    order,
    currentPage,
    refetchProducts,
  ]);

  const displayOverview = overview ?? initialOverview;
  const activeFilters = hasActiveFilters(useDashboardStore.getState());
  const canExport = Boolean(displayOverview.activeImportJobId);

  if (!displayOverview.lastUpdatedAt && !displayOverview.activeImportJobId) {
    return (
      <p className="rounded-lg border border-border-default bg-surface-card p-8 text-center text-sm text-text-subtitle">
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
    <div className="flex flex-col gap-4 overflow-x-hidden">
      <IndexHeader overview={displayOverview} />
      {loading ? (
        <p className="text-xs text-text-subtitle">{strings.client.updatingProducts}</p>
      ) : null}
      <IddBarChart data={chartData} />
      <FilterBar
        open={filtersPanelOpen}
        onToggle={toggleFiltersPanel}
        term={term}
        itemStatuses={itemStatuses}
        iddMin={iddMin}
        iddMax={iddMax}
        stockDaysMin={stockDaysMin}
        stockDaysMax={stockDaysMax}
        tiedUpCapitalMin={tiedUpCapitalMin}
        tiedUpCapitalMax={tiedUpCapitalMax}
        boundsIdd={[filterBounds.iddMin, filterBounds.iddMax]}
        boundsStockDays={[filterBounds.stockDaysMin, filterBounds.stockDaysMax]}
        boundsCapital={[filterBounds.tiedUpCapitalMin, filterBounds.tiedUpCapitalMax]}
        showClear={activeFilters}
        onTermChange={(t) => setFilters({ term: t })}
        onStatusToggle={toggleStatus}
        onIddChange={([lo, hi]) => setFilters({ iddMin: lo, iddMax: hi })}
        onStockDaysChange={([lo, hi]) => setFilters({ stockDaysMin: lo, stockDaysMax: hi })}
        onTiedUpCapitalChange={([lo, hi]) =>
          setFilters({ tiedUpCapitalMin: lo, tiedUpCapitalMax: hi })
        }
        onClear={clearFilters}
      />
      <div className="flex justify-end">
        <ExportButton canExport={canExport} />
      </div>
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
  );
}
