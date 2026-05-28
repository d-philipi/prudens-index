import type { ItemStatus } from '@prudens/shared/types';

/** Sole implementation of item status from IDD thresholds (constitution DRY). */
export function computeItemStatusFromIdd(idd: number | null | undefined): ItemStatus {
  if (idd == null || Number.isNaN(idd)) {
    throw new Error('IDD_REQUIRED');
  }
  if (idd < 0) return 'distribution';
  if (idd <= 20) return 'adequate';
  return 'boost';
}
