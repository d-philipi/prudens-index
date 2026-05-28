import type { FastifyPluginAsync } from 'fastify';
import { clientProductsQuerySchema } from '../schemas/client-product-filters.js';
import { clientProductsService } from '../services/client-products-service.js';

export const clientProductsRoutes: FastifyPluginAsync = async (app) => {
  app.get('/api/client/products', async (request, reply) => {
    const parsed = clientProductsQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({
        code: 'INVALID_FILTERS',
        message: parsed.error.errors[0]?.message ?? 'Parâmetros de filtro inválidos.',
      });
    }
    const query = parsed.data;
    const result = await clientProductsService.getProducts(request.auth, {
      term: query.term,
      item_status: query.item_status,
      idd_min: query.idd_min,
      idd_max: query.idd_max,
      stock_days_min: query.stock_days_min,
      stock_days_max: query.stock_days_max,
      tied_up_capital_min: query.tied_up_capital_min,
      tied_up_capital_max: query.tied_up_capital_max,
      sort: query.sort,
      order: query.order,
      page: query.page,
      limit: query.limit,
    });
    return reply.send(result);
  });
};
