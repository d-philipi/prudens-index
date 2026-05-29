import type { NumericRangeDto, ProductRangesResponseDto } from '@prudens/shared/types';
import type { AuthContext } from '../types/auth-context.js';
import { assertClient } from './auth-context-service.js';
import { importJobRepository } from '../repositories/import-job-repository.js';
import { stockProductRepository } from '../repositories/stock-product-repository.js';

function toRange(min: number | null, max: number | null): NumericRangeDto | null {
  if (min == null || max == null) return null;
  return { min, max };
}

export const clientProductsRangesService = {
  async getRanges(ctx: AuthContext): Promise<ProductRangesResponseDto> {
    assertClient(ctx);
    const companyId = ctx.companyId!;
    const active = await importJobRepository.findActiveByCompany(companyId);

    if (!active || active.status !== 'completed') {
      return {
        hasActiveJob: false,
        idd: null,
        stockDays: null,
        tiedUpCapital: null,
      };
    }

    const agg = await stockProductRepository.aggregateRanges(active.id);

    return {
      hasActiveJob: true,
      idd: toRange(agg.iddMin, agg.iddMax),
      stockDays: toRange(agg.stockDaysMin, agg.stockDaysMax),
      tiedUpCapital: toRange(agg.tiedUpCapitalMin, agg.tiedUpCapitalMax),
    };
  },
};
