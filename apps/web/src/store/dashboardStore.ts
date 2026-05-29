'use client';

import { create } from 'zustand';
import type {
  ChartDataPointDto,
  ClientDashboardSummaryDto,
  ClientOverviewDto,
  ClientProductsResponseDto,
  ItemStatus,
  NumericRangeDto,
  ProductRangesResponseDto,
  StockProductDto,
} from '@prudens/shared/types';

export interface FilterBounds {
  iddMin: number;
  iddMax: number;
  stockDaysMin: number;
  stockDaysMax: number;
  tiedUpCapitalMin: number;
  tiedUpCapitalMax: number;
}

const DEFAULT_BOUNDS: FilterBounds = {
  iddMin: -100,
  iddMax: 100,
  stockDaysMin: 0,
  stockDaysMax: 365,
  tiedUpCapitalMin: 0,
  tiedUpCapitalMax: 0,
};

function rangeOrDefault(r: NumericRangeDto | null | undefined, fallback: [number, number]): [number, number] {
  if (!r || r.min == null || r.max == null) return fallback;
  return [r.min, r.max];
}

function boundsFromRanges(ranges: ProductRangesResponseDto): FilterBounds {
  const idd = rangeOrDefault(ranges.idd, [DEFAULT_BOUNDS.iddMin, DEFAULT_BOUNDS.iddMax]);
  const days = rangeOrDefault(ranges.stockDays, [
    DEFAULT_BOUNDS.stockDaysMin,
    DEFAULT_BOUNDS.stockDaysMax,
  ]);
  const cap = rangeOrDefault(ranges.tiedUpCapital, [
    DEFAULT_BOUNDS.tiedUpCapitalMin,
    DEFAULT_BOUNDS.tiedUpCapitalMax,
  ]);
  return {
    iddMin: idd[0],
    iddMax: idd[1],
    stockDaysMin: days[0],
    stockDaysMax: days[1],
    tiedUpCapitalMin: cap[0],
    tiedUpCapitalMax: cap[1],
  };
}

interface DashboardState {
  overview: ClientOverviewDto | null;
  dashboardItemStatuses: ItemStatus[];
  dashboardSummary: ClientDashboardSummaryDto | null;
  dashboardChartData: ChartDataPointDto[];
  dashboardLoading: boolean;
  products: StockProductDto[];
  total: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  nextCursor: string | null;
  term: string;
  itemStatuses: ItemStatus[];
  iddMin: number;
  iddMax: number;
  stockDaysMin: number;
  stockDaysMax: number;
  tiedUpCapitalMin: number;
  tiedUpCapitalMax: number;
  filterBounds: FilterBounds;
  filtersPanelOpen: boolean;
  sort: string;
  order: 'asc' | 'desc';
  productsLoaded: boolean;
  productsLoading: boolean;
  setInitialDashboard: (
    overview: ClientOverviewDto,
    summary: ClientDashboardSummaryDto,
    chartData: ChartDataPointDto[],
  ) => void;
  setInitialProducts: (overview: ClientOverviewDto, page: ClientProductsResponseDto) => void;
  setRangeBounds: (ranges: ProductRangesResponseDto) => void;
  setDashboardItemStatuses: (statuses: ItemStatus[]) => void;
  applyDashboardData: (summary: ClientDashboardSummaryDto, chartData: ChartDataPointDto[]) => void;
  setDashboardLoading: (loading: boolean) => void;
  setFilters: (partial: {
    term?: string;
    itemStatuses?: ItemStatus[];
    iddMin?: number;
    iddMax?: number;
    stockDaysMin?: number;
    stockDaysMax?: number;
    tiedUpCapitalMin?: number;
    tiedUpCapitalMax?: number;
    filtersPanelOpen?: boolean;
  }) => void;
  setSort: (sort: string, order: 'asc' | 'desc') => void;
  setPage: (page: number) => void;
  applyProductsPage: (page: ClientProductsResponseDto) => void;
  setProductsLoading: (loading: boolean) => void;
  clearFilters: () => void;
  toggleFiltersPanel: () => void;
}

function applyRangeUpdate(
  currentMin: number,
  currentMax: number,
  nextMin?: number,
  nextMax?: number,
): { min: number; max: number } {
  let min = nextMin ?? currentMin;
  let max = nextMax ?? currentMax;
  if (nextMin !== undefined && min > max) max = min;
  if (nextMax !== undefined && max < min) min = max;
  return { min, max };
}

export function hasActiveFilters(state: DashboardState): boolean {
  const b = state.filterBounds;
  return (
    state.term.trim().length > 0 ||
    state.itemStatuses.length > 0 ||
    state.iddMin !== b.iddMin ||
    state.iddMax !== b.iddMax ||
    state.stockDaysMin !== b.stockDaysMin ||
    state.stockDaysMax !== b.stockDaysMax ||
    state.tiedUpCapitalMin !== b.tiedUpCapitalMin ||
    state.tiedUpCapitalMax !== b.tiedUpCapitalMax
  );
}

export const useDashboardStore = create<DashboardState>((set) => ({
  overview: null,
  dashboardItemStatuses: [],
  dashboardSummary: null,
  dashboardChartData: [],
  dashboardLoading: false,
  products: [],
  total: 0,
  currentPage: 1,
  totalPages: 1,
  pageSize: 50,
  nextCursor: null,
  term: '',
  itemStatuses: [],
  iddMin: DEFAULT_BOUNDS.iddMin,
  iddMax: DEFAULT_BOUNDS.iddMax,
  stockDaysMin: DEFAULT_BOUNDS.stockDaysMin,
  stockDaysMax: DEFAULT_BOUNDS.stockDaysMax,
  tiedUpCapitalMin: DEFAULT_BOUNDS.tiedUpCapitalMin,
  tiedUpCapitalMax: DEFAULT_BOUNDS.tiedUpCapitalMax,
  filterBounds: DEFAULT_BOUNDS,
  filtersPanelOpen: false,
  sort: 'idd',
  order: 'desc',
  productsLoaded: false,
  productsLoading: false,
  setInitialDashboard: (overview, summary, chartData) => {
    set({
      overview,
      dashboardSummary: summary,
      dashboardChartData: chartData,
      dashboardLoading: false,
    });
  },
  setInitialProducts: (overview, page) => {
    set({
      overview,
      products: page.items,
      total: page.total,
      currentPage: page.currentPage,
      totalPages: page.totalPages,
      pageSize: page.pageSize,
      nextCursor: page.nextCursor,
      productsLoaded: true,
      productsLoading: false,
    });
  },
  setRangeBounds: (ranges) => {
    const b = boundsFromRanges(ranges);
    set({
      filterBounds: b,
      iddMin: b.iddMin,
      iddMax: b.iddMax,
      stockDaysMin: b.stockDaysMin,
      stockDaysMax: b.stockDaysMax,
      tiedUpCapitalMin: b.tiedUpCapitalMin,
      tiedUpCapitalMax: b.tiedUpCapitalMax,
    });
  },
  setDashboardItemStatuses: (dashboardItemStatuses) => set({ dashboardItemStatuses }),
  applyDashboardData: (summary, chartData) =>
    set({ dashboardSummary: summary, dashboardChartData: chartData, dashboardLoading: false }),
  setDashboardLoading: (dashboardLoading) => set({ dashboardLoading }),
  setFilters: (partial) =>
    set((s) => {
      const idd = applyRangeUpdate(s.iddMin, s.iddMax, partial.iddMin, partial.iddMax);
      const stockDays = applyRangeUpdate(
        s.stockDaysMin,
        s.stockDaysMax,
        partial.stockDaysMin,
        partial.stockDaysMax,
      );
      const capital = applyRangeUpdate(
        s.tiedUpCapitalMin,
        s.tiedUpCapitalMax,
        partial.tiedUpCapitalMin,
        partial.tiedUpCapitalMax,
      );
      return {
        term: partial.term ?? s.term,
        itemStatuses: partial.itemStatuses ?? s.itemStatuses,
        iddMin: idd.min,
        iddMax: idd.max,
        stockDaysMin: stockDays.min,
        stockDaysMax: stockDays.max,
        tiedUpCapitalMin: capital.min,
        tiedUpCapitalMax: capital.max,
        filtersPanelOpen: partial.filtersPanelOpen ?? s.filtersPanelOpen,
        currentPage: 1,
        nextCursor: null,
      };
    }),
  setSort: (sort, order) => set({ sort, order, currentPage: 1, nextCursor: null }),
  setPage: (currentPage) => set({ currentPage, nextCursor: null }),
  applyProductsPage: (page) =>
    set({
      products: page.items,
      total: page.total,
      currentPage: page.currentPage,
      totalPages: page.totalPages,
      pageSize: page.pageSize,
      nextCursor: page.nextCursor,
      productsLoading: false,
    }),
  setProductsLoading: (productsLoading) => set({ productsLoading }),
  clearFilters: () =>
    set((s) => ({
      term: '',
      itemStatuses: [],
      iddMin: s.filterBounds.iddMin,
      iddMax: s.filterBounds.iddMax,
      stockDaysMin: s.filterBounds.stockDaysMin,
      stockDaysMax: s.filterBounds.stockDaysMax,
      tiedUpCapitalMin: s.filterBounds.tiedUpCapitalMin,
      tiedUpCapitalMax: s.filterBounds.tiedUpCapitalMax,
      currentPage: 1,
      nextCursor: null,
    })),
  toggleFiltersPanel: () => set((s) => ({ filtersPanelOpen: !s.filtersPanelOpen })),
}));

export function buildDashboardSummaryQuery(
  state: Pick<DashboardState, 'dashboardItemStatuses'>,
): string {
  const params = new URLSearchParams();
  for (const s of state.dashboardItemStatuses) {
    params.append('item_status', s);
  }
  return params.toString();
}

export function buildDashboardChartQuery(
  state: Pick<DashboardState, 'dashboardItemStatuses'>,
): string {
  const params = new URLSearchParams();
  for (const s of state.dashboardItemStatuses) {
    params.append('item_status', s);
  }
  params.set('limit', '1');
  params.set('sort', 'idd');
  params.set('order', 'desc');
  return params.toString();
}

export function buildProductsQuery(state: DashboardState): string {
  const params = new URLSearchParams();
  const b = state.filterBounds;
  if (state.term.trim()) params.set('term', state.term.trim());
  for (const s of state.itemStatuses) {
    params.append('item_status', s);
  }
  if (state.iddMin !== b.iddMin) params.set('idd_min', String(state.iddMin));
  if (state.iddMax !== b.iddMax) params.set('idd_max', String(state.iddMax));
  if (state.stockDaysMin !== b.stockDaysMin)
    params.set('stock_days_min', String(state.stockDaysMin));
  if (state.stockDaysMax !== b.stockDaysMax)
    params.set('stock_days_max', String(state.stockDaysMax));
  if (state.tiedUpCapitalMin !== b.tiedUpCapitalMin)
    params.set('tied_up_capital_min', String(state.tiedUpCapitalMin));
  if (state.tiedUpCapitalMax !== b.tiedUpCapitalMax)
    params.set('tied_up_capital_max', String(state.tiedUpCapitalMax));
  params.set('sort', state.sort);
  params.set('order', state.order);
  params.set('limit', String(state.pageSize));
  params.set('page', String(state.currentPage));
  return params.toString();
}
