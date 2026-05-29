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

const filtersShape = {
  term: z.string().optional(),
  item_status: z
    .union([itemStatusEnum, z.array(itemStatusEnum), z.string()])
    .optional()
    .transform(parseItemStatuses),
  idd_min: z.coerce.number().min(-100).max(100).optional(),
  idd_max: z.coerce.number().min(-100).max(100).optional(),
  stock_days_min: z.coerce.number().min(0).max(365).optional(),
  stock_days_max: z.coerce.number().min(0).max(365).optional(),
  tied_up_capital_min: z.coerce.number().min(0).optional(),
  tied_up_capital_max: z.coerce.number().min(0).optional(),
};

const RANGE_PAIRS: [string, string][] = [
  ['idd_min', 'idd_max'],
  ['stock_days_min', 'stock_days_max'],
  ['tied_up_capital_min', 'tied_up_capital_max'],
  ['iddMin', 'iddMax'],
  ['stockDaysMin', 'stockDaysMax'],
  ['tiedUpCapitalMin', 'tiedUpCapitalMax'],
];

const RANGE_REFINE_MESSAGE =
  'Intervalo de filtro inválido: o valor mínimo não pode ser maior que o máximo.';

function withRangeRefine<T extends z.ZodTypeAny>(schema: T) {
  return schema.refine(
    (data) => {
      const d = data as Record<string, number | undefined>;
      for (const [minKey, maxKey] of RANGE_PAIRS) {
        const min = d[minKey];
        const max = d[maxKey];
        if (min != null && max != null && min > max) return false;
      }
      return true;
    },
    { message: RANGE_REFINE_MESSAGE },
  );
}

export const clientProductFiltersSchema = withRangeRefine(z.object(filtersShape));

export const clientProductsQuerySchema = withRangeRefine(
  z.object({
    ...filtersShape,
    sort: z.string().optional(),
    order: z.enum(['asc', 'desc']).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  }),
);

export type ClientProductFiltersInput = z.infer<typeof clientProductFiltersSchema>;
