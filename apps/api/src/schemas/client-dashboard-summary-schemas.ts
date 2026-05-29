import { z } from 'zod';
import type { ItemStatus } from '@prudens/shared/types';

const ITEM_STATUS_VALUES = [
  'critical_rupture',
  'low_stock',
  'unbalanced',
  'stuck_stock',
  'slight_excess',
  'healthy',
  'concentrated',
] as const satisfies readonly ItemStatus[];

const itemStatusEnum = z.enum(ITEM_STATUS_VALUES);

function parseItemStatuses(
  v: string | ItemStatus | ItemStatus[] | undefined,
): ItemStatus[] | undefined {
  if (v == null) return undefined;
  if (Array.isArray(v)) return v;
  if (typeof v === 'string' && v.includes(',')) {
    return v.split(',').map((s) => s.trim()) as ItemStatus[];
  }
  return [v as ItemStatus];
}

export const clientDashboardSummaryQuerySchema = z.object({
  item_status: z
    .union([itemStatusEnum, z.array(itemStatusEnum), z.string()])
    .optional()
    .transform(parseItemStatuses),
});

export type ClientDashboardSummaryQuery = z.infer<typeof clientDashboardSummaryQuerySchema>;
