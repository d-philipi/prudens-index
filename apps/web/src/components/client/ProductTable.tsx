'use client';

import type { ItemStatus, StockProductDto } from '@prudens/shared/types';
import { formatPercent } from '@/lib/formatters';
import { getStatusColor } from '@/lib/status-colors';
import { strings } from '@/lib/strings';
import { Pagination } from '@/components/shared/Pagination';

const COLUMNS: { key: keyof StockProductDto | 'itemStatus'; label: string }[] = [
  { key: 'productName', label: 'Produto' },
  { key: 'ean', label: 'EAN' },
  { key: 'storesWithStock', label: 'Lojas c/ estoque' },
  { key: 'distribution', label: 'Distribuição (%)' },
  { key: 'branchesWithDemand', label: 'Lojas c/ demanda' },
  { key: 'demandVsDistribution', label: 'Demanda x Dist. (%)' },
  { key: 'idd', label: 'IDD (%)' },
  { key: 'stock', label: 'Estoque' },
  { key: 'averageDemand', label: 'Demanda média' },
  { key: 'stockDays', label: 'Dias estoque' },
  { key: 'itemStatus', label: 'Status' },
];

const STATUS_LABELS: Record<ItemStatus, string> = strings.itemStatus;

function formatCell(p: StockProductDto, key: (typeof COLUMNS)[number]['key']): string {
  const v = p[key as keyof StockProductDto];
  if (v == null) return '—';
  if (key === 'itemStatus') return STATUS_LABELS[v as ItemStatus];
  if (key === 'distribution' || key === 'demandVsDistribution' || key === 'idd') {
    return formatPercent(Number(v), { decimals: 0 });
  }
  if (typeof v === 'number') return Number.isInteger(v) ? String(v) : v.toFixed(2);
  return String(v);
}

interface Props {
  products: StockProductDto[];
  total: number;
  currentPage: number;
  totalPages: number;
  sort: string;
  order: 'asc' | 'desc';
  onSort: (column: string) => void;
  onPageChange: (page: number) => void;
}

export function ProductTable({
  products,
  total,
  currentPage,
  totalPages,
  sort,
  order,
  onSort,
  onPageChange,
}: Props) {
  const SORT_KEY: Record<string, string> = {
    productName: 'product_name',
    ean: 'ean',
    storesWithStock: 'stores_with_stock',
    distribution: 'distribution',
    branchesWithDemand: 'branches_with_demand',
    demandVsDistribution: 'demand_vs_distribution',
    idd: 'idd',
    stock: 'stock',
    averageDemand: 'average_demand',
    stockDays: 'stock_days',
    itemStatus: 'item_status',
  };

  const toggleSort = (col: string) => {
    onSort(SORT_KEY[col] ?? 'idd');
  };

  const isActiveSort = (col: string) => sort === (SORT_KEY[col] ?? 'idd');

  return (
    <div className="overflow-x-auto rounded-lg border bg-white">
      <p className="border-b px-3 py-2 text-xs text-slate-500">
        {products.length} {strings.client.productsPageInfo} {total} {strings.client.productsLabel} ({strings.client.currentPage} {currentPage}/{totalPages})
      </p>
      <table className="min-w-full text-left text-sm">
        <thead className="sticky top-0 z-10 bg-slate-50 text-xs uppercase text-slate-600">
          <tr>
            {COLUMNS.map((col) => (
              <th key={col.key} className="px-3 py-2">
                <button
                  type="button"
                  className="cursor-pointer hover:underline"
                  onClick={() => toggleSort(col.key)}
                >
                  {col.label}
                  {isActiveSort(col.key) && (order === 'asc' ? ' ↑' : ' ↓')}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} className="border-t">
              {COLUMNS.map((col) => (
                <td key={col.key} className="whitespace-nowrap px-3 py-2">
                  {col.key === 'itemStatus' ? (
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: getStatusColor(p.itemStatus) }}
                      />
                      {formatCell(p, col.key)}
                    </span>
                  ) : (
                    formatCell(p, col.key)
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="border-t px-3 py-2">
        <Pagination totalPages={totalPages} currentPage={currentPage} onPageChange={onPageChange} />
      </div>
    </div>
  );
}
