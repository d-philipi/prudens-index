'use client';

import type { ItemStatus } from '@prudens/shared/types';

const STATUS_LABELS: Record<ItemStatus, string> = {
  distribution: 'Redistribuição',
  adequate: 'Adequado',
  boost: 'Impulsionar',
};

interface Props {
  term: string;
  itemStatuses: ItemStatus[];
  onTermChange: (term: string) => void;
  onStatusToggle: (status: ItemStatus) => void;
}

export function FilterSidebar({
  term,
  itemStatuses,
  onTermChange,
  onStatusToggle,
}: Props) {
  return (
    <aside className="w-full shrink-0 space-y-4 rounded-lg border bg-white p-4 lg:w-56">
      <div>
        <label htmlFor="product-search" className="text-sm font-medium">
          Buscar produto
        </label>
        <input
          id="product-search"
          type="search"
          value={term}
          onChange={(e) => onTermChange(e.target.value)}
          placeholder="Nome ou EAN…"
          className="mt-1 w-full rounded border px-3 py-2 text-sm"
        />
      </div>
      <fieldset>
        <legend className="text-sm font-medium">Status do item</legend>
        <div className="mt-2 space-y-2">
          {(Object.keys(STATUS_LABELS) as ItemStatus[]).map((status) => (
            <label key={status} className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={itemStatuses.includes(status)}
                onChange={() => onStatusToggle(status)}
              />
              {STATUS_LABELS[status]}
            </label>
          ))}
        </div>
      </fieldset>
    </aside>
  );
}
