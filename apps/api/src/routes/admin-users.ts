import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { assertAdmin } from '../services/auth-context-service.js';
import { adminUserService } from '../services/admin-user-service.js';
import { inviteUserBodySchema, updateUserBodySchema } from '../schemas/admin-user-schemas.js';

export const adminUsersRoutes: FastifyPluginAsync = async (app) => {
  app.get('/api/admin/users', async (request, reply) => {
    assertAdmin(request.auth);
    const list = await adminUserService.list();
    return reply.send(list);
  });

  app.post('/api/admin/users', async (request, reply) => {
    assertAdmin(request.auth);
    const body = inviteUserBodySchema.parse(request.body);
    const created = await adminUserService.invite(body);
    return reply.code(201).send(created);
  });

  app.patch('/api/admin/users/:id', async (request, reply) => {
    assertAdmin(request.auth);
    const { id } = z.object({ id: z.string().min(1) }).parse(request.params);
    const body = updateUserBodySchema.parse(request.body);
    const updated = await adminUserService.update(id, body, request.auth);
    return reply.send(updated);
  });
};
