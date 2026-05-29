import type { FastifyPluginAsync } from 'fastify';
import {
  exportFileQuerySchema,
  exportJobIdParamsSchema,
} from '../schemas/client-export-schemas.js';
import { clientExportService } from '../services/client-export-service.js';
import { clientExportPdfService } from '../services/client-export-pdf-service.js';

export const clientExportRoutes: FastifyPluginAsync = async (app) => {
  app.get('/api/client/export/active-file', async (request, reply) => {
    try {
      const result = await clientExportService.getActiveFileExport(request.auth);
      const accept = request.headers.accept ?? '';
      const query = exportFileQuerySchema.parse(request.query);
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

  app.get('/api/client/export/versions', async (request, reply) => {
    const versions = await clientExportService.listVersions(request.auth);
    return reply.send(versions);
  });

  app.get('/api/client/export/files/:jobId', async (request, reply) => {
    try {
      const { jobId } = exportJobIdParamsSchema.parse(request.params);
      const query = exportFileQuerySchema.parse(request.query);
      const result = await clientExportService.getFileByJobId(request.auth, jobId);
      const accept = request.headers.accept ?? '';
      const prefersJson = accept.includes('application/json') || query.format === 'json';

      if (prefersJson) {
        return reply.send(result);
      }

      return reply.redirect(result.url, 302);
    } catch (err) {
      const e = err as Error & { statusCode?: number };
      if (e.statusCode === 403) {
        return reply.status(403).send({ code: 'FORBIDDEN', message: e.message });
      }
      if (e.statusCode === 404) {
        return reply.status(404).send({ code: 'NOT_FOUND', message: e.message });
      }
      throw err;
    }
  });

  app.post('/api/client/export/pdf', async (request, reply) => {
    try {
      const pdf = await clientExportPdfService.generateDashboardPdf(request.auth);
      return reply
        .header('Content-Type', 'application/pdf')
        .header('Content-Disposition', 'attachment; filename="relatorio-estoque.pdf"')
        .send(pdf);
    } catch (err) {
      const e = err as Error & { statusCode?: number };
      if (e.statusCode === 404) {
        return reply.status(404).send({ code: 'NO_ACTIVE_IMPORT', message: e.message });
      }
      throw err;
    }
  });
};
