'use client';

import type { ItemStatus } from '@prudens/shared/types';
import { STATUS_CONFIG, STATUS_DISPLAY_ORDER } from '@/lib/status-config';
import { getStatusColor } from '@/lib/status-colors';
import { strings } from '@/lib/strings';

interface Props {
  itemStatuses: ItemStatus[];
  onStatusToggle: (status: ItemStatus) => void;
}

export function StatusFilterGroup({ itemStatuses, onStatusToggle }: Props) {
  return (
    <fieldset className="min-w-0 shrink-0">
      <legend className="text-xs font-medium text-brand">{strings.nav.statusFilter}</legend>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
        {STATUS_DISPLAY_ORDER.map((status) => (
          <label key={status} className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={itemStatuses.includes(status)}
              onChange={() => onStatusToggle(status)}
            />
            <span
              className="inline-block h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: getStatusColor(status) }}
              aria-hidden
            />
            {STATUS_CONFIG[status].label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
