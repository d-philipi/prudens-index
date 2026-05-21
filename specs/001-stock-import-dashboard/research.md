# Research: Stock Import & Client Dashboard

**Feature**: `001-stock-import-dashboard` | **Date**: 2026-05-19

## R1 — Authentication provider

**Decision**: Clerk with two roles via `publicMetadata.role` (`admin` | `client`) and `publicMetadata.companyId` (UUID) for client users.

**Rationale**: User mandate; Clerk integrates with Next.js App Router middleware and Fastify via JWT verification. Metadata avoids duplicating user tables for auth while `users` table links `clerk_user_id` to `company_id`.

**Alternatives considered**: Custom JWT (more work); Auth0 (not requested).

## R2 — Dashboard pagination vs filter latency (SC-002 vs SC-003)

**Decision**: **Snapshot cache pattern** — on dashboard load, API returns summary aggregates plus up to 5,000 product rows for the active import in one (or chunked) response; frontend stores in Zustand. **UI pagination and all filters run client-side** on that snapshot. Server-side pagination endpoint exists only when snapshot exceeds 5,000 rows (admin-scale clients).

**Rationale**: Spec requires filter updates &lt;500ms without new server round-trip; typical file has ~267 rows so full snapshot is small. Meets 3s interactive target with one fetch.

**Alternatives considered**: Pure server-side pagination (fails SC-003); loading all rows on every filter (fails SC-003).

## R3 — Spreadsheet “filial” dimension

**Decision**: Columns `Lojas com estoque` and `Lojas com demanda nos últ 3 meses` are parsed as **comma-separated branch names** (trimmed) into `branches_with_stock` and `branches_with_demand` JSON arrays on each product row. Branch filter matches products where selected branch ∈ `branches_with_stock`.

**Rationale**: Template has no separate filial column; store lists encode branch membership. Distribution chart aggregates `distribuicao` grouped by branch membership (product counted per branch it appears in).

**Alternatives considered**: Ignoring filial filter (fails spec); inventing filial table without source data.

## R4 — Item status and category

**Decision**: **Item status** computed only in `packages/domain-metrics` (`computeItemStatus`) from `dias_estoque` and `idd` thresholds. **Category** not present in template — default `Sem categoria` on import; admin template v2 may add column later.

**Rationale**: Single source of truth for derived fields; avoids duplicate logic in worker vs dashboard.

**Alternatives considered**: Storing status in spreadsheet (not in template).

## R5 — PDF generation

**Decision**: Server-side PDF via API (`POST /api/client/dashboard/export-pdf`) using **pdfkit** in `apps/api/src/services/export-pdf-service.ts` — payload is filtered product IDs + summary snapshot from client request body validated by Zod (no business logic in route).

**Rationale**: pdfkit fits Fastify service layer without React runtime; consistent output; secrets stay server-side.

**Alternatives considered**: `@react-pdf/renderer` (heavier in API process); client-only print CSS (less control for sharing).

## R6 — Testing stack

**Decision**: Vitest for unit/integration in `apps/api`, `apps/worker`, `packages/*`; Playwright for E2E critical paths (upload → dashboard) in `apps/web`.

**Rationale**: Fast TS-native tests; E2E validates cross-app flows.

## R7 — In-flight upload rule

**Decision**: One `processing` job per `company_id` at a time; second upload returns `409` with message to wait or cancel (cancel out of scope v1).

**Rationale**: Prevents race on “latest snapshot” (FR-012).

## R8 — Row limits and CSV format

**Decision**: Max 5,000 data rows, 10 MB file, extensions `.xlsx` | `.csv` only.

**CSV**: Same header row and column order as XLSX; SheetJS reads UTF-8 CSV; reject if columns differ from template in `packages/shared/src/spreadsheetTemplate.ts`.

**Rationale**: Aligns with spec success criteria, FR-003/FR-004, and SC-001 processing SLA.

## R9 — SLA verification approach

**Decision**: Scripts `scripts/smoke-sla.ts` and `scripts/smoke-dashboard-load.ts` (repo root) run locally after US1/US2 and in optional CI job; assert SC-001 import→`completed` ≤60s and SC-002 dashboard parallel fetch + store hydrate ≤3s with fixture ~267 rows.

**Rationale**: Makes success criteria testable without full Playwright in MVP.

**Alternatives considered**: Playwright-only SLA checks (deferred to post-MVP E2E).
