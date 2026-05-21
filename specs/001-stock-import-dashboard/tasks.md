# Tasks: Stock Import & Client Dashboard

**Input**: Design documents from `/specs/001-stock-import-dashboard/`  
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/, research.md, quickstart.md

**Tests**: Not requested in spec — test tasks omitted. SLA smoke scripts in Polish (T083–T084).

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

## Path Conventions

- Monorepo root: `apps/web/`, `apps/api/`, `apps/worker/`, `packages/shared/`, `packages/domain-metrics/`
- API layer order: `routes/` → `services/` → `repositories/` (never invert)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Monorepo foundation, Docker, lint/CI — Plan Phase 0

- [x] T001 Create root `package.json` and `pnpm-workspace.yaml` with workspaces `apps/*` and `packages/*`
- [x] T002 [P] Add root `tsconfig.base.json` with `strict: true` in `packages/shared/tsconfig.json` for apps to extend
- [x] T003 [P] Scaffold `apps/web/package.json` with Next.js 15 App Router, TypeScript strict, Tailwind v4, Shadcn/UI, Zustand, Recharts, react-dropzone (no Axios)
- [x] T004 [P] Scaffold `apps/api/package.json` with Fastify, TypeScript, Drizzle, Zod
- [x] T005 [P] Scaffold `apps/worker/package.json` with BullMQ, SheetJS, TypeScript
- [x] T006 [P] Scaffold `packages/shared/package.json` exporting Zod schemas and shared types
- [x] T007 [P] Scaffold `packages/domain-metrics/package.json` for calculation exports only
- [x] T008 Create `docker/docker-compose.yml` with PostgreSQL 16 and Redis 7 on internal network
- [x] T009 Add root `.eslintrc.cjs`, `prettier.config.mjs`, and scripts `lint` / `format` in root `package.json`
- [x] T010 [P] Add `.github/workflows/ci.yml` with `lint`, `typecheck`, and optional `smoke-sla` job (continue-on-error until apps exist)
- [x] T011 Add `turbo.json` with `build`, `lint`, `test` pipeline across workspaces
- [x] T012 Add `.env.example` files in `apps/web/`, `apps/api/`, `apps/worker/` documenting required vars (no secrets)

**Checkpoint**: `pnpm install && docker compose -f docker/docker-compose.yml up -d && pnpm typecheck` passes

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Auth, database, shared validation — Plan Phases 1–2. MUST complete before user stories.

- [x] T013 Configure Clerk in `apps/web/src/app/layout.tsx` with `ClerkProvider` and sign-in route `apps/web/src/app/(auth)/sign-in/[[...sign-in]]/page.tsx`
- [x] T014 Implement `apps/web/middleware.ts` with `clerkMiddleware` protecting `/admin/*` (role=admin) and `/dashboard/*` (role=client)
- [x] T015 [P] Create admin layout shell in `apps/web/src/app/(admin)/admin/layout.tsx`
- [x] T016 [P] Create client layout shell in `apps/web/src/app/(client)/dashboard/layout.tsx`
- [x] T017 Implement `apps/api/src/plugins/auth.ts` verifying Clerk JWT and attaching `AuthContext` to requests
- [x] T018 Implement `apps/api/src/services/auth-context-service.ts` resolving DB user and enforcing role rules
- [x] T019 Implement `apps/api/src/repositories/user-repository.ts` with Drizzle lookup by `clerk_user_id`
- [x] T020 [P] Implement `apps/api/src/plugins/cors.ts` allowing only `CORS_ORIGIN` env (Vercel domain in prod)
- [x] T021 [P] Implement `apps/api/src/plugins/rate-limit.ts` with `@fastify/rate-limit` (base config; wired to upload routes in US1)
- [x] T022 Create Drizzle schema `apps/api/drizzle/schema/companies.ts` per data-model.md
- [x] T023 [P] Create Drizzle schema `apps/api/drizzle/schema/users.ts` with role enum
- [x] T024 [P] Create Drizzle schema `apps/api/drizzle/schema/import-jobs.ts` with status enum and `is_active`
- [x] T025 [P] Create Drizzle schema `apps/api/drizzle/schema/stock-products.ts` with all spreadsheet columns
- [x] T026 Generate and commit Drizzle migrations in `apps/api/drizzle/migrations/`
- [x] T027 Implement `apps/api/src/repositories/company-repository.ts` (CRUD only)
- [x] T028 Implement `apps/api/src/services/company-service.ts` listing companies for admin via `company-repository` (no business logic in route)
- [x] T029 [P] Implement `apps/api/src/repositories/import-job-repository.ts` with CRUD plus `deactivateActiveByCompany(companyId)` and `markActive(jobId)` (Drizzle only)
- [x] T030 [P] Implement `apps/api/src/repositories/stock-product-repository.ts` (CRUD only)
- [x] T031 Create `packages/shared/src/spreadsheetTemplate.ts` with exact 10 headers and Zod row schema
- [x] T032 [P] Export shared API types in `packages/shared/src/types/` aligned with `contracts/api.openapi.yaml`
- [x] T033 Implement `packages/domain-metrics/src/parseBranchList.ts` parsing comma-separated branch names
- [x] T034 Implement `packages/domain-metrics/src/computeItemStatus.ts` as sole item-status calculation
- [x] T035 Create `apps/api/scripts/seed.ts` for demo company, admin user, and client user
- [x] T036 Implement `apps/web/src/lib/apiClient.ts` using native `fetch` with Clerk Bearer token (no Axios)

**Checkpoint**: Auth blocks cross-role access; `pnpm db:migrate && pnpm db:seed` succeeds

---

## Phase 3: User Story 1 — Admin imports client stock file (Priority: P1) 🎯 MVP

**Goal**: Admin uploads `.xlsx`/`.csv`, async processing with status feedback, data persisted per company.

**Independent Test**: Admin uploads valid fixture for Client A, sees `queued → processing → completed`, import recorded—without opening client dashboard.

### Implementation for User Story 1

- [x] T037 [P] [US1] Implement `apps/api/src/services/r2-storage-service.ts` for presigned PUT/GET URLs (private bucket)
- [x] T038 [P] [US1] Implement `apps/api/src/services/spreadsheet-validation-service.ts` validating headers and sample rows via Zod
- [x] T039 [US1] Implement `apps/api/src/services/import-service.ts` (presign, in-flight rule, enqueue, status; no logic in routes)
- [x] T040 [US1] Implement `apps/api/src/routes/admin-companies.ts` GET `/api/admin/companies` → CompanyService (Zod query only)
- [x] T041 [US1] Implement `apps/api/src/routes/admin-imports.ts` POST/GET routes per contracts (Zod → ImportService)
- [x] T042 [US1] Register admin routes in `apps/api/src/server.ts` with auth plugin (admin role only) and rate-limit on POST imports
- [x] T043 [P] [US1] Configure BullMQ queue in `apps/api/src/services/queue-service.ts` enqueuing `process-import` jobs
- [x] T044 [US1] Implement `apps/worker/src/services/spreadsheet-parser-service.ts` parsing `.xlsx` (SheetJS) and `.csv` (SheetJS/UTF-8) into rows validated by `packages/shared` Zod schema
- [x] T045 [US1] Implement `apps/worker/src/jobs/process-import.ts`: status transitions, bulk insert products, transactional `deactivateActiveImports(companyId)` then `setJobActive(importJobId)` per data-model.md FR-012
- [x] T046 [US1] Wire worker entrypoint `apps/worker/src/index.ts` consuming Redis queue in separate process/container
- [x] T047 [P] [US1] Create `apps/web/src/components/ImportUploadForm.tsx` with react-dropzone and company selector
- [x] T048 [P] [US1] Create `apps/web/src/components/ImportStatusPanel.tsx` polling GET `/api/admin/imports/:id`
- [x] T049 [US1] Build `apps/web/src/app/(admin)/admin/imports/page.tsx` composing upload form and status panel
- [x] T050 [US1] Add upload flow in `ImportUploadForm.tsx`: POST imports → PUT to presigned URL → POST complete-upload
- [x] T051 [US1] Handle validation errors in `ImportUploadForm.tsx` displaying API error messages before processing
- [x] T052 [US1] Add `fixtures/sample-stock-267-rows.xlsx` matching spreadsheet template; optional `fixtures/sample-stock-267-rows.csv` with same headers for CSV smoke
- [x] T053 [US1] Implement import history list on admin page calling GET `/api/admin/companies/:id/imports`

**Checkpoint**: Valid fixture reaches `completed` within 60s locally; invalid file rejected pre-queue; prior active import for same company is deactivated when new job completes

---

## Phase 4: User Story 2 — Client views stock dashboard (Priority: P2)

_Aligned with plan Phase 4 (table/charts/KPIs only). Filters: Phase 5 / US3._

**Goal**: Client sees responsive dashboard with KPI cards, product table, branch distribution chart; tenant-isolated; interactive within 3s.

**Independent Test**: Client B user with seeded data sees only Client B products, KPIs, and chart—no admin upload in session.

### Implementation for User Story 2

- [x] T054 [P] [US2] Implement `packages/domain-metrics/src/computeDashboardSummary.ts` exported for API service use
- [x] T055 [P] [US2] Implement `packages/domain-metrics/src/computeBranchDistribution.ts` exported for API service use
- [x] T056 [US2] Implement `apps/api/src/services/dashboard-query-service.ts` tenant-scoped active snapshot fetch
- [x] T057 [US2] Implement `apps/api/src/services/stock-summary-service.ts` using `computeDashboardSummary`
- [x] T058 [US2] Implement `apps/api/src/services/branch-distribution-service.ts` using `computeBranchDistribution`
- [x] T059 [US2] Implement `apps/api/src/routes/client-dashboard.ts` for GET summary, products, branch-distribution (Zod → services)
- [x] T060 [US2] Register client dashboard routes in `apps/api/src/server.ts` with auth plugin (client role + companyId enforcement)
- [x] T061 [P] [US2] Create `apps/web/src/store/dashboardStore.ts` Zustand store for snapshot cache (no calculations in components)
- [x] T062 [P] [US2] Create `apps/web/src/components/DashboardKpiCards.tsx` displaying summary props only
- [x] T063 [P] [US2] Create `apps/web/src/components/ProductsTable.tsx` with client-side pagination; columns include branch lists (`branches_with_stock`), IDD, stock, item status
- [x] T064 [P] [US2] Create `apps/web/src/components/BranchDistributionChart.tsx` using Recharts
- [x] T065 [US2] Build `apps/web/src/app/(client)/dashboard/page.tsx` parallel-fetching summary, products (≤5000), and chart into store
- [x] T066 [US2] Add empty state in `apps/web/src/app/(client)/dashboard/page.tsx` when no active import exists
- [x] T067 [US2] Verify tenant isolation in `dashboard-query-service.ts` asserting `ctx.companyId` on all queries

**Checkpoint**: Dashboard loads and is usable with seeded data; Client A cannot see Client B data

---

## Phase 5: User Story 3 — Client filters and exports report (Priority: P3)

**Goal**: Filters update view within 500ms without server round-trip; PDF export matches filtered view.

**Independent Test**: Apply branch/category/status filters, confirm instant UI update, export PDF matching filtered rows.

### Implementation for User Story 3

- [x] T068 [P] [US3] Implement `packages/domain-metrics/src/filterProducts.ts` as sole client-side filter logic
- [x] T069 [US3] Add derived selectors in `apps/web/src/store/dashboardStore.ts` applying `filterProducts` to table, KPIs, and chart data
- [x] T070 [P] [US3] Create `apps/web/src/components/DashboardFilters.tsx` for branch, category, and item status filters
- [x] T071 [US3] Integrate `DashboardFilters.tsx` into `apps/web/src/app/(client)/dashboard/page.tsx` updating derived selectors only (no fetch on filter change)
- [x] T072 [US3] Add empty filtered state with clear-filters action in `apps/web/src/app/(client)/dashboard/page.tsx`
- [x] T073 [US3] Implement `apps/api/src/services/export-pdf-service.ts` using pdfkit per research R5; reuses `StockSummaryService` for PDF metrics
- [x] T074 [US3] Implement `apps/api/src/routes/client-export.ts` POST `/api/client/dashboard/export-pdf` (Zod → ExportPdfService)
- [x] T075 [P] [US3] Create `apps/web/src/components/ExportPdfButton.tsx` sending filtered `productIds` and filters to API
- [x] T076 [US3] Wire `ExportPdfButton.tsx` on dashboard page downloading PDF blob response

**Checkpoint**: Filters feel instant; PDF content matches filtered dashboard

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, deployment hints, constitution validation, SLA smoke

- [x] T077 [P] Add Dockerfiles for `apps/api` and `apps/worker` (separate images per constitution)
- [x] T078 [P] Add `apps/web` Vercel deployment config `vercel.json` if needed for App Router
- [x] T079 Document env separation in `specs/001-stock-import-dashboard/quickstart.md` cross-check against implemented paths; add `pnpm smoke:sla` script
- [x] T080 Run quickstart smoke test per `quickstart.md` and fix gaps in README at repo root if missing
- [x] T081 Constitution audit: grep for `any`, `@ts-ignore`, Axios, duplicated `computeItemStatus` outside domain-metrics
- [x] T082 [P] Add mobile responsive pass on `ImportUploadForm.tsx`, `ProductsTable.tsx`, and `DashboardFilters.tsx`
- [x] T083 [P] Add `scripts/smoke-sla.ts` asserting SC-001: fixture upload to `completed` within 60s (local Docker)
- [x] T084 [P] Add `scripts/smoke-dashboard-load.ts` asserting SC-002: client dashboard endpoints + store hydrate ≤3s with seeded 267-row snapshot; document manual SC-003 filter &lt;500ms check in output
- [x] T085 Add structured logging in `apps/api/src/server.ts` and `apps/worker/src/index.ts` for import lifecycle events

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — **blocks all user stories**
- **US1 (Phase 3)**: Depends on Foundational — MVP data pipeline
- **US2 (Phase 4)**: Depends on Foundational; needs completed import data from US1 for full E2E (can use seed data for parallel start)
- **US3 (Phase 5)**: Depends on US2 dashboard store and components
- **Polish (Phase 6)**: Depends on US1–US3 complete

### User Story Dependencies

| Story | Depends on | Can start after |
|-------|------------|-----------------|
| US1 (P1) | Foundational | Phase 2 complete |
| US2 (P2) | Foundational; data from US1 or seed | Phase 2 complete (use seed until US1 done) |
| US3 (P3) | US2 dashboard | Phase 4 complete |

### Within Each User Story

- Shared packages (`domain-metrics`, `shared`) before API services
- Services before routes (T028 CompanyService before T040 admin-companies)
- API before web UI consumption
- Worker jobs after API queue service

### Parallel Opportunities

- **Phase 1**: T002–T007, T010 in parallel after T001
- **Phase 2**: Schema files T023–T025 in parallel; layouts T015–T016 in parallel
- **US1**: T037–T038, T043, T047–T048 in parallel after T039 planned
- **US2**: T054–T055, T061–T064 in parallel after API services
- **US3**: T068, T070, T075 in parallel

---

## Parallel Example: User Story 1

```bash
# After T039 ImportService exists, launch in parallel:
T037 R2 storage service
T038 Spreadsheet validation service
T043 BullMQ queue service
T047 ImportUploadForm.tsx
T048 ImportStatusPanel.tsx
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup  
2. Complete Phase 2: Foundational  
3. Complete Phase 3: User Story 1  
4. **STOP and VALIDATE**: Admin upload smoke test with fixture  
5. Demo import pipeline before building dashboard  

### Incremental Delivery

1. Setup + Foundational → foundation ready  
2. US1 → admin can import stock data (MVP)  
3. US2 → client dashboard with intelligence  
4. US3 → filters + PDF export  
5. Polish → deploy readiness + SLA scripts (T083–T084)  

### Suggested MVP Scope

**User Story 1 (P1)** — admin upload and async processing. Delivers data foundation per spec.

---

## Task Summary

| Phase | Task IDs | Count |
|-------|----------|-------|
| Setup | T001–T012 | 12 |
| Foundational | T013–T036 | 24 |
| US1 (P1) | T037–T053 | 17 |
| US2 (P2) | T054–T067 | 14 |
| US3 (P3) | T068–T076 | 9 |
| Polish | T077–T085 | 9 |
| **Total** | | **85** |

**Format validation**: All 85 tasks use `- [ ] [TaskID] [P?] [Story?] Description with file path` format.

**Remediation** (2026-05-19): C1 T028 CompanyService; C2 T029/T045 `is_active`; I1 plan/tasks phase alignment; C3 T083–T084 SLA smoke; C4 T003/T044 CSV+xlsx.
