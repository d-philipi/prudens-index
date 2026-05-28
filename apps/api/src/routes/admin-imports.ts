import type { FastifyPluginAsync } from 'fastify';
import { SPREADSHEET_CONTENT_TYPES } from '@prudens/shared/spreadsheetFormats';
import { z } from 'zod';
import { assertAdmin } from '../services/auth-context-service.js';
import { importService } from '../services/import-service.js';
import { importErrorsService } from '../services/import-errors-service.js';

const createImportSchema = z.object({
  companyId: z.string().uuid(),
  filename: z.string().min(1),
  contentType: z.enum(SPREADSHEET_CONTENT_TYPES),
  sizeBytes: z.number().int().positive().max(10 * 1024 * 1024),
});

export const adminImportsRoutes: FastifyPluginAsync = async (app) => {
  app.post('/api/admin/imports', async (request, reply) => {
    assertAdmin(request.auth);
    const body = createImportSchema.parse(request.body);
    const result = await importService.createUpload(request.auth, body);
    return reply.code(201).send(result);
  });

  app.post('/api/admin/imports/:importJobId/complete-upload', async (request, reply) => {
    assertAdmin(request.auth);
    const { importJobId } = z.object({ importJobId: z.string().uuid() }).parse(request.params);
    await importService.completeUpload(importJobId);
    return reply.code(202).send({ queued: true });
  });

  app.get('/api/admin/imports/:importJobId', async (request, reply) => {
    assertAdmin(request.auth);
    const { importJobId } = z.object({ importJobId: z.string().uuid() }).parse(request.params);
    const job = await importService.getJob(importJobId);
    return reply.send(job);
  });

  app.get('/api/admin/companies/:companyId/imports', async (request, reply) => {
    assertAdmin(request.auth);
    const { companyId } = z.object({ companyId: z.string().uuid() }).parse(request.params);
    const jobs = await importService.listByCompany(companyId);
    return reply.send(jobs);
  });

  app.get('/api/admin/companies/:id/jobs/:jobId/errors', async (request, reply) => {
    assertAdmin(request.auth);
    const { id, jobId } = z.object({ id: z.string().uuid(), jobId: z.string().uuid() }).parse(
      request.params,
    );
    const result = await importErrorsService.getByCompanyAndJob(id, jobId);
    return reply.send({
      job_id: result.jobId,
      company_id: result.companyId,
      errors: result.errors,
    });
  });
};
