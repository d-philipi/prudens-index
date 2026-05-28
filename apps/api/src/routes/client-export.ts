import type { FastifyPluginAsync } from 'fastify';
import { clientExportBodySchema } from '../schemas/client-product-filters.js';
import { exportPdfService } from '../services/export-pdf-service.js';

export const clientExportRoutes: FastifyPluginAsync = async (app) => {
  app.post('/api/client/export-pdf', async (request, reply) => {
    const parsed = clientExportBodySchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      return reply.status(400).send({
        code: 'INVALID_FILTERS',
        message: parsed.error.errors[0]?.message ?? 'Parâmetros de filtro inválidos.',
      });
    }
    const body = parsed.data;
    const pdf = await exportPdfService.generate(request.auth, {
      term: body.term,
      item_status: body.itemStatuses.length > 0 ? body.itemStatuses : undefined,
      idd_min: body.iddMin,
      idd_max: body.iddMax,
      stock_days_min: body.stockDaysMin,
      stock_days_max: body.stockDaysMax,
      tied_up_capital_min: body.tiedUpCapitalMin,
      tied_up_capital_max: body.tiedUpCapitalMax,
    });
    return reply
      .header('Content-Type', 'application/pdf')
      .header('Content-Disposition', 'attachment; filename="dashboard-report.pdf"')
      .send(pdf);
  });
};
