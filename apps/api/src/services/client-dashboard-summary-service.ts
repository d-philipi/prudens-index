import type { ClientDashboardSummaryDto } from '@prudens/shared/types';
import type { AuthContext } from '../types/auth-context.js';
import { assertClient } from './auth-context-service.js';
import { importJobRepository } from '../repositories/import-job-repository.js';
import { stockProductRepository } from '../repositories/stock-product-repository.js';
import type { ItemStatus } from '@prudens/shared/types';

export const clientDashboardSummaryService = {
  async getSummary(
    ctx: AuthContext,
    itemStatuses?: ItemStatus[],
  ): Promise<ClientDashboardSummaryDto> {
    assertClient(ctx);
    const companyId = ctx.companyId!;
    const active = await importJobRepository.findActiveByCompany(companyId);

    if (!active) {
      const err = new Error('Nenhuma importação ativa encontrada para sua empresa.') as Error & {
        statusCode: number;
      };
      err.statusCode = 404;
      throw err;
    }

    return stockProductRepository.aggregateExecutiveSummary({
      companyId,
      importJobId: active.id,
      itemStatuses,
    });
  },
};
