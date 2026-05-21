import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { exportPdfService } from '../services/export-pdf-service.js';

const exportSchema = z.object({
  productIds: z.array(z.string().uuid()),
  filters: z.object({
    branches: z.array(z.string()),
    categories: z.array(z.string()),
    itemStatuses: z.array(z.enum(['critical', 'attention', 'adequate', 'excess'])),
  }),
});

export const clientExportRoutes: FastifyPluginAsync = async (app) => {
  app.post('/api/client/dashboard/export-pdf', async (request, reply) => {
    const body = exportSchema.parse(request.body);
    const pdf = await exportPdfService.generate(request.auth, body);
    return reply
      .header('Content-Type', 'application/pdf')
      .header('Content-Disposition', 'attachment; filename="dashboard-report.pdf"')
      .send(pdf);
  });
};
