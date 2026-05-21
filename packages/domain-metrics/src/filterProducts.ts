import type { DashboardFiltersDto, StockProductDto } from '@prudens/shared/types';

/** Sole client-side filter logic (SC-003). */
export function filterProducts(
  products: StockProductDto[],
  filters: DashboardFiltersDto,
): StockProductDto[] {
  return products.filter((p) => {
    if (filters.branches.length > 0) {
      const match = filters.branches.some((b) => p.branchesWithStock.includes(b));
      if (!match) return false;
    }
    if (filters.categories.length > 0 && !filters.categories.includes(p.category)) {
      return false;
    }
    if (filters.itemStatuses.length > 0 && !filters.itemStatuses.includes(p.itemStatus)) {
      return false;
    }
    return true;
  });
}
