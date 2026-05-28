import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import type { ItemStatus } from '@prudens/shared/types';
import { clientProductsService } from '../services/client-products-service.js';

const itemStatusEnum = z.enum(['distribution', 'adequate', 'boost']);

const querySchema = z.object({
  term: z.string().optional(),
  item_status: z
    .union([itemStatusEnum, z.array(itemStatusEnum), z.string()])
    .optional()
    .transform((v): ItemStatus[] | undefined => {
      if (v == null) return undefined;
      if (Array.isArray(v)) return v;
      if (typeof v === 'string' && v.includes(',')) {
        return v.split(',').map((s) => s.trim()) as ItemStatus[];
      }
      return [v as ItemStatus];
    }),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const clientProductsRoutes: FastifyPluginAsync = async (app) => {
  app.get('/api/client/products', async (request, reply) => {
    const query = querySchema.parse(request.query);
    const result = await clientProductsService.getProducts(request.auth, {
      term: query.term,
      item_status: query.item_status,
      sort: query.sort,
      order: query.order,
      page: query.page,
      limit: query.limit,
    });
    return reply.send(result);
  });
};
