import type { ItemStatus } from '@prudens/shared/types';

const STATUS_COLORS: Record<ItemStatus, string> = {
  distribution: 'hsl(0 72% 50%)',
  adequate: 'hsl(142 52% 40%)',
  boost: 'hsl(38 92% 50%)',
};

export function getStatusColor(status: ItemStatus): string {
  return STATUS_COLORS[status];
}

export const ITEM_STATUS_CHART_COLORS = STATUS_COLORS;
