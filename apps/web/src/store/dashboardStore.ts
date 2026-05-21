'use client';

import { create } from 'zustand';
import {
  computeBranchDistribution,
  computeDashboardSummary,
  filterProducts,
} from '@prudens/domain-metrics';
import type {
  BranchDistributionPointDto,
  DashboardFiltersDto,
  DashboardSummaryDto,
  StockProductDto,
} from '@prudens/shared/types';

interface DashboardState {
  products: StockProductDto[];
  filters: DashboardFiltersDto;
  activeImportJobId: string | null;
  loaded: boolean;
  setSnapshot: (products: StockProductDto[], activeImportJobId: string | null) => void;
  setFilters: (filters: Partial<DashboardFiltersDto>) => void;
  clearFilters: () => void;
}

const defaultFilters: DashboardFiltersDto = {
  branches: [],
  categories: [],
  itemStatuses: [],
};

export const useDashboardStore = create<DashboardState>((set, get) => ({
  products: [],
  filters: defaultFilters,
  activeImportJobId: null,
  loaded: false,
  setSnapshot: (products, activeImportJobId) =>
    set({ products, activeImportJobId, loaded: true }),
  setFilters: (partial) =>
    set((s) => ({ filters: { ...s.filters, ...partial } })),
  clearFilters: () => set({ filters: defaultFilters }),
}));

export function useFilteredProducts(): StockProductDto[] {
  const products = useDashboardStore((s) => s.products);
  const filters = useDashboardStore((s) => s.filters);
  return filterProducts(products, filters);
}

export function useFilteredSummary(): DashboardSummaryDto {
  const filtered = useFilteredProducts();
  const activeImportJobId = useDashboardStore((s) => s.activeImportJobId);
  return computeDashboardSummary(filtered, activeImportJobId);
}

export function useFilteredBranchDistribution(): BranchDistributionPointDto[] {
  const filtered = useFilteredProducts();
  return computeBranchDistribution(filtered);
}
