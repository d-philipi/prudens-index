import type { FastifyPluginAsync } from 'fastify';
import { clientOverviewService } from '../services/client-overview-service.js';

export const clientOverviewRoutes: FastifyPluginAsync = async (app) => {
  app.get('/api/client/overview', async (request, reply) => {
    const overview = await clientOverviewService.getOverview(request.auth);
    return reply.send(overview);
  });
};
