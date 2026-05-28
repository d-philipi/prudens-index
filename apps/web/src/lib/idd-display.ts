import type { ItemStatus } from '@prudens/shared/types';

export function iddHeroColor(idd: number | null | undefined): string {
  if (idd == null || Number.isNaN(idd)) return '#ffffff';
  if (idd < 0) return '#f87878';
  return '#86efac';
}

export function iddTableColor(idd: number | null | undefined): string {
  if (idd == null || Number.isNaN(idd)) return 'inherit';
  if (idd < 0) return '#e84040';
  if (idd <= 20) return '#16a34a';
  return '#f59e0b';
}

export const STATUS_COLORS: Record<ItemStatus, string> = {
  distribution: '#e84040',
  adequate: '#16a34a',
  boost: '#f59e0b',
};

export function statusColor(status: ItemStatus): string {
  return STATUS_COLORS[status];
}
