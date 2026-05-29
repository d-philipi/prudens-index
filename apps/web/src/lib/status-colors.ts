import type { ItemStatus } from '@prudens/shared/types';
import { STATUS_CONFIG } from '@/lib/status-config';

export function getStatusColor(status: ItemStatus): string {
  return STATUS_CONFIG[status]?.color ?? '#6b7280';
}
