import type { ItemStatus } from '@prudens/shared/types';
import { STATUS_COLORS, statusColor } from '@/lib/idd-display';

export function getStatusColor(status: ItemStatus): string {
  return statusColor(status);
}

export const ITEM_STATUS_CHART_COLORS = STATUS_COLORS;
