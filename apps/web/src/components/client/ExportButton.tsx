'use client';

import { useAuth } from '@clerk/nextjs';
import { apiFetch } from '@/lib/apiClient';
import { buildProductsQuery, useDashboardStore } from '@/store/dashboardStore';

export function ExportButton() {
  const { getToken } = useAuth();
  const term = useDashboardStore((s) => s.term);
  const itemStatuses = useDashboardStore((s) => s.itemStatuses);
  const iddMin = useDashboardStore((s) => s.iddMin);
  const iddMax = useDashboardStore((s) => s.iddMax);
  const stockDaysMin = useDashboardStore((s) => s.stockDaysMin);
  const stockDaysMax = useDashboardStore((s) => s.stockDaysMax);
  const tiedUpCapitalMin = useDashboardStore((s) => s.tiedUpCapitalMin);
  const tiedUpCapitalMax = useDashboardStore((s) => s.tiedUpCapitalMax);
  const exportPdf = async () => {
    const token = await getToken();
    if (!token) return;
    const state = useDashboardStore.getState();
    const qs = buildProductsQuery(state);
    const params = new URLSearchParams(qs);
    const body: Record<string, unknown> = {
      term: term.trim() || undefined,
      itemStatuses,
    };
    if (params.has('idd_min')) body.iddMin = iddMin;
    if (params.has('idd_max')) body.iddMax = iddMax;
    if (params.has('stock_days_min')) body.stockDaysMin = stockDaysMin;
    if (params.has('stock_days_max')) body.stockDaysMax = stockDaysMax;
    if (params.has('tied_up_capital_min')) body.tiedUpCapitalMin = tiedUpCapitalMin;
    if (params.has('tied_up_capital_max')) body.tiedUpCapitalMax = tiedUpCapitalMax;

    const blob = await apiFetch<Blob>('/api/client/export-pdf', {
      method: 'POST',
      token,
      body: JSON.stringify(body),
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dashboard-report.pdf';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      type="button"
      onClick={() => void exportPdf()}
      className="rounded border border-brand bg-brand px-4 py-2 text-sm font-medium text-white"
    >
      Exportar PDF
    </button>
  );
}
