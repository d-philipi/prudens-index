import type { ItemStatus } from '@prudens/shared/types';

export interface ItemStatusInput {
  stockDays: number | null;
  idd: number | null;
}

/** Sole implementation of item status thresholds (constitution DRY). */
export function computeItemStatus(input: ItemStatusInput): ItemStatus {
  const days = input.stockDays;
  const idd = input.idd ?? 0;

  if (days != null && days < 7) return 'critical';
  if (days != null && days < 15) return 'attention';
  if (idd > 2 || (days != null && days > 90)) return 'excess';
  return 'adequate';
}
