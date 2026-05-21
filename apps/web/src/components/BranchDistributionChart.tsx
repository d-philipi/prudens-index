'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { BranchDistributionPointDto } from '@prudens/shared/types';

interface Props {
  data: BranchDistributionPointDto[];
}

export function BranchDistributionChart({ data }: Props) {
  if (data.length === 0) {
    return <p className="text-sm text-slate-600">Sem dados de filiais.</p>;
  }

  return (
    <div className="h-64 w-full rounded border bg-white p-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="branch" tick={{ fontSize: 10 }} interval={0} angle={-25} textAnchor="end" height={60} />
          <YAxis />
          <Tooltip />
          <Bar dataKey="productCount" fill="#2563eb" name="Produtos" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
