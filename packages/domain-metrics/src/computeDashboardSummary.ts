import type { DashboardSummaryDto, ItemStatus, StockProductDto } from '@prudens/shared/types';

export function computeDashboardSummary(
  products: StockProductDto[],
  activeImportJobId: string | null,
): DashboardSummaryDto {
  const counts: Record<ItemStatus, number> = {
    critical: 0,
    attention: 0,
    adequate: 0,
    excess: 0,
  };
  let stockDaysSum = 0;
  let stockDaysCount = 0;

  for (const p of products) {
    counts[p.itemStatus]++;
    if (p.stockDays != null) {
      stockDaysSum += p.stockDays;
      stockDaysCount++;
    }
  }

  return {
    totalProducts: products.length,
    criticalCount: counts.critical,
    attentionCount: counts.attention,
    adequateCount: counts.adequate,
    excessCount: counts.excess,
    avgStockDays: stockDaysCount > 0 ? stockDaysSum / stockDaysCount : 0,
    activeImportJobId,
  };
}
