'use client';

import type { DashboardFiltersDto, ItemStatus, StockProductDto } from '@prudens/shared/types';

interface Props {
  products: StockProductDto[];
  filters: DashboardFiltersDto;
  onChange: (partial: Partial<DashboardFiltersDto>) => void;
  onClear: () => void;
}

export function DashboardFilters({ products, filters, onChange, onClear }: Props) {
  const branches = Array.from(
    new Set(products.flatMap((p) => p.branchesWithStock)),
  ).sort();
  const categories = Array.from(new Set(products.map((p) => p.category))).sort();
  const statuses: ItemStatus[] = ['critical', 'attention', 'adequate', 'excess'];

  const toggle = <T extends string>(arr: T[], v: T): T[] =>
    arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

  return (
    <div className="flex flex-wrap gap-4 rounded border bg-white p-4 text-sm">
      <fieldset>
        <legend className="mb-1 font-medium">Filial</legend>
        <div className="flex max-h-24 flex-wrap gap-2 overflow-y-auto">
          {branches.map((b) => (
            <label key={b} className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={filters.branches.includes(b)}
                onChange={() => onChange({ branches: toggle(filters.branches, b) })}
              />
              {b}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-1 font-medium">Categoria</legend>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <label key={c} className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={filters.categories.includes(c)}
                onChange={() => onChange({ categories: toggle(filters.categories, c) })}
              />
              {c}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-1 font-medium">Situação</legend>
        <div className="flex flex-wrap gap-2">
          {statuses.map((s) => (
            <label key={s} className="flex items-center gap-1 capitalize">
              <input
                type="checkbox"
                checked={filters.itemStatuses.includes(s)}
                onChange={() =>
                  onChange({ itemStatuses: toggle(filters.itemStatuses, s) })
                }
              />
              {s}
            </label>
          ))}
        </div>
      </fieldset>
      <button
        type="button"
        className="self-end rounded border px-3 py-1 text-slate-600 hover:bg-slate-50"
        onClick={onClear}
      >
        Limpar filtros
      </button>
    </div>
  );
}
