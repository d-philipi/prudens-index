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
      <p className="rounded border bg-white p-6 text-sm text-slate-500">
        {strings.client.noChartData}
      </p>
    );
  }

  return (
    <div className="h-72 w-full rounded-lg border bg-white p-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip
            formatter={(value: number) => [formatPercent(Number(value)), 'IDD']}
            labelFormatter={(_label, payload) => {
              const point = payload?.[0]?.payload as { product_name?: string } | undefined;
              return `Produto: ${point?.product_name ?? '—'}`;
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
  );
}
