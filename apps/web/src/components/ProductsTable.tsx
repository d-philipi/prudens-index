'use client';

import { useState } from 'react';
import type { StockProductDto } from '@prudens/shared/types';

const PAGE_SIZE = 25;

interface Props {
  products: StockProductDto[];
}

export function ProductsTable({ products }: Props) {
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(products.length / PAGE_SIZE));
  const slice = products.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  if (products.length === 0) {
    return <p className="text-sm text-slate-600">Nenhum produto nesta visão.</p>;
  }

  return (
    <div className="overflow-x-auto rounded border bg-white">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b bg-slate-50 text-xs uppercase text-slate-600">
          <tr>
            <th className="px-3 py-2">Produto</th>
            <th className="px-3 py-2">EAN</th>
            <th className="px-3 py-2">Filiais (estoque)</th>
            <th className="px-3 py-2">IDD</th>
            <th className="px-3 py-2">Estoque</th>
            <th className="px-3 py-2">Dias estoque</th>
            <th className="px-3 py-2">Situação</th>
          </tr>
        </thead>
        <tbody>
          {slice.map((p) => (
            <tr key={p.id} className="border-b last:border-0">
              <td className="px-3 py-2">{p.productName}</td>
              <td className="px-3 py-2">{p.ean ?? '—'}</td>
              <td className="max-w-[200px] truncate px-3 py-2" title={p.branchesWithStock.join(', ')}>
                {p.branchesWithStock.join(', ') || '—'}
              </td>
              <td className="px-3 py-2">{p.idd ?? '—'}</td>
              <td className="px-3 py-2">{p.stock ?? '—'}</td>
              <td className="px-3 py-2">{p.stockDays ?? '—'}</td>
              <td className="px-3 py-2 capitalize">{p.itemStatus}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex items-center justify-between border-t px-3 py-2 text-sm">
        <button
          type="button"
          disabled={page === 0}
          className="disabled:opacity-40"
          onClick={() => setPage((p) => p - 1)}
        >
          Anterior
        </button>
        <span>
          {page + 1} / {totalPages}
        </span>
        <button
          type="button"
          disabled={page >= totalPages - 1}
          className="disabled:opacity-40"
          onClick={() => setPage((p) => p + 1)}
        >
          Próxima
        </button>
      </div>
    </div>
  );
}
