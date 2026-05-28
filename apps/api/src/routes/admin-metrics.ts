import type { FastifyPluginAsync } from 'fastify';
import { assertAdmin } from '../services/auth-context-service.js';
import { adminMetricsService } from '../services/admin-metrics-service.js';

export const adminMetricsRoutes: FastifyPluginAsync = async (app) => {
  app.get('/api/admin/metrics', async (request, reply) => {
    assertAdmin(request.auth);
    const metrics = await adminMetricsService.getMetrics();
    return reply.send(metrics);
  });
};
