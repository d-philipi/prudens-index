# Quickstart: 002-align-stock-dashboards

## Prerequisites

- Node 20, pnpm, Docker (Postgres 16 + Redis 7)
- Clerk keys configured (`apps/api/.env`, `apps/web/.env`)
- Branch `002-align-stock-dashboards`

## 1. Migrate database

```bash
cd apps/api
pnpm db:migrate
```

Expect migration `0001_align_stock_products.sql` applied. Verify:

```sql
\d stock_products
-- stores_with_stock integer, item_status text with check, average_demand numeric
```

## 2. Run stack

```bash
# repo root
docker compose -f docker/docker-compose.yml up -d
pnpm --filter @prudens/api dev
pnpm --filter @prudens/worker dev
pnpm --filter @prudens/web dev
```

## 3. Smoke — automated (recommended)

```bash
pnpm smoke:002
```

Covers schema, Vitest IDD boundaries, admin/client services, SC-005 timing proxy, `/health`, and auth 401.

## 3b. Smoke — item status (Vitest only)

```bash
pnpm --filter @prudens/domain-metrics test
```

Cases: IDD `-1` → `distribution`, `0`/`20` → `adequate`, `21` → `boost`.

## 4. Smoke — import

1. Admin sign-in → upload template `.xlsx` with canonical headers.
2. Wait job `completed`.
3. Inspect row:

```sql
SELECT product_name, stores_with_stock, branches_with_demand, item_status, idd
FROM stock_products
WHERE import_job_id = '<job-id>'
LIMIT 5;
```

## 5. Smoke — admin API

```bash
curl -H "Authorization: Bearer $ADMIN_TOKEN" http://localhost:3001/api/admin/metrics
curl -H "Authorization: Bearer $ADMIN_TOKEN" "http://localhost:3001/api/admin/companies?q=demo"
curl -H "Authorization: Bearer $ADMIN_TOKEN" http://localhost:3001/api/admin/companies/<company-id>
```

## 6. Smoke — client API

```bash
curl -H "Authorization: Bearer $CLIENT_TOKEN" http://localhost:3001/api/client/overview
curl -H "Authorization: Bearer $CLIENT_TOKEN" \
  "http://localhost:3001/api/client/products?limit=50&sort=idd&order=desc"
curl -H "Authorization: Bearer $CLIENT_TOKEN" \
  "http://localhost:3001/api/client/products?term=cola&item_status=boost"
```

Confirm `chart_data` length ≤ 500 and matches filtered set.

## 7. UI

- `/admin` — metrics panel (2 KPIs + lista `avgIddByCompany`) + company cards + search
- `/admin/companies/<id>` — jobs + active file
- `/dashboard` — IndexHeader, FilterSidebar, IddBarChart, ProductTable, PDF export
- `/dashboard` sem importação ativa — empty state (sem gráfico/tabela)

## 7b. SC-005 timing (manual)

Com ~2.000 produtos na importação ativa, abrir `/dashboard` e medir até overview +
primeira página de `/api/client/products` + `chart_data` renderizados: alvo ≤5s.

## 8. Tenant isolation

Client token for company A must not return products when SQL `company_id` of B is forced in manual test (API should ignore client-supplied `companyId`).
