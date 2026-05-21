import type { FastifyPluginAsync } from 'fastify';
import { assertAdmin } from '../services/auth-context-service.js';
import { companyService } from '../services/company-service.js';

export const adminCompaniesRoutes: FastifyPluginAsync = async (app) => {
  app.get('/api/admin/companies', async (request, reply) => {
    assertAdmin(request.auth);
    const companies = await companyService.listForAdmin();
    return reply.send(companies);
  });
};
