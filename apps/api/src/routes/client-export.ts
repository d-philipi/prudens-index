import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { clientExportService } from '../services/client-export-service.js';

export const clientExportRoutes: FastifyPluginAsync = async (app) => {
  app.get('/api/client/export/active-file', async (request, reply) => {
    try {
      const result = await clientExportService.getActiveFileExport(request.auth);
      const accept = request.headers.accept ?? '';
      const query = z.object({ format: z.string().optional() }).parse(request.query);
      const prefersJson = accept.includes('application/json') || query.format === 'json';

      if (prefersJson) {
        return reply.send(result);
      }

      return reply.redirect(result.url, 302);
    } catch (err) {
      const e = err as Error & { statusCode?: number };
      if (e.statusCode === 404) {
        return reply.status(404).send({
          code: 'NO_ACTIVE_IMPORT',
          message: e.message,
        });
      }
      throw err;
    }
  });
};
