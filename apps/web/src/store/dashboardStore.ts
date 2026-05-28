'use client';

import { create } from 'zustand';
import type {
  ChartDataPointDto,
  ClientOverviewDto,
  ClientProductsResponseDto,
  ItemStatus,
  StockProductDto,
} from '@prudens/shared/types';

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
  sort: string;
  order: 'asc' | 'desc';
  loaded: boolean;
  loading: boolean;
  setInitial: (overview: ClientOverviewDto, page: ClientProductsResponseDto) => void;
  setFilters: (partial: { term?: string; itemStatuses?: ItemStatus[] }) => void;
  setSort: (sort: string, order: 'asc' | 'desc') => void;
  setPage: (page: number) => void;
  applyProductsPage: (page: ClientProductsResponseDto) => void;
  setLoading: (loading: boolean) => void;
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
  sort: 'idd',
  order: 'desc',
  loaded: false,
  loading: false,
  setInitial: (overview, page) =>
    set({
      overview,
      products: page.items,
      chartData: page.chart_data,
      total: page.total,
      currentPage: page.currentPage,
      totalPages: page.totalPages,
      pageSize: page.pageSize,
      nextCursor: page.nextCursor,
      loaded: true,
      loading: false,
    }),
  setFilters: (partial) =>
    set((s) => ({
      term: partial.term ?? s.term,
      itemStatuses: partial.itemStatuses ?? s.itemStatuses,
      currentPage: 1,
      nextCursor: null,
    })),
  setSort: (sort, order) => set({ sort, order, currentPage: 1, nextCursor: null }),
  setPage: (currentPage) => set({ currentPage, nextCursor: null }),
  applyProductsPage: (page) =>
    set({
      products: page.items,
      chartData: page.chart_data,
      total: page.total,
      currentPage: page.currentPage,
      totalPages: page.totalPages,
      pageSize: page.pageSize,
      nextCursor: page.nextCursor,
      loading: false,
    }),
  setLoading: (loading) => set({ loading }),
}));

export function buildProductsQuery(state: DashboardState): string {
  const params = new URLSearchParams();
  if (state.term.trim()) params.set('term', state.term.trim());
  for (const s of state.itemStatuses) {
    params.append('item_status', s);
  }
  params.set('sort', state.sort);
  params.set('order', state.order);
  params.set('limit', String(state.pageSize));
  params.set('page', String(state.currentPage));
  return params.toString();
}
