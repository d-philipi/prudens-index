# Data Model: Alinhamento stock_products, item_status e painéis

**ORM**: Drizzle | **Database**: PostgreSQL 16 | **Feature**: `002-align-stock-dashboards`

## Spreadsheet template (canonical)

Header row MUST match exactly (order matters). Mapping object: `packages/shared/src/sheet-mapping.ts`.

| # | Column (header) | DB column | PostgreSQL type | TS / Zod |
|---|-----------------|-----------|-----------------|----------|
| 1 | PRODUTO | `product_name` | `text NOT NULL` | `z.string().min(1)` |
| 2 | EAN | `ean` | `varchar(32)` | `z.string().nullable()` |
| 3 | Lojas com estoque | `stores_with_stock` | `integer NOT NULL` | `z.number().int().nonnegative()` |
| 4 | distribuição | `distribution` | `numeric(12,4)` | `z.number()` |
| 5 | Lojas com demanda nos últ 3 meses | `branches_with_demand` | `integer NOT NULL` | `z.number().int().nonnegative()` |
| 6 | Demanda x Distribuição | `demand_vs_distribution` | `numeric(12,4)` | `z.number()` |
| 7 | IDD | `idd` | `numeric(12,4)` | `z.number()` (obrigatório por linha) |
| 8 | estoque | `stock` | `integer` | `z.number().int()` |
| 9 | demanda media | `average_demand` | `numeric(12,4)` | `z.number()` |
| 10 | dias estoque | `stock_days` | `numeric(12,4)` | `z.number()` |

**Derived (not in spreadsheet)**:

| Column | Type | Rule |
|--------|------|------|
| `item_status` | `text NOT NULL` + CHECK | `computeItemStatusFromIdd(idd)` at insert |

**Removed from client UI / import payload**: `category` (drop column in migration or leave nullable unused — plan: **DROP** `category`).

## Drizzle schema (`apps/api/drizzle/schema/stock-products.ts`)

```typescript
export const stockProducts = pgTable('stock_products', {
  id: uuid('id').primaryKey().defaultRandom(),
  importJobId: uuid('import_job_id').notNull().references(() => importJobs.id),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  productName: text('product_name').notNull(),
  ean: varchar('ean', { length: 32 }),
  storesWithStock: integer('stores_with_stock').notNull().default(0),
  distribution: numeric('distribution', { precision: 12, scale: 4 }),
  branchesWithDemand: integer('branches_with_demand').notNull().default(0),
  demandVsDistribution: numeric('demand_vs_distribution', { precision: 12, scale: 4 }),
  idd: numeric('idd', { precision: 12, scale: 4 }).notNull(),
  stock: integer('stock'),
  averageDemand: numeric('average_demand', { precision: 12, scale: 4 }),
  stockDays: numeric('stock_days', { precision: 12, scale: 4 }),
  itemStatus: text('item_status').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
```

Apply CHECK via migration SQL (Drizzle `check()` optional):

```sql
ALTER TABLE stock_products
  ADD CONSTRAINT stock_products_item_status_check
  CHECK (item_status IN ('distribution', 'adequate', 'boost'));
```

## Indexes

| Index | Columns | Purpose |
|-------|---------|---------|
| `stock_products_company_import` | `(company_id, import_job_id)` | Tenant + active job |
| `stock_products_company_status` | `(company_id, item_status)` | Filter by status |
| `stock_products_company_active_idd` | `(company_id, idd)` WHERE active import | Chart ordering |
| `stock_products_cursor_sort` | `(company_id, import_job_id, product_name, id)` | Keyset pagination |

## Entity relationships

```text
companies 1──* import_jobs
import_jobs 1──* stock_products
companies 1──* stock_products (denormalized company_id)
```

**Active data rule**: Client and admin “current dashboard” queries filter `import_jobs.is_active = true` for the company.

## `item_status` state (derived, not transitioned)

| IDD range | Value |
|-----------|--------|
| `< 0` | `distribution` |
| `0` – `20` | `adequate` |
| `> 20` | `boost` |

Recomputed on each new import row at insert time only.

## Admin aggregates (not stored)

| Metric | Computation |
|--------|-------------|
| Total companies | `COUNT(*)` from `companies` |
| Total products | `COUNT(*)` from `stock_products` joined to active `import_jobs` |
| Avg IDD per company | `AVG(idd::numeric)` grouped by `company_id` on active import products only |

## Client cursor token (logical)

Opaque base64url JSON:

```json
{
  "sort": "idd",
  "order": "desc",
  "lastId": "uuid",
  "lastSortValue": "12.5000"
}
```

Tie-breaker: always `id` UUID ascending for stable pages.
