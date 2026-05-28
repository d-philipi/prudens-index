'use client';

import { ChevronDown } from 'lucide-react';
import type { ItemStatus } from '@prudens/shared/types';
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
  tiedUpCapitalSliderMax: number;
  showClear: boolean;
  onTermChange: (v: string) => void;
  onStatusToggle: (s: ItemStatus) => void;
  onIddMinChange: (v: number) => void;
  onIddMaxChange: (v: number) => void;
  onStockDaysMinChange: (v: number) => void;
  onStockDaysMaxChange: (v: number) => void;
  onTiedUpCapitalMinChange: (v: number) => void;
  onTiedUpCapitalMaxChange: (v: number) => void;
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
  tiedUpCapitalSliderMax,
  showClear,
  onTermChange,
  onStatusToggle,
  onIddMinChange,
  onIddMaxChange,
  onStockDaysMinChange,
  onStockDaysMaxChange,
  onTiedUpCapitalMinChange,
  onTiedUpCapitalMaxChange,
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
          open ? 'max-h-[480px]' : 'max-h-0'
        }`}
      >
        <div className="grid gap-4 border-t border-border-default px-3 py-3 md:grid-cols-2 lg:grid-cols-3">
          <div>
            <label htmlFor="product-search" className="text-xs font-medium text-brand">
              {strings.nav.searchProduct}
            </label>
            <input
              id="product-search"
              type="search"
              value={term}
              onChange={(e) => onTermChange(e.target.value)}
              className="mt-1 w-full rounded border border-border-default px-3 py-2 text-sm"
            />
          </div>
          <fieldset>
            <legend className="text-xs font-medium text-brand">{strings.nav.statusFilter}</legend>
            <div className="mt-2 space-y-2">
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
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-brand">
                {strings.nav.iddRange}: {iddMin} — {iddMax}
              </label>
              <div className="mt-1 flex gap-2">
                <input
                  type="range"
                  min={-100}
                  max={iddMax}
                  value={iddMin}
                  onChange={(e) => onIddMinChange(Number(e.target.value))}
                  className="w-full"
                />
                <input
                  type="range"
                  min={iddMin}
                  max={100}
                  value={iddMax}
                  onChange={(e) => onIddMaxChange(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-brand">
                {strings.nav.stockDaysRange}: {stockDaysMin} — {stockDaysMax}
              </label>
              <div className="mt-1 flex gap-2">
                <input
                  type="range"
                  min={0}
                  max={stockDaysMax}
                  value={stockDaysMin}
                  onChange={(e) => onStockDaysMinChange(Number(e.target.value))}
                  className="w-full"
                />
                <input
                  type="range"
                  min={stockDaysMin}
                  max={365}
                  value={stockDaysMax}
                  onChange={(e) => onStockDaysMaxChange(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
            {tiedUpCapitalSliderMax > 0 ? (
              <div>
                <label className="text-xs font-medium text-brand">
                  {strings.nav.capitalRange}: {tiedUpCapitalMin} — {tiedUpCapitalMax}
                </label>
                <div className="mt-1 flex gap-2">
                  <input
                    type="range"
                    min={0}
                    max={tiedUpCapitalMax}
                    value={tiedUpCapitalMin}
                    onChange={(e) => onTiedUpCapitalMinChange(Number(e.target.value))}
                    className="w-full"
                  />
                  <input
                    type="range"
                    min={tiedUpCapitalMin}
                    max={tiedUpCapitalSliderMax}
                    value={tiedUpCapitalMax}
                    onChange={(e) => onTiedUpCapitalMaxChange(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
