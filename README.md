# Prudens Index

Operational stock intelligence — monorepo (Next.js 15, Fastify, BullMQ, PostgreSQL).

## Quick start

See [specs/001-stock-import-dashboard/quickstart.md](specs/001-stock-import-dashboard/quickstart.md).

```bash
pnpm install
docker compose -f docker/docker-compose.yml up -d
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
cp apps/worker/.env.example apps/worker/.env
pnpm --filter @prudens/api db:migrate   # apply drizzle/migrations/0000_init.sql via psql or drizzle-kit
pnpm --filter @prudens/api db:seed
pnpm dev
```

## Structure

- `apps/web` — Next.js frontend (Vercel)
- `apps/api` — Fastify API
- `apps/worker` — BullMQ spreadsheet processor
- `packages/shared` — Zod schemas & types
- `packages/domain-metrics` — single source for calculations
