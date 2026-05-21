import { computeDashboardSummary } from '@prudens/domain-metrics';
import type { AuthContext } from '../types/auth-context.js';
import { assertClient } from './auth-context-service.js';
import { dashboardQueryService } from './dashboard-query-service.js';

export const stockSummaryService = {
  async getSummary(ctx: AuthContext) {
    const { items, activeImportJobId } = await dashboardQueryService.getActiveProducts(ctx);
    return computeDashboardSummary(items, activeImportJobId);
  },
};
