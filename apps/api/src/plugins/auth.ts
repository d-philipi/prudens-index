import { verifyToken } from '@clerk/backend';
import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { env } from '../lib/env.js';
import { resolveAuthContext } from '../services/auth-context-service.js';
import type { AuthContext } from '../types/auth-context.js';

declare module 'fastify' {
  interface FastifyRequest {
    auth: AuthContext;
  }
}

const authPluginImpl: FastifyPluginAsync = async (app) => {
  app.decorateRequest('auth', undefined as unknown as AuthContext);

  app.addHook('preHandler', async (request, reply) => {
    const path = request.url.split('?')[0];
    if (path === '/health') return;

    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return reply.code(401).send({ code: 'UNAUTHORIZED', message: 'Não foi possível identificar o token de autenticação' });
    }

    const token = header.slice(7);
    const secret = env.clerkSecretKey;
    if (!secret) {
      return reply.code(500).send({ code: 'CONFIG', message: 'A autenticação não está configurada' });
    }

    try {
      const payload = await verifyToken(token, { secretKey: secret });
      const clerkUserId = payload.sub;
      const email =
        (payload.email as string | undefined) ??
        (payload.primary_email_address as string | undefined) ??
        'unknown@local.dev';

      const ctx = await resolveAuthContext(clerkUserId, email);
      if (!ctx) {
        return reply.code(403).send({ code: 'FORBIDDEN', message: 'Usuário não encontrado' });
      }
      request.auth = ctx;
    } catch {
      return reply.code(401).send({ code: 'UNAUTHORIZED', message: 'Token inválido' });
    }
  });
};

/**
 * Breaks Fastify encapsulation so auth runs on nested route plugins (admin, client).
 * Client routes MUST use request.auth.companyId from this context — never a client-supplied company id.
 */
export const authPlugin = fp(authPluginImpl, { name: 'auth-plugin' });
