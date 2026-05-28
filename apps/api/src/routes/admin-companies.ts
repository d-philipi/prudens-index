import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { assertAdmin } from '../services/auth-context-service.js';
import { adminCompanyService } from '../services/admin-company-service.js';

export const adminCompaniesRoutes: FastifyPluginAsync = async (app) => {
  app.get('/api/admin/companies', async (request, reply) => {
    assertAdmin(request.auth);
    const query = z.object({ q: z.string().optional() }).parse(request.query);
    const cards = await adminCompanyService.listCards(query.q);
    return reply.send(cards);
  });

  app.get('/api/admin/companies/:id', async (request, reply) => {
    assertAdmin(request.auth);
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const detail = await adminCompanyService.getDetail(id);
    if (!detail) {
      return reply.code(404).send({ code: 'NOT_FOUND', message: 'Empresa não encontrada' });
    }
    return reply.send(detail);
  });
};
