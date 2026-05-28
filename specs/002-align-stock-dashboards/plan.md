# Implementation Plan: Alinhamento de Estoque, Status por IDD e Painéis Admin/Cliente

**Branch**: `002-align-stock-dashboards` | **Date**: 2026-05-22 | **Spec**: [spec.md](./spec.md)  
**Input**: Planejar correções de schema, cálculo server-side de `item_status`, dashboard admin e tela cliente conforme spec; seguir constituição v1.0.0.

## Summary

Alinhar `stock_products` à planilha canônica (nomes e tipos PostgreSQL corretos), substituir enum legado de `item_status` por valores `distribution` | `adequate` | `boost` derivados só do IDD no worker, e entregar painéis admin (métricas globais, busca de empresas, detalhe com jobs) e cliente (overview, produtos com gráfico+ tabela unificados, filtros Zustand, PDF, paginação cursor server-side). Monorepo existente: `apps/web`, `apps/api`, `apps/worker`, `packages/shared`, `packages/domain-metrics`.

## Technical Context

**Language/Version**: TypeScript strict — Next.js 15 (App Router), Node.js 20 LTS  
**Primary Dependencies**: Fastify, Drizzle, BullMQ, SheetJS (xlsx), Zod, Shadcn/UI, Tailwind v4, Recharts, Clerk, Zustand  
**Storage**: PostgreSQL 16, Redis 7, Cloudflare R2  
**Testing**: Vitest (domain-metrics, Zod, cursor helper); smoke via quickstart  
**Target Platform**: Vercel (`apps/web`), Hetzner/Coolify (`apps/api`, `apps/worker`)  
**Project Type**: web-service (mobile-first + API + worker)  
**Performance Goals**: Dashboard coerente ≤5s @2k produtos (spec SC-005); cursor pages ≤50 rows; `chart_data` cap 500 pontos  
**Constraints**: Route→Service→Repository; sem filtro por filial (spec Q1:A); AVG IDD admin só no banco  
**Scale/Scope**: Até ~5k linhas/import; migração sem perda de linhas de produto

## Constitution Check

*GATE: Pre-design — PASS (com ressalvas documentadas) | Post-design — PASS*

| Gate | Status | Notes |
|------|--------|-------|
| Stack | PASS | Next 15, Fastify, Drizzle, BullMQ, Recharts, Zustand, Clerk |
| Layer boundaries | PASS | Web→API; worker separado; sem DB no frontend |
| API sequence | PASS | Novas rotas: Zod → Service → Repository |
| Validation & auth | PASS | Clerk + `company_id` injetado; admin `assertAdmin` |
| Secrets & CORS | PASS | Sem alteração |
| DRY & naming | PASS | Ver Complexity Tracking (idd + sheet-mapping) |
| Mobile-first | PASS | Sidebar colapsável; tabela responsiva |

## Project Structure

### Documentation (this feature)

```text
specs/002-align-stock-dashboards/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── api.openapi.yaml
└── tasks.md              # /speckit.tasks
```

### Source Code (touch map)

```text
apps/api/
├── drizzle/schema/stock-products.ts
├── drizzle/migrations/0001_align_stock_products.sql   # gerado + revisado
├── src/lib/sheet-mapping.ts                          # re-export shared
├── src/services/idd.service.ts                       # facade domain-metrics
├── src/services/admin-metrics-service.ts
├── src/services/admin-company-service.ts             # expand
├── src/services/client-overview-service.ts
├── src/services/client-products-service.ts
├── src/repositories/stock-product-repository.ts      # cursor + chart CTE
├── src/routes/admin-metrics.ts
├── src/routes/admin-companies.ts                     # expand
├── src/routes/client-overview.ts
├── src/routes/client-products.ts
└── src/plugins/auth.ts                               # document tenant injection

apps/worker/
├── src/jobs/process-import.ts
└── src/services/spreadsheet-parser-service.ts

packages/shared/
├── src/sheet-mapping.ts
├── src/spreadsheetTemplate.ts                        # int columns
└── src/types/index.ts                                # ItemStatus union

packages/domain-metrics/
└── src/idd-item-status.ts                            # canonical pure fn

apps/web/
├── src/app/(admin)/admin/page.tsx                    # NEW home
├── src/app/(admin)/admin/companies/[id]/page.tsx
├── src/components/admin/MetricsPanel.tsx
├── src/components/admin/CompanySearch.tsx
├── src/components/admin/CompanyCard.tsx
├── src/components/client/IndexHeader.tsx
├── src/components/client/FilterSidebar.tsx
├── src/components/client/IddBarChart.tsx
├── src/components/client/ProductTable.tsx
├── src/components/client/ExportButton.tsx
├── src/lib/item-status-chart-colors.ts
└── src/store/dashboardStore.ts                       # filters + cursor
```

**Structure Decision**: Evolução do monorepo 001; rotas legadas `/api/client/dashboard/*` deprecadas após migração para `/api/client/overview` e `/api/client/products`.

## Complexity Tracking

| Violation / tension | Why Needed | Simpler Alternative Rejected Because |
|---------------------|------------|-------------------------------------|
| Lógica em `domain-metrics` + facade `idd.service.ts` | Worker não importa `apps/api`; constituição V | Só `idd.service.ts` no API — worker duplicaria ou acoplaria API |
| `sheet-mapping` em `packages/shared` + re-export API | Worker e API compartilham um objeto | Só `apps/api/lib` — worker sem acesso |
| Facade `idd.service.ts` nome solicitado | Contrato do plano / tasks | — |

---

# Fase 0 — Correção de schema e migration

**Goal**: Schema Drizzle e PostgreSQL alinhados à spec; dados existentes preservados.

### Arquivos de migration (ordem obrigatória)

| Ordem | Arquivo | Ação |
|-------|---------|------|
| 1 | `apps/api/drizzle/migrations/0001_align_stock_products.sql` | Migration SQL aplicada por `pnpm --filter @prudens/api db:migrate` |
| 2 | `apps/api/drizzle/schema/stock-products.ts` | Schema Drizzle atualizado (fonte para `0002` futuro se usar generate) |

**Geração**: `pnpm --filter @prudens/api db:generate` após editar schema → revisar SQL gerado e renomear/consolidar para `0001_align_stock_products.sql` se kit emitir nome hash.

### SQL `0001_align_stock_products.sql` (passos dentro do arquivo)

```sql
-- 1) Novas colunas temporárias / alvo
ALTER TABLE stock_products ADD COLUMN IF NOT EXISTS stores_with_stock integer;
ALTER TABLE stock_products ADD COLUMN IF NOT EXISTS average_demand numeric(12,4);

-- 2) Backfill stores_with_stock a partir de branches_with_stock (jsonb)
UPDATE stock_products SET stores_with_stock = COALESCE(
  CASE
    WHEN jsonb_typeof(branches_with_stock) = 'array' THEN jsonb_array_length(branches_with_stock)
    ELSE NULL
  END,
  0
);

-- 3) Backfill branches_with_demand: jsonb array length → integer staging
ALTER TABLE stock_products ADD COLUMN IF NOT EXISTS branches_with_demand_int integer;
UPDATE stock_products SET branches_with_demand_int = COALESCE(
  CASE
    WHEN jsonb_typeof(branches_with_demand) = 'array' THEN jsonb_array_length(branches_with_demand)
    ELSE NULL
  END,
  0
);

-- 4) Renomear média e tipos
ALTER TABLE stock_products RENAME COLUMN avg_demand TO average_demand;

-- 5) stock → integer (truncar decimais existentes)
ALTER TABLE stock_products ALTER COLUMN stock TYPE integer USING ROUND(stock)::integer;

-- 6) item_status: nova coluna text
ALTER TABLE stock_products ADD COLUMN item_status_new text;

-- 7) Recalcular status a partir de IDD (mesma regra de negócio)
UPDATE stock_products SET item_status_new = CASE
  WHEN idd IS NULL THEN 'adequate'
  WHEN idd::numeric < 0 THEN 'distribution'
  WHEN idd::numeric <= 20 THEN 'adequate'
  ELSE 'boost'
END;

-- 8) Remover coluna enum antiga e renomear
ALTER TABLE stock_products DROP COLUMN item_status;
ALTER TABLE stock_products RENAME COLUMN item_status_new TO item_status;
ALTER TABLE stock_products ALTER COLUMN item_status SET NOT NULL;

-- 9) Substituir branches_with_demand jsonb por integer
ALTER TABLE stock_products DROP COLUMN branches_with_demand;
ALTER TABLE stock_products RENAME COLUMN branches_with_demand_int TO branches_with_demand;
ALTER TABLE stock_products ALTER COLUMN branches_with_demand SET NOT NULL DEFAULT 0;

-- 10) Remover coluna legada branches_with_stock (stores_with_stock já backfilled)
ALTER TABLE stock_products DROP COLUMN branches_with_stock;
ALTER TABLE stock_products ALTER COLUMN stores_with_stock SET NOT NULL DEFAULT 0;

-- 11) IDD obrigatório para novas regras (nullable legado → 0)
UPDATE stock_products SET idd = 0 WHERE idd IS NULL;
ALTER TABLE stock_products ALTER COLUMN idd SET NOT NULL;

-- 12) CHECK constraint
ALTER TABLE stock_products ADD CONSTRAINT stock_products_item_status_check
  CHECK (item_status IN ('distribution', 'adequate', 'boost'));

-- 13) Remover enum e categoria
DROP TYPE IF EXISTS item_status;
ALTER TABLE stock_products DROP COLUMN IF EXISTS category;

-- 14) Índices
DROP INDEX IF EXISTS stock_products_company_status;
CREATE INDEX stock_products_company_status ON stock_products (company_id, item_status);
```

**Garantia de não perda**: Nenhum `DELETE FROM stock_products`; apenas `ADD`/`UPDATE`/`DROP COLUMN` após backfill. Jobs e `company_id` intactos. Rollback manual: backup `pg_dump` antes de `db:migrate` em produção.

### Schema Drizzle final (tipos PostgreSQL)

| Coluna | Drizzle | PostgreSQL |
|--------|---------|------------|
| `product_name` | `text()` | `text` |
| `ean` | `varchar(32)` | `varchar(32)` |
| `stores_with_stock` | `integer().notNull().default(0)` | `integer` |
| `distribution` | `numeric(12,4)` | `numeric(12,4)` |
| `branches_with_demand` | `integer().notNull().default(0)` | `integer` |
| `demand_vs_distribution` | `numeric(12,4)` | `numeric(12,4)` |
| `idd` | `numeric(12,4).notNull()` | `numeric(12,4)` |
| `stock` | `integer()` | `integer` |
| `average_demand` | `numeric(12,4)` | `numeric(12,4)` |
| `stock_days` | `numeric(12,4)` | `numeric(12,4)` |
| `item_status` | `text().notNull()` | `text` + CHECK |

---

# Fase 1 — Serviço de cálculo de `item_status`

**Goal**: Uma função pura; worker chama antes de cada `INSERT`.

### Arquivos

| Path | Responsabilidade |
|------|------------------|
| `packages/domain-metrics/src/idd-item-status.ts` | Implementação canônica |
| `apps/api/src/services/idd.service.ts` | Re-export + tipo `ItemStatusValue` para services API |
| `packages/domain-metrics/src/index.ts` | `export { computeItemStatusFromIdd }` |

### Assinatura exata

```typescript
// packages/domain-metrics/src/idd-item-status.ts
export type ItemStatusValue = 'distribution' | 'adequate' | 'boost';

export function computeItemStatusFromIdd(
  idd: number | null | undefined,
): ItemStatusValue;
```

```typescript
// apps/api/src/services/idd.service.ts
export {
  computeItemStatusFromIdd,
  type ItemStatusValue,
} from '@prudens/domain-metrics';
```

### Implementação (única)

```typescript
export function computeItemStatusFromIdd(idd: number | null | undefined): ItemStatusValue {
  if (idd == null || Number.isNaN(idd)) {
    throw new Error('IDD_REQUIRED'); // parser trata antes do insert
  }
  if (idd < 0) return 'distribution';
  if (idd <= 20) return 'adequate';
  return 'boost';
}
```

### Worker (`apps/worker/src/jobs/process-import.ts`)

```typescript
import { computeItemStatusFromIdd } from '@prudens/domain-metrics';

// por linha parseada:
const itemStatus = computeItemStatusFromIdd(parsed.idd);
await sql`INSERT INTO stock_products (..., item_status) VALUES (..., ${itemStatus})`;
```

**Proibido**: `computeItemStatus` legado em `packages/domain-metrics/src/computeItemStatus.ts` (remover ou substituir export). Nenhum cálculo de status no `apps/web`.

### Casos de borda

| Caso | Comportamento |
|------|----------------|
| IDD ausente na linha | Erro na validação Zod; log `{ line, code: 'IDD_REQUIRED' }`; continua próximas linhas |
| IDD não numérico | Erro `IDD_INVALID` na linha |
| IDD = 0, 20, -0.01, 20.01 | `adequate`, `adequate`, `distribution`, `boost` |

---

# Fase 2 — Correção do parser de planilha

**Goal**: Mapeamento declarativo único; Zod por linha; erros por número de linha sem abortar job inteiro (salvo cabeçalho inválido).

### `packages/shared/src/sheet-mapping.ts`

```typescript
export const SHEET_COLUMN_MAPPING = {
  'PRODUTO': { field: 'product_name', type: 'string' as const },
  'EAN': { field: 'ean', type: 'string' as const },
  'Lojas com estoque': { field: 'stores_with_stock', type: 'int' as const },
  'distribuição': { field: 'distribution', type: 'float' as const },
  'Lojas com demanda nos últ 3 meses': { field: 'branches_with_demand', type: 'int' as const },
  'Demanda x Distribuição': { field: 'demand_vs_distribution', type: 'float' as const },
  'IDD': { field: 'idd', type: 'float' as const },
  'estoque': { field: 'stock', type: 'int' as const },
  'demanda media': { field: 'average_demand', type: 'float' as const },
  'dias estoque': { field: 'stock_days', type: 'float' as const },
} as const;
```

`apps/api/src/lib/sheet-mapping.ts`:

```typescript
export { SHEET_COLUMN_MAPPING } from '@prudens/shared/sheet-mapping';
```

### Zod (`packages/shared/src/spreadsheetTemplate.ts`)

- `stores_with_stock`: `z.coerce.number().int()`
- `branches_with_demand`: `z.coerce.number().int()`
- `stock`: `z.coerce.number().int()`
- `idd`: `z.number()` obrigatório
- floats: `z.coerce.number()`
- Remover `branches_with_stock_raw` / parse de listas

### Worker parser flow

1. SheetJS lê primeira linha → `validateSpreadsheetHeaders`
2. Para cada linha `i` (2-based): `mapRawRow` usando chaves do mapping → `spreadsheetRowSchema.safeParse`
3. Se falha: `lineErrors.push({ line: i, issues })`; **continue**
4. Se sucesso: `computeItemStatusFromIdd(row.idd)` → insert
5. Ao final: `import_jobs.error_message` resume falhas de linha; `row_count` = inserts OK;
   `completed` se ≥1 linha persistida; `failed` se 0 linhas ou cabeçalho inválido

### Arquivos alterados

- `apps/worker/src/services/spreadsheet-parser-service.ts`
- `packages/shared/src/spreadsheetTemplate.ts`
- `apps/api/src/services/spreadsheet-validation-service.ts` (usa mesmo mapping)

---

# Fase 3 — Dashboard do admin

**Goal**: Home admin com métricas, busca e detalhe; dados iniciais via Server Components.

### API — Route → Service → Repository

| Método | Rota | Service | Repository |
|--------|------|---------|------------|
| GET | `/api/admin/metrics` | `admin-metrics-service.ts` | `company-repository.ts`, `stock-product-repository.ts` |
| GET | `/api/admin/companies?q=` | `admin-company-service.ts` | `company-repository.listWithStats(q)` |
| GET | `/api/admin/companies/:id` | `admin-company-service.ts` | `company-repository`, `import-job-repository` |

Todas chamam `assertAdmin(request.auth)` no handler.

### Response shapes

**GET `/api/admin/metrics`**

```json
{
  "totalCompanies": 12,
  "totalProducts": 4500,
  "avgIddByCompany": [
    { "companyId": "uuid", "companyName": "Acme", "avgIdd": 8.42 }
  ]
}
```

**IDD médio por empresa — só Drizzle/ SQL, sem loop Node**

```typescript
// repository: admin-metrics-repository.ts
import { sql, eq, and } from 'drizzle-orm';

await db
  .select({
    companyId: companies.id,
    companyName: companies.name,
    avgIdd: sql<string>`avg(${stockProducts.idd}::numeric)`.as('avg_idd'),
  })
  .from(companies)
  .leftJoin(
    stockProducts,
    and(
      eq(stockProducts.companyId, companies.id),
      eq(
        stockProducts.importJobId,
        sql`(select id from import_jobs where company_id = ${companies.id} and is_active = true limit 1)`,
      ),
    ),
  )
  .groupBy(companies.id, companies.name);
```

`totalProducts`: `count(*)` em `stock_products` join `import_jobs` onde `is_active = true`.

### Frontend (Server Components)

| Componente | Arquivo | Dados |
|------------|---------|-------|
| `MetricsPanel` | `apps/web/src/components/admin/MetricsPanel.tsx` | dois KPIs (`totalCompanies`, `totalProducts`) + lista `avgIddByCompany` (FR-016; não um único IDD global) |
| `CompanySearch` | `apps/web/src/components/admin/CompanySearch.tsx` | client component só para input; navega com `?q=` |
| `CompanyCard` | `apps/web/src/components/admin/CompanyCard.tsx` | item da lista |
| Admin home | `apps/web/src/app/(admin)/admin/page.tsx` | `async` page: `fetch` métricas + companies sem `useEffect` |
| `CompanyDetailPage` | `apps/web/src/app/(admin)/admin/companies/[id]/page.tsx` | cadastro + jobs + `activeImportJobId` |

**Busca**: Server page lê `searchParams.q`, repassa à API; sem fetch inicial no cliente.

---

# Fase 4 — Tela do cliente

**Goal**: Layout 3 regiões; overview; produtos+gráfico unificados; Zustand; cursor pagination; PDF com filtros.

**Spec Q1:A**: sem query param `filial` (ignorar menção no prompt original).

### API

| Método | Rota | Service |
|--------|------|---------|
| GET | `/api/client/overview` | `client-overview-service.ts` |
| GET | `/api/client/products` | `client-products-service.ts` |
| POST | `/api/client/export-pdf` | `export-pdf-service.ts` (atualizar filtros) |

**Auth**: `assertClient(request.auth)`; `companyId = request.auth.companyId` obrigatório em todas as queries.

### GET `/api/client/overview`

```json
{
  "companyName": "Demo Retail",
  "avgIdd": 11.3,
  "lastUpdatedAt": "2026-05-22T14:00:00Z"
}
```

`avgIdd`: `AVG(idd)` produtos do job ativo; `lastUpdatedAt`: `import_jobs.completed_at` do job ativo.

### GET `/api/client/products` — query params (Zod)

| Param | Tipo | Descrição |
|-------|------|-----------|
| `term` | string? | Busca ILIKE em `product_name` ou `ean` |
| `item_status` | string? | Repetível ou `distribution,adequate` |
| `sort` | enum | `product_name`, `ean`, `idd`, `stock`, `stores_with_stock`, `item_status`, ... |
| `order` | `asc` \| `desc` | default `desc` para `idd` |
| `limit` | number | default 50, max 100 |
| `cursor` | string? | token base64url |

### Response

```json
{
  "items": [ { "id": "...", "productName": "...", "idd": 12.5, "itemStatus": "adequate", ... } ],
  "nextCursor": "eyJ...",
  "total": 1820,
  "chart_data": [
    { "product_name": "Produto A", "idd": 12.5, "item_status": "adequate" }
  ]
}
```

`chart_data`: mesma cláusula `WHERE` que `items`, `ORDER BY idd DESC`, `LIMIT 500` — **sem segunda round-trip**.

### Cursor pagination (multi-coluna)

Encoder `apps/api/src/lib/cursor-pagination.ts`:

```typescript
export interface ProductCursor {
  sort: string;
  order: 'asc' | 'desc';
  lastId: string;
  lastSortValue: string | number | null;
}
```

**Predicado keyset** (ex. `sort=idd`, `order=desc`):

```sql
WHERE (company_id = $ctx AND import_job_id = $active)
  AND (
    $cursor IS NULL OR
    (idd, id) < ($lastSortValue::numeric, $lastId::uuid)
  )
ORDER BY idd DESC, id DESC
LIMIT $limit + 1
```

Para `sort` texto: comparar `(product_name, id)` com collation `C`. Sempre tie-break `id`.

### Frontend

| Componente | Tipo | Notas |
|------------|------|-------|
| `IndexHeader` | Server ou client | IDD médio, nome, data |
| `FilterSidebar` | Client | Zustand: `term`, `itemStatuses`; dispara refetch products |
| `IddBarChart` | Client | Recharts `BarChart`; `fill` de `ITEM_STATUS_CHART_COLORS[item_status]` |
| `ProductTable` | Client | ordenação altera `sort` no store → refetch |
| `ExportButton` | Client | POST PDF com query body espelhando filtros |

**Cores (única fonte)** — `apps/web/src/lib/item-status-chart-colors.ts`:

```typescript
export const ITEM_STATUS_CHART_COLORS = {
  distribution: 'hsl(0 72% 50%)',
  adequate: 'hsl(142 52% 40%)',
  boost: 'hsl(38 92% 50%)',
} as const;
```

`IddBarChart` único consumidor; tabela usa badge CSS separado (variantes Shadcn), não hex duplicado do chart.

### Zustand (`dashboardStore.ts`)

```typescript
term: string;
itemStatuses: ItemStatusValue[];
sort: string;
order: 'asc' | 'desc';
cursor: string | null;
// actions: setFilters, setSort, nextPage, resetCursor
```

`FilterSidebar`, `IddBarChart`, `ProductTable` subscrevem o mesmo store — sem prop drilling.
Alterações de filtro disparam **refetch** de `GET /api/client/products` (não filtram dataset
completo em memória). Proibido importar `computeItemStatusFromIdd` em `apps/web` (FR-015).

### Página dashboard

- `apps/web/src/app/(client)/dashboard/page.tsx`: RSC carrega `overview` + primeira página `products` (sem filtro).
- Se `overview.lastUpdatedAt` for null: empty state (US4 cenário 8), sem chart/table.
- Interações de filtro: client boundary refetch `GET /api/client/products?...`.

### Deprecações

- Remover `BranchDistributionChart`, rota `branch-distribution`, filtros `branches`/`category` do store.

---

# Fase 5 — Segurança e isolamento de dados

### Plugin auth (`apps/api/src/plugins/auth.ts`)

Fluxo existente mantido: Clerk JWT → `resolveAuthContext` → `request.auth`.

**Extensão documentada** (sem confiar em query/body do cliente para tenant):

```typescript
// handlers cliente — NUNCA:
const companyId = request.query.companyId; // PROIBIDO

// SEMPRE:
const companyId = request.auth.companyId!; // após assertClient
```

### Middleware / preHandler

| Rota prefixo | Guard |
|--------------|-------|
| `/api/admin/*` | `assertAdmin(request.auth)` — role `admin`, `companyId` null OK |
| `/api/client/*` | `assertClient(request.auth)` — role `client`, `companyId` UUID obrigatório |

### Repository pattern

Todo método em `stock-product-repository.ts` recebe `companyId: string` como primeiro argumento e inclui:

```typescript
eq(stockProducts.companyId, companyId)
```

Join com subselect de job ativo:

```typescript
eq(stockProducts.importJobId, activeImportJobIdSubquery(companyId))
```

### Testes de isolamento

- Cliente A token → `/api/client/products` → zero linhas de company B
- Cliente → `/api/admin/metrics` → 403
- Admin → `/api/client/overview` → 403

---

## Phase 2 planning note

Este comando termina após Phase 1 design (`research.md`, `data-model.md`, `contracts/`, `quickstart.md`). **`tasks.md`** é produzido por `/speckit.tasks`.

## Post-design Constitution Check

| Gate | Status |
|------|--------|
| Stack | PASS |
| Layers | PASS |
| DRY | PASS (idd + mapping + colors) |
| Auth/tenant | PASS (Fase 5) |
