'use client';

import { ChevronDown } from 'lucide-react';
import type { ItemStatus } from '@prudens/shared/types';
import { RangeFilter } from '@/features/dashboard/components/RangeFilter';
import { formatCurrency, formatPercent } from '@/lib/formatters';
import { statusColor } from '@/lib/idd-display';
import { strings } from '@/lib/strings';

interface Props {
  open: boolean;
  onToggle: () => void;
  term: string;
  itemStatuses: ItemStatus[];
  iddMin: number;
  iddMax: number;
  stockDaysMin: number;
  stockDaysMax: number;
  tiedUpCapitalMin: number;
  tiedUpCapitalMax: number;
  boundsIdd: [number, number];
  boundsStockDays: [number, number];
  boundsCapital: [number, number];
  showClear: boolean;
  onTermChange: (v: string) => void;
  onStatusToggle: (s: ItemStatus) => void;
  onIddChange: (v: [number, number]) => void;
  onStockDaysChange: (v: [number, number]) => void;
  onTiedUpCapitalChange: (v: [number, number]) => void;
  onClear: () => void;
}

const ALL_STATUSES: ItemStatus[] = ['distribution', 'adequate', 'boost'];

export function FilterBar({
  open,
  onToggle,
  term,
  itemStatuses,
  iddMin,
  iddMax,
  stockDaysMin,
  stockDaysMax,
  tiedUpCapitalMin,
  tiedUpCapitalMax,
  boundsIdd,
  boundsStockDays,
  boundsCapital,
  showClear,
  onTermChange,
  onStatusToggle,
  onIddChange,
  onStockDaysChange,
  onTiedUpCapitalChange,
  onClear,
}: Props) {
  return (
    <div className="rounded-lg border border-border-default bg-surface-card">
      <div className="flex items-center justify-end gap-2 px-3 py-2">
        {showClear ? (
          <button
            type="button"
            onClick={onClear}
            className="text-xs font-medium text-brand underline-offset-2 hover:underline"
          >
            {strings.nav.clearFilters}
          </button>
        ) : null}
        <button
          type="button"
          onClick={onToggle}
          className="flex items-center gap-1 text-sm font-medium text-brand"
          aria-expanded={open}
        >
          {strings.nav.filters}
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            aria-hidden
          />
        </button>
      </div>
      <div
        className={`overflow-hidden transition-[max-height] duration-200 ease-in-out ${
          open ? 'max-h-[28rem]' : 'max-h-0'
        }`}
      >
        <div className="flex flex-col gap-4 border-t border-border-default px-3 py-3">
          <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-end md:gap-6">
            <div className="min-w-[12rem] flex-1 md:max-w-md">
              <label htmlFor="product-search" className="text-xs font-medium text-brand">
                {strings.nav.searchProduct}
              </label>
              <input
                id="product-search"
                type="search"
                value={term}
                onChange={(e) => onTermChange(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border-default px-3 py-2 text-sm"
              />
            </div>
            <fieldset className="min-w-0 shrink-0">
              <legend className="text-xs font-medium text-brand">{strings.nav.statusFilter}</legend>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
                {ALL_STATUSES.map((status) => (
                  <label key={status} className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={itemStatuses.includes(status)}
                      onChange={() => onStatusToggle(status)}
                    />
                    <span
                      className="inline-block h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: statusColor(status) }}
                      aria-hidden
                    />
                    {strings.itemStatus[status]}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:flex-nowrap lg:items-end">
            <RangeFilter
              label={strings.nav.iddRange}
              min={boundsIdd[0]}
              max={boundsIdd[1]}
              value={[iddMin, iddMax]}
              onChange={onIddChange}
              formatLabel={(lo, hi) =>
                `Produtos com IDD entre ${formatPercent(lo, { decimals: 0 })} e ${formatPercent(hi, { decimals: 0 })}`
              }
            />
            <RangeFilter
              label={strings.nav.stockDaysRange}
              min={boundsStockDays[0]}
              max={boundsStockDays[1]}
              value={[stockDaysMin, stockDaysMax]}
              onChange={onStockDaysChange}
              formatLabel={(_lo, hi) => `Estoque para até ${Math.round(hi)} dias`}
            />
            {boundsCapital[1] > 0 ? (
              <RangeFilter
                label={strings.nav.capitalRange}
                min={boundsCapital[0]}
                max={boundsCapital[1]}
                value={[tiedUpCapitalMin, tiedUpCapitalMax]}
                onChange={onTiedUpCapitalChange}
                formatLabel={(lo, hi) =>
                  `Capital imobilizado entre ${formatCurrency(lo)} e ${formatCurrency(hi)}`
                }
              />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
