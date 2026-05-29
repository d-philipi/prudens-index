import type { FastifyPluginAsync } from 'fastify';
import { clientDashboardSummaryQuerySchema } from '../schemas/client-dashboard-summary-schemas.js';
import { clientDashboardSummaryService } from '../services/client-dashboard-summary-service.js';

export const clientDashboardSummaryRoutes: FastifyPluginAsync = async (app) => {
  app.get('/api/client/dashboard/summary', async (request, reply) => {
    try {
      const query = clientDashboardSummaryQuerySchema.parse(request.query);
      const summary = await clientDashboardSummaryService.getSummary(
        request.auth,
        query.item_status,
      );
      return reply.send(summary);
    } catch (err) {
      const e = err as Error & { statusCode?: number };
      if (e.statusCode === 404) {
        return reply.status(404).send({ code: 'NO_ACTIVE_IMPORT', message: e.message });
      }
      throw err;
    }
  });
};
