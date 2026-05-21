# Quickstart: Stock Import & Client Dashboard

## Prerequisites

- Node.js 20 LTS, pnpm 9+
- Docker Desktop (PostgreSQL 16 + Redis 7)
- Clerk application (dev instance)
- Cloudflare R2 bucket (or MinIO locally for dev)

## 1. Clone and install

```bash
pnpm install
```

## 2. Start infrastructure

```bash
docker compose -f docker/docker-compose.yml up -d
```

## 3. Environment files

Copy examples — **never commit secrets**.

| App | File | Key secrets (server only) |
|-----|------|----------------------------|
| `apps/web` | `.env.local` | `CLERK_SECRET_KEY` (server routes only), `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `NEXT_PUBLIC_API_URL` |
| `apps/api` | `.env` | `DATABASE_URL`, `REDIS_URL`, `CLERK_SECRET_KEY`, `R2_*`, `CORS_ORIGIN` |
| `apps/worker` | `.env` | Same DB/Redis/R2 as API |

## 4. Database

```bash
pnpm --filter @prudens/api db:migrate
pnpm --filter @prudens/api db:seed
```

## 5. Run apps (three terminals)

```bash
pnpm --filter @prudens/api dev      # :3001
pnpm --filter @prudens/worker dev
pnpm --filter @prudens/web dev      # :3000
```

## 6. Smoke test

1. Sign in as admin → `/admin/imports` → upload `fixtures/sample-stock-267-rows.xlsx` for Demo Retail
2. Poll until status `completed`
3. Sign in as client → `/dashboard` → verify table, filters, PDF export

### SLA scripts (SC-001, SC-002)

After apps are running:

```bash
pnpm smoke:sla              # import → completed ≤60s
pnpm smoke:dashboard-load   # dashboard hydrate ≤3s
```

Optional: `fixtures/sample-stock-267-rows.csv` for CSV upload path smoke (same headers as xlsx).

## 7. Constitution spot-check

- [ ] No `any` / `@ts-ignore` in changed files
- [ ] API routes delegate to services only
- [ ] Calculations imported from `@prudens/domain-metrics` only
