'use client';

import type { ItemStatus } from '@prudens/shared/types';
import { STATUS_CONFIG, STATUS_DISPLAY_ORDER } from '@prudens/shared/status-config';
import { getStatusColor } from '@/lib/status-colors';
import { strings } from '@/lib/strings';

interface Props {
  itemStatuses: ItemStatus[];
  onStatusToggle: (status: ItemStatus) => void;
}

export function DashboardStatusFilter({ itemStatuses, onStatusToggle }: Props) {
  return (
    <div className="rounded-lg border border-border-default bg-surface-card p-4">
      <p className="text-xs font-medium text-brand">{strings.nav.statusFilter}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {STATUS_DISPLAY_ORDER.map((status) => {
          const active = itemStatuses.includes(status);
          const color = getStatusColor(status);
          return (
            <button
              key={status}
              type="button"
              aria-pressed={active}
              onClick={() => onStatusToggle(status)}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                active
                  ? 'border-brand bg-brand text-white'
                  : 'border-border-default bg-surface-page text-brand hover:border-brand/40'
              }`}
            >
              <span
                className="inline-block h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: active ? '#fff' : color }}
                aria-hidden
              />
              {STATUS_CONFIG[status].label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
