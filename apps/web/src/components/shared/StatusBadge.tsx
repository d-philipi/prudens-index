import type { ItemStatus } from '@prudens/shared/types';
import { statusColor } from '@/lib/idd-display';
import { strings } from '@/lib/strings';

interface Props {
  status: ItemStatus;
}

export function StatusBadge({ status }: Props) {
  const color = statusColor(status);
  return (
    <span
      className="inline-flex items-center rounded-full border border-border-default px-2 py-0.5 text-[11px] font-medium"
      style={{ color, backgroundColor: `${color}18` }}
    >
      {strings.itemStatus[status]}
    </span>
  );
}
