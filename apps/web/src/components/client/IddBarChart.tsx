'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  YAxis,
} from 'recharts';
import type { ChartDataPointDto } from '@prudens/shared/types';
import { getStatusColor } from '@/lib/status-colors';
import { formatPercent } from '@/lib/formatters';
import { strings } from '@/lib/strings';

interface Props {
  data: ChartDataPointDto[];
}

export function IddBarChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <p className="rounded-lg border border-border-default bg-surface-card p-6 text-sm text-text-subtitle">
        {strings.client.noChartData}
      </p>
    );
  }

  return (
    <div className="w-full rounded-lg border border-border-default bg-surface-card p-4">
      <h2 className="mb-3 text-sm font-medium text-brand">{strings.client.chartTitle}</h2>
      <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e2de" />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip
            formatter={(value: number) => [formatPercent(Number(value)), 'IDD']}
            labelFormatter={(_label, payload) => {
              const point = payload?.[0]?.payload as { product_name?: string } | undefined;
              return point?.product_name ?? '—';
            }}
          />
          <Bar dataKey="idd" name="IDD">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getStatusColor(entry.item_status)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      </div>
    </div>
  );
}
