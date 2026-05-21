import './lib/load-env.js';

import Fastify from 'fastify';
import { authPlugin } from './plugins/auth.js';
import { corsPlugin } from './plugins/cors.js';
import { rateLimitPlugin } from './plugins/rate-limit.js';
import { adminCompaniesRoutes } from './routes/admin-companies.js';
import { adminImportsRoutes } from './routes/admin-imports.js';
import { clientDashboardRoutes } from './routes/client-dashboard.js';
import { clientExportRoutes } from './routes/client-export.js';

const app = Fastify({ logger: true });

app.setErrorHandler((err: Error & { statusCode?: number }, _request, reply) => {
  const statusCode = typeof err.statusCode === 'number' ? err.statusCode : 500;
  void reply.code(statusCode).send({
    code: statusCode === 403 ? 'FORBIDDEN' : statusCode === 401 ? 'UNAUTHORIZED' : 'ERROR',
    message: err.message,
  });
});

await app.register(corsPlugin);
await app.register(authPlugin);

app.get('/health', async () => ({ ok: true }));

await app.register(rateLimitPlugin);
await app.register(adminCompaniesRoutes);
await app.register(adminImportsRoutes);
await app.register(clientDashboardRoutes);
await app.register(clientExportRoutes);

const port = Number(process.env.PORT ?? 3001);
const host = process.env.HOST ?? '0.0.0.0';

app.listen({ port, host }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
