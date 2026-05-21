import rateLimit from '@fastify/rate-limit';
import type { FastifyPluginAsync } from 'fastify';

export const rateLimitPlugin: FastifyPluginAsync = async (app) => {
  await app.register(rateLimit, {
    max: 10,
    timeWindow: '15 minutes',
    keyGenerator: (req) => req.auth?.userId ?? req.ip,
  });
};
