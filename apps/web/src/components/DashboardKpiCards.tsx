'use client';

import type { DashboardSummaryDto } from '@prudens/shared/types';

interface Props {
  summary: DashboardSummaryDto;
}

export function DashboardKpiCards({ summary }: Props) {
  const cards = [
    { label: 'Produtos', value: summary.totalProducts },
    { label: 'Críticos', value: summary.criticalCount },
    { label: 'Atenção', value: summary.attentionCount },
    { label: 'Adequados', value: summary.adequateCount },
    { label: 'Excesso', value: summary.excessCount },
    { label: 'Média dias estoque', value: summary.avgStockDays.toFixed(1) },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
      {cards.map((c) => (
        <div key={c.label} className="rounded-lg border bg-white p-3 shadow-sm">
          <p className="text-xs text-slate-500">{c.label}</p>
          <p className="text-lg font-semibold">{c.value}</p>
        </div>
      ))}
    </div>
  );
}
