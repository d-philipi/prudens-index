# Data Model: Stock Import & Client Dashboard

**ORM**: Drizzle | **Database**: PostgreSQL 16

## Spreadsheet template (canonical)

Header row MUST match exactly (order matters):

| # | Column (header) | DB field | Type | Notes |
|---|-----------------|----------|------|-------|
| 1 | PRODUTO | `product_name` | `text` NOT NULL | Display name |
| 2 | EAN | `ean` | `varchar(32)` | Nullable if missing in row |
| 3 | Lojas com estoque | `branches_with_stock` | `jsonb` | Parsed CSV of branch names |
| 4 | distribuição | `distribution` | `numeric(12,4)` | |
| 5 | Lojas com demanda nos últ 3 meses | `branches_with_demand` | `jsonb` | Parsed CSV of branch names |
| 6 | Demanda x Distribuição | `demand_vs_distribution` | `numeric(12,4)` | |
| 7 | IDD | `idd` | `numeric(12,4)` | |
| 8 | estoque | `stock` | `numeric(12,4)` | |
| 9 | demanda media | `avg_demand` | `numeric(12,4)` | |
| 10 | dias estoque | `stock_days` | `numeric(12,4)` | |

Validation: Zod schema in `packages/shared/src/spreadsheetTemplate.ts` (exported).

## Entity relationship diagram

```text
companies 1──* users
companies 1──* import_jobs
import_jobs 1──* stock_products
companies 1──1 dashboard_snapshots (active pointer via import_jobs.is_active)
```

## Tables

### `companies`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `name` | `text` | NOT NULL |
| `slug` | `varchar(64)` | NOT NULL, UNIQUE |
| `created_at` | `timestamptz` | NOT NULL, default `now()` |
| `updated_at` | `timestamptz` | NOT NULL, default `now()` |

### `users`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK |
| `clerk_user_id` | `varchar(128)` | NOT NULL, UNIQUE |
| `email` | `text` | NOT NULL |
| `role` | `enum('admin','client')` | NOT NULL |
| `company_id` | `uuid` | FK → `companies.id`, NULL allowed only for `admin` |
| `created_at` | `timestamptz` | NOT NULL |

Index: `(company_id)`, `(clerk_user_id)`.

### `import_jobs`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK |
| `company_id` | `uuid` | FK, NOT NULL |
| `uploaded_by_user_id` | `uuid` | FK → `users.id`, NOT NULL |
| `status` | `enum('queued','processing','completed','failed')` | NOT NULL |
| `original_filename` | `text` | NOT NULL |
| `r2_object_key` | `text` | NOT NULL |
| `row_count` | `integer` | NULL until processed |
| `error_code` | `varchar(64)` | NULL |
| `error_message` | `text` | NULL |
| `is_active` | `boolean` | NOT NULL, default false |
| `queued_at` | `timestamptz` | NOT NULL |
| `started_at` | `timestamptz` | NULL |
| `completed_at` | `timestamptz` | NULL |

Indexes: `(company_id, status)`, `(company_id, is_active)` where `is_active = true` (unique partial).

**State transitions**: `queued` → `processing` → `completed` | `failed`. On `completed`, previous `is_active` for company set false; this job `is_active = true`.

### `stock_products`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK |
| `import_job_id` | `uuid` | FK, NOT NULL |
| `company_id` | `uuid` | FK, NOT NULL (denormalized for tenant queries) |
| `product_name` | `text` | NOT NULL |
| `ean` | `varchar(32)` | NULL |
| `branches_with_stock` | `jsonb` | NOT NULL, default `'[]'` |
| `distribution` | `numeric(12,4)` | NULL |
| `branches_with_demand` | `jsonb` | NOT NULL, default `'[]'` |
| `demand_vs_distribution` | `numeric(12,4)` | NULL |
| `idd` | `numeric(12,4)` | NULL |
| `stock` | `numeric(12,4)` | NULL |
| `avg_demand` | `numeric(12,4)` | NULL |
| `stock_days` | `numeric(12,4)` | NULL |
| `item_status` | `enum('critical','attention','adequate','excess')` | NOT NULL |
| `category` | `text` | NOT NULL, default `'Sem categoria'` |
| `created_at` | `timestamptz` | NOT NULL |

Indexes: `(company_id, import_job_id)`, `(company_id, item_status)`, GIN on `branches_with_stock`.

`item_status` set at insert time by worker calling `computeItemStatus()` from `packages/domain-metrics` only.

## Derived data (not stored redundantly)

| Metric | Computed in | Consumed by |
|--------|-------------|-------------|
| `item_status` | `packages/domain-metrics` | Worker insert, dashboard filter |
| Summary KPIs (totals, critical %, avg stock days) | `StockSummaryService` | API summary endpoint, PDF export |
| Branch distribution chart series | `BranchDistributionService` | API chart endpoint, dashboard chart |
| Filtered product list | `DashboardFilterService` (server); client mirror for UX | Dashboard store |

## Seed data (development)

- Company: `demo-retail` / "Demo Retail"
- Admin user: linked to Clerk test user, `role=admin`, `company_id=null`
- Client user: `role=client`, `company_id=demo-retail`
- Sample import with fixture `fixtures/sample-stock-267-rows.xlsx`
