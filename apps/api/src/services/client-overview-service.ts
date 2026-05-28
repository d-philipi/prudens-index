import type { ClientOverviewDto } from '@prudens/shared/types';
import type { AuthContext } from '../types/auth-context.js';
import { assertClient } from './auth-context-service.js';
import { companyRepository } from '../repositories/company-repository.js';
import { importJobRepository } from '../repositories/import-job-repository.js';
import { stockProductRepository } from '../repositories/stock-product-repository.js';

export const clientOverviewService = {
  async getOverview(ctx: AuthContext): Promise<ClientOverviewDto> {
    assertClient(ctx);
    const companyId = ctx.companyId!;
    const company = await companyRepository.findById(companyId);
    const active = await importJobRepository.findActiveByCompany(companyId);

    if (!company || !active) {
      return {
        companyName: company?.name ?? 'Empresa',
        avgIdd: null,
        lastUpdatedAt: null,
      };
    }

    const avgIdd = await stockProductRepository.avgIddForCompany(companyId, active.id);

    return {
      companyName: company.name,
      avgIdd,
      lastUpdatedAt: active.completedAt?.toISOString() ?? null,
    };
  },
};
