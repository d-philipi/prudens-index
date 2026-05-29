'use client';

import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useRef } from 'react';
import type {
  ClientDashboardSummaryDto,
  ClientOverviewDto,
  ClientProductsResponseDto,
  ItemStatus,
} from '@prudens/shared/types';
import { apiFetch } from '@/lib/apiClient';
import {
  buildDashboardChartQuery,
  buildDashboardSummaryQuery,
  useDashboardStore,
} from '@/store/dashboardStore';
import { IndexHeader } from './IndexHeader';
import { ExecutiveSummary } from './ExecutiveSummary';
import { DashboardStatusFilter } from './DashboardStatusFilter';
import { IddBarChart } from './IddBarChart';
import { strings } from '@/lib/strings';

interface Props {
  initialOverview: ClientOverviewDto;
  initialSummary: ClientDashboardSummaryDto;
  initialChartData: ClientProductsResponseDto['chart_data'];
}

export function DashboardView({ initialOverview, initialSummary, initialChartData }: Props) {
  const { getToken } = useAuth();
  const setInitialDashboard = useDashboardStore((s) => s.setInitialDashboard);
  const setDashboardItemStatuses = useDashboardStore((s) => s.setDashboardItemStatuses);
  const applyDashboardData = useDashboardStore((s) => s.applyDashboardData);
  const setDashboardLoading = useDashboardStore((s) => s.setDashboardLoading);
  const overview = useDashboardStore((s) => s.overview);
  const dashboardItemStatuses = useDashboardStore((s) => s.dashboardItemStatuses);
  const dashboardSummary = useDashboardStore((s) => s.dashboardSummary);
  const dashboardChartData = useDashboardStore((s) => s.dashboardChartData);
  const dashboardLoading = useDashboardStore((s) => s.dashboardLoading);
  const skipFirstRefetch = useRef(true);

  useEffect(() => {
    setInitialDashboard(initialOverview, initialSummary, initialChartData);
  }, [initialOverview, initialSummary, initialChartData, setInitialDashboard]);

  const refetchDashboard = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    setDashboardLoading(true);
    const state = useDashboardStore.getState();
    const summaryQs = buildDashboardSummaryQuery(state);
    const chartQs = buildDashboardChartQuery(state);
    const summaryPath = summaryQs
      ? `/api/client/dashboard/summary?${summaryQs}`
      : '/api/client/dashboard/summary';
    try {
      const [summary, products] = await Promise.all([
        apiFetch<ClientDashboardSummaryDto>(summaryPath, { token }),
        apiFetch<ClientProductsResponseDto>(`/api/client/products?${chartQs}`, { token }),
      ]);
      applyDashboardData(summary, products.chart_data);
    } catch {
      setDashboardLoading(false);
    }
  }, [getToken, applyDashboardData, setDashboardLoading]);

  useEffect(() => {
    if (skipFirstRefetch.current) {
      skipFirstRefetch.current = false;
      return;
    }
    void refetchDashboard();
  }, [dashboardItemStatuses, refetchDashboard]);

  const displayOverview = overview ?? initialOverview;
  const displaySummary = dashboardSummary ?? initialSummary;
  const displayChart = dashboardChartData.length > 0 ? dashboardChartData : initialChartData;

  if (!displayOverview.lastUpdatedAt && !displayOverview.activeImportJobId) {
    return (
      <p className="rounded-lg border border-border-default bg-surface-card p-8 text-center text-sm text-text-subtitle">
        {strings.client.noStockData}
      </p>
    );
  }

  const toggleStatus = (status: ItemStatus) => {
    const next = dashboardItemStatuses.includes(status)
      ? dashboardItemStatuses.filter((s) => s !== status)
      : [...dashboardItemStatuses, status];
    setDashboardItemStatuses(next);
  };

  return (
    <div className="flex flex-col gap-4 overflow-x-hidden">
      <IndexHeader overview={displayOverview} />
      {dashboardLoading ? (
        <p className="text-xs text-text-subtitle">{strings.client.updatingDashboard}</p>
      ) : null}
      <ExecutiveSummary summary={displaySummary} />
      <DashboardStatusFilter
        itemStatuses={dashboardItemStatuses}
        onStatusToggle={toggleStatus}
      />
      <IddBarChart data={displayChart} />
    </div>
  );
}
