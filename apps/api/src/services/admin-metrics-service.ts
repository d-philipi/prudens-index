import type { AdminMetricsDto } from '@prudens/shared/types';
import { companyRepository } from '../repositories/company-repository.js';

function parseAvg(v: string | null): number | null {
  if (v == null) return null;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
}

export const adminMetricsService = {
  async getMetrics(): Promise<AdminMetricsDto> {
    const [totalCompanies, totalProducts, avgRows] = await Promise.all([
      companyRepository.countCompanies(),
      companyRepository.countAllActiveProducts(),
      companyRepository.avgIddGroupedByCompany(),
    ]);

    return {
      totalCompanies,
      totalProducts,
      avgIddByCompany: avgRows.map((r) => ({
        companyId: r.companyId,
        companyName: r.companyName,
        avgIdd: parseAvg(r.avgIdd),
      })),
    };
  },
};
