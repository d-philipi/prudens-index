import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { assertAdmin } from '../services/auth-context-service.js';
import { adminCompanyService } from '../services/admin-company-service.js';
import { isValidCnpjDigits, normalizeCnpj } from '../lib/cnpj.js';

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

  const createBodySchema = z
    .object({
      name: z.string().trim().min(2, 'Nome da empresa deve ter pelo menos 2 caracteres'),
      cnpj: z
        .string()
        .optional()
        .nullable()
        .transform((v) => normalizeCnpj(v)),
      address: z.string().trim().optional().nullable(),
      neighborhood: z.string().trim().optional().nullable(),
      city: z.string().trim().optional().nullable(),
      state: z
        .string()
        .trim()
        .optional()
        .nullable()
        .transform((v) => (!v ? null : v.toUpperCase()))
        .refine((v) => v === null || /^[A-Z]{2}$/.test(v), 'UF deve ter 2 letras'),
    })
    .superRefine((data, ctx) => {
      if (data.cnpj && !isValidCnpjDigits(data.cnpj)) {
        ctx.addIssue({ code: 'custom', path: ['cnpj'], message: 'CNPJ inválido' });
      }
    });

  app.post('/api/admin/companies', async (request, reply) => {
    assertAdmin(request.auth);
    const body = createBodySchema.parse(request.body);
    const created = await adminCompanyService.createCompany(body);
    return reply.code(201).send(created);
  });
};
