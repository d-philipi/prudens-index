'use client';

import { create } from 'zustand';
import type {
  ChartDataPointDto,
  ClientOverviewDto,
  ClientProductsResponseDto,
  ItemStatus,
  StockProductDto,
} from '@prudens/shared/types';

const DEFAULT_IDD_MIN = -100;
const DEFAULT_IDD_MAX = 100;
const DEFAULT_STOCK_DAYS_MIN = 0;
const DEFAULT_STOCK_DAYS_MAX = 365;

interface DashboardState {
  overview: ClientOverviewDto | null;
  products: StockProductDto[];
  chartData: ChartDataPointDto[];
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
  tiedUpCapitalSliderMax: number;
  filtersPanelOpen: boolean;
  sort: string;
  order: 'asc' | 'desc';
  loaded: boolean;
  loading: boolean;
  setInitial: (overview: ClientOverviewDto, page: ClientProductsResponseDto) => void;
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
  setLoading: (loading: boolean) => void;
  clearFilters: () => void;
  toggleFiltersPanel: () => void;
}

function maxTiedUpCapital(products: StockProductDto[]): number {
  let max = 0;
  for (const p of products) {
    if (p.tiedUpCapital != null && p.tiedUpCapital > max) max = p.tiedUpCapital;
  }
  return max;
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
  return (
    state.term.trim().length > 0 ||
    state.itemStatuses.length > 0 ||
    state.iddMin !== DEFAULT_IDD_MIN ||
    state.iddMax !== DEFAULT_IDD_MAX ||
    state.stockDaysMin !== DEFAULT_STOCK_DAYS_MIN ||
    state.stockDaysMax !== DEFAULT_STOCK_DAYS_MAX ||
    state.tiedUpCapitalMin > 0 ||
    (state.tiedUpCapitalSliderMax > 0 && state.tiedUpCapitalMax < state.tiedUpCapitalSliderMax)
  );
}

export const useDashboardStore = create<DashboardState>((set) => ({
  overview: null,
  products: [],
  chartData: [],
  total: 0,
  currentPage: 1,
  totalPages: 1,
  pageSize: 50,
  nextCursor: null,
  term: '',
  itemStatuses: [],
  iddMin: DEFAULT_IDD_MIN,
  iddMax: DEFAULT_IDD_MAX,
  stockDaysMin: DEFAULT_STOCK_DAYS_MIN,
  stockDaysMax: DEFAULT_STOCK_DAYS_MAX,
  tiedUpCapitalMin: 0,
  tiedUpCapitalMax: 0,
  tiedUpCapitalSliderMax: 0,
  filtersPanelOpen: false,
  sort: 'idd',
  order: 'desc',
  loaded: false,
  loading: false,
  setInitial: (overview, page) => {
    const sliderMax = maxTiedUpCapital(page.items);
    set({
      overview,
      products: page.items,
      chartData: page.chart_data,
      total: page.total,
      currentPage: page.currentPage,
      totalPages: page.totalPages,
      pageSize: page.pageSize,
      nextCursor: page.nextCursor,
      tiedUpCapitalSliderMax: sliderMax,
      tiedUpCapitalMax: sliderMax,
      loaded: true,
      loading: false,
    });
  },
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
    set((s) => {
      const sliderMax = Math.max(maxTiedUpCapital(page.items), s.tiedUpCapitalSliderMax);
      return {
        products: page.items,
        chartData: page.chart_data,
        total: page.total,
        currentPage: page.currentPage,
        totalPages: page.totalPages,
        pageSize: page.pageSize,
        nextCursor: page.nextCursor,
        tiedUpCapitalSliderMax: sliderMax,
        tiedUpCapitalMax:
          s.tiedUpCapitalMax === s.tiedUpCapitalSliderMax || s.tiedUpCapitalMax === 0
            ? sliderMax
            : Math.min(s.tiedUpCapitalMax, sliderMax),
        loading: false,
      };
    }),
  setLoading: (loading) => set({ loading }),
  clearFilters: () =>
    set((s) => ({
      term: '',
      itemStatuses: [],
      iddMin: DEFAULT_IDD_MIN,
      iddMax: DEFAULT_IDD_MAX,
      stockDaysMin: DEFAULT_STOCK_DAYS_MIN,
      stockDaysMax: DEFAULT_STOCK_DAYS_MAX,
      tiedUpCapitalMin: 0,
      tiedUpCapitalMax: s.tiedUpCapitalSliderMax,
      currentPage: 1,
      nextCursor: null,
    })),
  toggleFiltersPanel: () => set((s) => ({ filtersPanelOpen: !s.filtersPanelOpen })),
}));

export function buildProductsQuery(state: DashboardState): string {
  const params = new URLSearchParams();
  if (state.term.trim()) params.set('term', state.term.trim());
  for (const s of state.itemStatuses) {
    params.append('item_status', s);
  }
  if (state.iddMin !== DEFAULT_IDD_MIN) params.set('idd_min', String(state.iddMin));
  if (state.iddMax !== DEFAULT_IDD_MAX) params.set('idd_max', String(state.iddMax));
  if (state.stockDaysMin !== DEFAULT_STOCK_DAYS_MIN)
    params.set('stock_days_min', String(state.stockDaysMin));
  if (state.stockDaysMax !== DEFAULT_STOCK_DAYS_MAX)
    params.set('stock_days_max', String(state.stockDaysMax));
  if (state.tiedUpCapitalMin > 0) params.set('tied_up_capital_min', String(state.tiedUpCapitalMin));
  if (
    state.tiedUpCapitalSliderMax > 0 &&
    state.tiedUpCapitalMax < state.tiedUpCapitalSliderMax
  ) {
    params.set('tied_up_capital_max', String(state.tiedUpCapitalMax));
  }
  params.set('sort', state.sort);
  params.set('order', state.order);
  params.set('limit', String(state.pageSize));
  params.set('page', String(state.currentPage));
  return params.toString();
}
