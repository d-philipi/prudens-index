import cors from '@fastify/cors';
import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { getCorsOrigins } from '../lib/env.js';

const corsPluginImpl: FastifyPluginAsync = async (app) => {
  await app.register(cors, {
    origin: getCorsOrigins(),
    credentials: true,
  });
};

/** CORS headers on all routes, including errors from nested plugins. */
export const corsPlugin = fp(corsPluginImpl, { name: 'cors-plugin' });
