import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { exportPdfService } from '../services/export-pdf-service.js';

const exportSchema = z.object({
  term: z.string().optional(),
  itemStatuses: z.array(z.enum(['distribution', 'adequate', 'boost'])).default([]),
});

export const clientExportRoutes: FastifyPluginAsync = async (app) => {
  app.post('/api/client/export-pdf', async (request, reply) => {
    const body = exportSchema.parse(request.body ?? {});
    const pdf = await exportPdfService.generate(request.auth, body);
    return reply
      .header('Content-Type', 'application/pdf')
      .header('Content-Disposition', 'attachment; filename="dashboard-report.pdf"')
      .send(pdf);
  });
};
