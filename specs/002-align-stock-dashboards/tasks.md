# Tasks: Alinhamento de Estoque, Status por IDD e PainÃ©is Admin/Cliente

**Input**: Design documents from `/specs/002-align-stock-dashboards/`  
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/, research.md, quickstart.md

**Tests**: Vitest apenas para `computeItemStatusFromIdd` (research R9). Demais validaÃ§Ã£o via quickstart smoke.

**Organization**: Fases 0â€“5 do plano mapeadas para user stories; monorepo 001 jÃ¡ existe â€” Setup mÃ­nimo.

## Format: `[ID] [P?] [Story] Description`

## Path Conventions

- Monorepo: `apps/web/`, `apps/api/`, `apps/worker/`, `packages/shared/`, `packages/domain-metrics/`
- API layer order: `routes/` â†’ `services/` â†’ `repositories/` (never invert)
- Branch: `002-align-stock-dashboards`

---

## Phase 1: Setup (Feature Bootstrap)

**Purpose**: Tipos compartilhados e tooling mÃ­nimo para a feature 002

- [x] T001 Confirm active feature directory `specs/002-align-stock-dashboards` in `.specify/feature.json`
- [x] T002 [P] Update `ItemStatus` union to `distribution` | `adequate` | `boost` in `packages/shared/src/types/index.ts`
- [x] T003 [P] Add Vitest script and `computeItemStatusFromIdd` test file scaffold in `packages/domain-metrics/package.json` and `packages/domain-metrics/src/idd-item-status.test.ts`

**Checkpoint**: `pnpm --filter @prudens/shared typecheck` passes with new types

---

## Phase 2: Foundational (Schema & Migration â€” Plan Fase 0)

**Purpose**: Drizzle schema + `0001_align_stock_products.sql` â€” **BLOCKS all user stories**

**âš ï¸ CRITICAL**: No US work until migration applied locally

- [x] T004 Rewrite `apps/api/drizzle/schema/stock-products.ts` with `stores_with_stock` integer, `branches_with_demand` integer, `average_demand`, `stock` integer, `item_status` text, drop `category` per `data-model.md`
- [x] T005 Create `apps/api/drizzle/migrations/0001_align_stock_products.sql` with backfill from jsonb, IDD-based status, CHECK constraint, drop legacy `item_status` enum per `plan.md` Fase 0
- [x] T006 Apply migration via `apps/api/scripts/migrate.ts` and verify `\d stock_products` matches `quickstart.md` Â§1
- [x] T007 [P] Create `packages/shared/src/sheet-mapping.ts` with `SHEET_COLUMN_MAPPING` object per `plan.md` Fase 2
- [x] T008 [P] Add `apps/api/src/lib/sheet-mapping.ts` re-exporting from `@prudens/shared/sheet-mapping`
- [x] T009 [P] Update `apps/api/src/lib/mappers.ts` for renamed columns (`storesWithStock`, `averageDemand`) and new `ItemStatus` values

**Checkpoint**: DB migrated; schema types compile; no `branches_with_stock` jsonb remains

---

## Phase 3: User Story 1 â€” Dados de produto fiÃ©is Ã  planilha (Priority: P1) ðŸŽ¯ MVP

**Goal**: Parser/worker persistem colunas com nomes e tipos corretos; erros por linha sem abortar job inteiro (exceto cabeÃ§alho invÃ¡lido).

**Independent Test**: Importar planilha vÃ¡lida; SQL confirma `stores_with_stock`, `average_demand`, ints/decimals corretos em `stock_products` (ver `quickstart.md` Â§4).

### Implementation for User Story 1

- [x] T010 [P] [US1] Refactor `packages/shared/src/spreadsheetTemplate.ts` Zod schema: int cols (`stores_with_stock`, `branches_with_demand`, `stock`), remove branch list raw fields, require `idd`
- [x] T011 [US1] Update `apps/worker/src/services/spreadsheet-parser-service.ts` to use `SHEET_COLUMN_MAPPING`, Zod per row, collect `{ line, code }` errors and continue; in `process-import.ts` set job `failed` if zero rows inserted, `completed` with `error_message` summary if partial line failures (header invalid â†’ fail before any insert)
- [x] T012 [US1] Update `apps/api/src/services/spreadsheet-validation-service.ts` to use shared mapping for pre-upload validation
- [x] T013 [US1] Update `apps/worker/src/jobs/process-import.ts` INSERT to new column list (`stores_with_stock`, `average_demand`, no `category`)
- [x] T014 [P] [US1] Align `StockProduct` DTOs in `packages/shared/src/types/` and `apps/api/src/lib/mappers.ts` with `contracts/api.openapi.yaml`
- [x] T015 [US1] Update fixture/seed spreadsheet rows in `apps/api/scripts/seed.ts` if sample import uses numeric store counts

**Checkpoint**: Completed import rows match spreadsheet values; invalid header fails job before activate

---

## Phase 4: User Story 2 â€” Status por IDD server-side (Priority: P1)

**Goal**: `item_status` calculado sÃ³ no processamento via IDD; nunca no cliente.

**Independent Test**: Import rows with IDD -1, 0, 20, 21 â†’ DB shows `distribution`, `adequate`, `adequate`, `boost` (quickstart Â§3).

### Implementation for User Story 2

- [x] T016 [P] [US2] Implement `computeItemStatusFromIdd` in `packages/domain-metrics/src/idd-item-status.ts` per plan signature and edge cases
- [x] T017 [P] [US2] Export from `packages/domain-metrics/src/index.ts`; remove or deprecate `packages/domain-metrics/src/computeItemStatus.ts`
- [x] T018 [US2] Add facade `apps/api/src/services/idd.service.ts` re-exporting from `@prudens/domain-metrics`
- [x] T019 [US2] Call `computeItemStatusFromIdd` in `apps/worker/src/jobs/process-import.ts` before each INSERT (never from spreadsheet column)
- [x] T020 [P] [US2] Implement Vitest cases in `packages/domain-metrics/src/idd-item-status.test.ts` for FR-012â€“FR-014 boundaries

**Checkpoint**: No references to old `critical|attention|excess` enum; worker tests pass

---

## Phase 5: User Story 3 â€” Dashboard admin (Priority: P2)

**Goal**: MÃ©tricas globais, busca de empresas, cards e detalhe com jobs + fonte ativa; Server Components para carga inicial.

**Independent Test**: Admin vÃª painel 3 KPIs, busca por nome, abre detalhe e identifica `activeImportJobId` (spec SC-003, SC-004).

### Implementation for User Story 3

- [x] T021 [P] [US3] Add `listWithStats(search?)` and `avgIddGroupedByCompany()` in `apps/api/src/repositories/company-repository.ts` using Drizzle `avg()` + `groupBy` (no Node loops)
- [x] T022 [US3] Implement `apps/api/src/services/admin-metrics-service.ts` â†’ `GET /api/admin/metrics` totals
- [x] T023 [US3] Expand `apps/api/src/services/admin-company-service.ts` for list + detail with imports from `import-job-repository.ts`
- [x] T024 [P] [US3] Create `apps/api/src/routes/admin-metrics.ts` with Zod + `assertAdmin`
- [x] T025 [US3] Expand `apps/api/src/routes/admin-companies.ts` with `?q=` and `GET /api/admin/companies/:id`
- [x] T026 [US3] Register `admin-metrics` routes in `apps/api/src/server.ts`
- [x] T027 [P] [US3] Create `apps/web/src/components/admin/MetricsPanel.tsx`: KPI total empresas, KPI total produtos, e lista/tabela `avgIddByCompany` (nome + IDD mÃ©dio por empresa) â€” nÃ£o um Ãºnico nÃºmero global (FR-016)
- [x] T028 [P] [US3] Create `apps/web/src/components/admin/CompanySearch.tsx` (client) driving `?q=` navigation
- [x] T029 [P] [US3] Create `apps/web/src/components/admin/CompanyCard.tsx` with link to detail
- [x] T030 [US3] Create `apps/web/src/app/(admin)/admin/page.tsx` async RSC fetching metrics + companies (no `useEffect` initial load)
- [x] T031 [US3] Create `apps/web/src/app/(admin)/admin/companies/[id]/page.tsx` async RSC for cadastro + jobs + active file

**Checkpoint**: `/admin` functional; non-admin receives 403 on API

---

## Phase 6: User Story 4 â€” Tela do cliente (Priority: P2)

**Goal**: Overview, produtos com `chart_data` + cursor pagination, filtros Zustand (term + item_status only), PDF alinhado; sem filtro filial (Q1:A).

**Independent Test**: Cliente vÃª IDD mÃ©dio, grÃ¡fico e tabela sincronizados via API; PDF count matches filtered set; sem importaÃ§Ã£o ativa â†’ empty state (spec SC-005, SC-006, US4.8).

### Implementation for User Story 4

- [x] T032 [P] [US4] Implement `apps/api/src/lib/cursor-pagination.ts` encode/decode token per `data-model.md`
- [x] T033 [US4] Extend `apps/api/src/repositories/stock-product-repository.ts` with `findPaginated` + `chartData` sharing same WHERE (active import, `company_id`, term, status); cap `chart_data` at 500 rows server-side (SC-005)
- [x] T034 [US4] Implement `apps/api/src/services/client-overview-service.ts` (avg IDD, company name, `lastUpdatedAt`)
- [x] T035 [US4] Implement `apps/api/src/services/client-products-service.ts` returning `items`, `nextCursor`, `total`, `chart_data`
- [x] T036 [P] [US4] Create `apps/api/src/routes/client-overview.ts` â†’ `GET /api/client/overview` with `assertClient`
- [x] T037 [US4] Create `apps/api/src/routes/client-products.ts` â†’ `GET /api/client/products` Zod query (no `filial` param)
- [x] T038 [US4] Update `apps/api/src/services/export-pdf-service.ts` and `apps/api/src/routes/client-export.ts` to accept same filters as products endpoint
- [x] T039 [US4] Register new client routes in `apps/api/src/server.ts`; remove or 410 deprecated `apps/api/src/routes/client-dashboard.ts` endpoints
- [x] T040 [P] [US4] Create `apps/web/src/lib/item-status-chart-colors.ts` as sole chart color source
- [x] T041 [US4] Refactor `apps/web/src/store/dashboardStore.ts` for `term`, `itemStatuses`, `sort`, `order`, `cursor` (no `branches`/`category`); store MUST NOT compute or map `item_status` from IDD (FR-015)
- [x] T042 [P] [US4] Create `apps/web/src/components/client/IndexHeader.tsx`
- [x] T043 [P] [US4] Create `apps/web/src/components/client/FilterSidebar.tsx` with search, status checkboxes, export trigger
- [x] T044 [US4] Create `apps/web/src/components/client/IddBarChart.tsx` using Recharts + `ITEM_STATUS_CHART_COLORS` only; use `item_status` from API/`chart_data` only â€” no `computeItemStatusFromIdd` import (FR-015)
- [x] T045 [US4] Create `apps/web/src/components/client/ProductTable.tsx` with server-driven sort/pagination; columns per FR-022: product_name, ean, stores_with_stock, distribution, branches_with_demand, demand_vs_distribution, idd, stock, average_demand, stock_days, item_status
- [x] T046 [US4] Create `apps/web/src/components/client/ExportButton.tsx` posting filters to PDF endpoint
- [x] T047 [US4] Rewrite `apps/web/src/app/(client)/dashboard/page.tsx` with RSC initial overview + products, client island for filter refetch; when `lastUpdatedAt` is null show empty state (US4 scenario 8) instead of chart/table
- [x] T048 [US4] Remove obsolete `apps/web/src/components/BranchDistributionChart.tsx`, `DashboardFilters.tsx` branch/category UI, and dead imports from dashboard page

**Checkpoint**: `/dashboard` uses new APIs only; chart_data matches table filters

---

## Phase 7: Polish & Cross-Cutting (Plan Fase 5 + cleanup)

**Purpose**: Tenant isolation, deprecations, smoke validation

- [x] T049 [P] Audit all client repositories/services enforce `request.auth.companyId` â€” never query param `companyId` â€” document in `apps/api/src/plugins/auth.ts` comment block
- [x] T050 Verify `assertAdmin` on every `/api/admin/*` handler and `assertClient` on `/api/client/*` in `apps/api/src/routes/`
- [x] T051 [P] Remove unused `apps/api/src/services/branch-distribution-service.ts` and `apps/api/src/services/dashboard-query-service.ts` if fully replaced
- [x] T052 [P] Update `apps/web/src/lib/apiClient.ts` paths to `/api/client/overview` and `/api/client/products`
- [x] T053 Run full `specs/002-align-stock-dashboards/quickstart.md` smoke checklist and fix gaps; include SC-005 timing: first dashboard load (overview + products page 1 + chart_data) â‰¤5s with ~2k products in DB
- [x] T054 [P] Verify `pnpm typecheck` and `pnpm lint` at repo root

**Checkpoint**: SC-007 tenant isolation manual test documented; quickstart passes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: Start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 â€” **blocks US1â€“US4**
- **Phase 3 (US1)**: Depends on Phase 2
- **Phase 4 (US2)**: Depends on Phase 3 (needs `idd` column persisted correctly)
- **Phase 5 (US3)**: Depends on Phase 2 (needs migrated schema); can parallel with US4 after US1+US2
- **Phase 6 (US4)**: Depends on Phase 2 + US2 (needs valid `item_status` data)
- **Phase 7 (Polish)**: Depends on US3 + US4

### User Story Dependencies

| Story | Depends on | Can parallel with |
|-------|------------|-------------------|
| US1 | Phase 2 | â€” |
| US2 | US1 | â€” |
| US3 | Phase 2 | US4 after US2 |
| US4 | Phase 2, US2 | US3 after US2 |

### Within Each User Story

- Repository before service before route
- Shared packages before worker/API consumers
- API before web components that fetch endpoints

### Parallel Opportunities

```bash
# Phase 2 parallel:
T007 sheet-mapping.ts + T008 api re-export + T009 mappers

# US1 parallel:
T010 spreadsheetTemplate + T014 DTO types

# US2 parallel:
T016 idd-item-status.ts + T020 vitest

# US3 parallel:
T027 MetricsPanel + T028 CompanySearch + T029 CompanyCard

# US4 parallel:
T036 client-overview route + T040 chart colors + T042 IndexHeader + T043 FilterSidebar
```

---

## Implementation Strategy

### MVP First (US1 + US2)

1. Phase 1 â†’ Phase 2 (migration)
2. Phase 3 (US1) + Phase 4 (US2)
3. **STOP**: Re-import spreadsheet; verify SQL + item_status
4. Deploy/demo data pipeline before UI

### Incremental Delivery

1. US1 + US2 â†’ import pipeline correct (MVP)
2. US3 â†’ admin operational visibility
3. US4 â†’ client-facing dashboard
4. Phase 7 â†’ hardening + cleanup

### Suggested MVP Scope

**Phases 1â€“4 only** (T001â€“T020): schema alignment + import + IDD status. Validates FR-001â€“FR-015 and SC-001â€“SC-002.

---

## Notes

- `computeItemStatusFromIdd` canonical in `packages/domain-metrics`; `idd.service.ts` is facade only (constitution V)
- No `filial` filter anywhere (spec Q1:A)
- Client filters are API-driven (spec I1); no in-memory full-dataset filtering
- FR-015: never import `computeItemStatusFromIdd` in `apps/web`
- Admin AVG IDD must use SQL `GROUP BY`, not application loops (FR-016, plan Fase 3)
- Recharts colors only from `item-status-chart-colors.ts`
