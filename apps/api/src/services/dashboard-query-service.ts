import type { AuthContext } from '../types/auth-context.js';
import { assertClient } from './auth-context-service.js';
import { importJobRepository } from '../repositories/import-job-repository.js';
import { stockProductRepository } from '../repositories/stock-product-repository.js';
import { toStockProductDto } from '../lib/mappers.js';

export const dashboardQueryService = {
  async getActiveProducts(ctx: AuthContext) {
    assertClient(ctx);
    const companyId = ctx.companyId!;
    const active = await importJobRepository.findActiveByCompany(companyId);
    if (!active) {
      return { items: [], total: 0, activeImportJobId: null };
    }
    const rows = await stockProductRepository.findByActiveImport(companyId, active.id);
    const items = rows.map(toStockProductDto);
    return { items, total: items.length, activeImportJobId: active.id };
  },
};
