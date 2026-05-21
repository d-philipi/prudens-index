import { computeBranchDistribution } from '@prudens/domain-metrics';
import type { AuthContext } from '../types/auth-context.js';
import { dashboardQueryService } from './dashboard-query-service.js';

export const branchDistributionService = {
  async getDistribution(ctx: AuthContext) {
    const { items } = await dashboardQueryService.getActiveProducts(ctx);
    return computeBranchDistribution(items);
  },
};
