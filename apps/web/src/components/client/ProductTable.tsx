'use client';

import type { StockProductDto } from '@prudens/shared/types';
import { ColumnHeader } from '@/features/dashboard/components/ColumnHeader';
import { COLUMN_TOOLTIPS } from '@/lib/column-tooltips';
import { formatCurrency, formatPercent, formatUnitPrice } from '@/lib/formatters';
import { iddTableColor } from '@/lib/idd-display';
import { strings } from '@/lib/strings';
import { Pagination } from '@/components/shared/Pagination';
import { StatusBadge } from '@/components/shared/StatusBadge';

const COLUMNS: {
  key: keyof StockProductDto | 'itemStatus';
  label: string;
  mono?: boolean;
  minWidth: string;
}[] = [
  { key: 'productName', label: 'Produto', minWidth: '10rem' },
  { key: 'ean', label: 'EAN', mono: true, minWidth: '7rem' },
  { key: 'storesWithStock', label: 'Lojas c/ estoque', minWidth: '4.5rem' },
  { key: 'distribution', label: 'Distribuição (%)', minWidth: '4.5rem' },
  { key: 'branchesWithDemand', label: 'Lojas c/ demanda', minWidth: '4.5rem' },
  { key: 'demandVsDistribution', label: 'Demanda x Dist. (%)', minWidth: '5rem' },
  { key: 'idd', label: 'IDD (%)', mono: true, minWidth: '4rem' },
  { key: 'stock', label: 'Estoque', minWidth: '4rem' },
  { key: 'averageDemand', label: 'Demanda média', minWidth: '5rem' },
  { key: 'stockDays', label: 'Dias estoque', minWidth: '4.5rem' },
  {
    key: 'unitPrice',
    label: strings.client.unitPriceShort,
    mono: true,
    minWidth: '5rem',
  },
  {
    key: 'projectedRevenue',
    label: strings.client.projectedRevenueShort,
    mono: true,
    minWidth: '5.5rem',
  },
  {
    key: 'tiedUpCapital',
    label: strings.client.tiedUpCapitalShort,
    mono: true,
    minWidth: '5.5rem',
  },
  {
    key: 'lostRevenue',
    label: strings.client.lostRevenueShort,
    mono: true,
    minWidth: '5rem',
  },
  { key: 'itemStatus', label: 'Status', minWidth: '6.5rem' },
];

function formatCell(p: StockProductDto, key: (typeof COLUMNS)[number]['key']): string {
  const v = p[key as keyof StockProductDto];
  if (v == null) return '—';
  if (key === 'distribution' || key === 'demandVsDistribution' || key === 'idd') {
    return formatPercent(Number(v), { decimals: 0 });
  }
  if (key === 'unitPrice') return formatUnitPrice(Number(v));
  if (key === 'projectedRevenue' || key === 'tiedUpCapital' || key === 'lostRevenue') {
    return formatCurrency(Number(v));
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
    unitPrice: 'unit_price',
    projectedRevenue: 'projected_revenue',
    tiedUpCapital: 'tied_up_capital',
    lostRevenue: 'lost_revenue',
    itemStatus: 'item_status',
  };

  const toggleSort = (col: string) => {
    onSort(SORT_KEY[col] ?? 'idd');
  };

  const isActiveSort = (col: string) => sort === (SORT_KEY[col] ?? 'idd');

  return (
    <div className="flex h-[100dvh] min-h-[28rem] flex-col overflow-hidden rounded-lg border border-border-default bg-surface-card">
      <p className="shrink-0 border-b border-border-default px-3 py-2 text-xs text-text-subtitle">
        {products.length} {strings.client.productsPageInfo} {total} {strings.client.productsLabel}{' '}
        ({strings.client.currentPage} {currentPage}/{totalPages})
      </p>
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-max min-w-full text-left text-xs md:text-sm">
          <thead className="sticky top-0 z-10 border-b border-border-default bg-surface-page">
            <tr>
              {COLUMNS.map((col) => (
                <ColumnHeader
                  key={col.key}
                  label={col.label}
                  tooltip={COLUMN_TOOLTIPS[col.key] ?? col.label}
                  active={isActiveSort(col.key)}
                  direction={order}
                  onSort={() => toggleSort(col.key)}
                />
              ))}
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t border-border-default">
                {COLUMNS.map((col) => (
                  <td
                    key={col.key}
                    className={`px-2 py-2 align-middle ${col.mono ? 'font-mono tabular-nums' : ''}`}
                    style={{ minWidth: col.minWidth }}
                    title={col.key === 'productName' ? p.productName : undefined}
                  >
                    {col.key === 'itemStatus' ? (
                      <StatusBadge status={p.itemStatus} actionInsight={p.actionInsight} />
                    ) : (
                      <span
                        className={
                          col.key === 'productName'
                            ? 'line-clamp-2 break-words'
                            : 'block truncate'
                        }
                        style={
                          col.key === 'idd' && p.idd != null
                            ? { color: iddTableColor(p.idd) }
                            : undefined
                        }
                      >
                        {formatCell(p, col.key)}
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="shrink-0 border-t border-border-default bg-surface-card px-3 py-2">
        <Pagination totalPages={totalPages} currentPage={currentPage} onPageChange={onPageChange} />
      </div>
    </div>
  );
}
