import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { stockSummaryService } from '../services/stock-summary-service.js';
import { dashboardQueryService } from '../services/dashboard-query-service.js';
import { branchDistributionService } from '../services/branch-distribution-service.js';

export const clientDashboardRoutes: FastifyPluginAsync = async (app) => {
  app.get('/api/client/dashboard/summary', async (request, reply) => {
    const summary = await stockSummaryService.getSummary(request.auth);
    return reply.send(summary);
  });

  app.get('/api/client/dashboard/products', async (request, reply) => {
    const query = z
      .object({ page: z.coerce.number().optional(), pageSize: z.coerce.number().max(5000).optional() })
      .parse(request.query);
    const result = await dashboardQueryService.getActiveProducts(request.auth);
    const pageSize = query.pageSize ?? 5000;
    return reply.send({
      items: result.items.slice(0, pageSize),
      total: result.total,
    });
  });

  app.get('/api/client/dashboard/branch-distribution', async (request, reply) => {
    const data = await branchDistributionService.getDistribution(request.auth);
    return reply.send(data);
  });
};
