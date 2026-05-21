import type { BranchDistributionPointDto, StockProductDto } from '@prudens/shared/types';

export function computeBranchDistribution(
  products: StockProductDto[],
): BranchDistributionPointDto[] {
  const map = new Map<string, { productCount: number; totalDistribution: number }>();

  for (const p of products) {
    const dist = p.distribution ?? 0;
    for (const branch of p.branchesWithStock) {
      const cur = map.get(branch) ?? { productCount: 0, totalDistribution: 0 };
      cur.productCount += 1;
      cur.totalDistribution += dist;
      map.set(branch, cur);
    }
  }

  return Array.from(map.entries())
    .map(([branch, v]) => ({
      branch,
      productCount: v.productCount,
      totalDistribution: v.totalDistribution,
    }))
    .sort((a, b) => a.branch.localeCompare(b.branch));
}
