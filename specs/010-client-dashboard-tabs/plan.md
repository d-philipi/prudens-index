# Implementation Plan: Abas do Dashboard Cliente e Ajustes de Status

**Branch**: `010-client-dashboard-tabs` | **Date**: 2026-05-29 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/010-client-dashboard-tabs/spec.md`

## Summary

Reorganizar a experiência do cliente em três abas (Dashboard, Produtos, Exportação),
adicionar resumo executivo agregado server-side, reintroduzir relatório PDF e ajustar a
cascata de status em `packages/domain-metrics` (passo 0 demanda zero, piso de 30 dias para
Saudável, insights contextualizados). Reaproveitar stack existente: Fastify + Drizzle na API,
worker BullMQ, Zustand no frontend, `pdfkit` já presente na API, R2 para planilhas.

## Technical Context

**Language/Version**: TypeScript strict — Next.js 15 App Router (frontend), Node.js 20 LTS (API/worker)  
**Primary Dependencies**: Fastify, Drizzle, BullMQ, Shadcn/UI, Tailwind v4, Recharts, Zustand, Clerk, pdfkit, `@prudens/domain-metrics`, `@prudens/shared`  
**Storage**: PostgreSQL 16 (sem migration nova), Redis 7, Cloudflare R2  
**Testing**: Vitest (`packages/domain-metrics`, API unit onde aplicável)  
**Target Platform**: Vercel (web), Hetzner/Coolify Docker (API + worker)  
**Project Type**: Monorepo pnpm — `apps/web`, `apps/api`, `apps/worker`, `packages/shared`, `packages/domain-metrics`  
**Performance Goals**: Resumo executivo &lt; 2s com até 5.000 SKUs; PDF &lt; 30s na maioria dos casos  
**Constraints**: Route → Service → Repository; Zod em toda entrada; pt-BR na UI; SSOT em domain-metrics  
**Scale/Scope**: Perfil cliente apenas; 3 rotas novas + 4 endpoints API; sem colunas novas

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Reference: `.specify/memory/constitution.md` (Prudens Index v1.1.0)

| Gate | Pass criteria | Status |
|------|----------------|--------|
| Stack | Next 15, Fastify, Drizzle, pdfkit (aprovado), Recharts frontend | ✅ |
| Layer boundaries | Frontend fetch → API; agregações no Repository; PDF no Service API | ✅ |
| API sequence | Novos endpoints Route (Zod) → Service → Repository | ✅ |
| Validation & auth | Zod query/body/params; `assertClient` + `companyId` | ✅ |
| Secrets & CORS | Presigned R2 server-side; sem secrets em `NEXT_PUBLIC_*` | ✅ |
| DRY & naming | Cascata só em `domain-metrics`; status-config → shared | ✅ |
| Mobile-first | 3 abas na barra inferior; resumo empilhado | ✅ |
| Operator language (pt-BR) | UI, erros API, insights, PDF | ✅ |
| Actionable errors | Export/download com mensagens pt-BR (404/403) | ✅ |

**Post-design re-check**: Nenhuma violação. Complexidade Tracking vazio.

## Project Structure

### Documentation (this feature)

```text
specs/010-client-dashboard-tabs/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/api.openapi.yaml
└── tasks.md              # /speckit.tasks
```

### Source Code (touch map)

```text
packages/domain-metrics/src/
├── calculate-item-status.ts          # cascata + insights (SSOT)
└── calculate-item-status.test.ts     # casos fronteira 010

packages/shared/src/
├── types/index.ts                    # ClientDashboardSummaryDto, ExportVersionDto
├── status-config.ts                  # NOVO — movido do web
└── formatters.ts                     # reutilizado

apps/worker/src/jobs/
└── process-import.ts                 # pass stock + stock_days bruto

apps/api/src/
├── routes/
│   ├── client-dashboard-summary.ts   # NOVO
│   └── client-export.ts              # estender versions, files/:jobId, POST pdf
├── services/
│   ├── client-dashboard-summary-service.ts  # NOVO
│   ├── client-export-service.ts      # estender
│   └── client-export-pdf-service.ts  # NOVO (pdfkit)
├── repositories/
│   ├── stock-product-repository.ts   # aggregateExecutiveSummary
│   └── import-job-repository.ts      # listCompletedByCompany
├── schemas/
│   └── client-export-schemas.ts      # summary query, pdf body, jobId param
└── scripts/
    └── backfill-item-status.ts       # NOVO

apps/web/src/
├── lib/navigation.ts                 # Produtos + Exportação (cliente)
├── lib/page-meta.ts                  # metas /produtos, /exportacao
├── lib/status-config.ts              # reexport @prudens/shared
├── store/dashboardStore.ts           # slices dashboard vs products
├── app/(client)/
│   ├── dashboard/page.tsx            # DashboardView enxuto
│   ├── produtos/page.tsx             # NOVO
│   └── exportacao/page.tsx           # NOVO
└── components/client/
    ├── DashboardView.tsx             # chart + summary + status filter
    ├── ProductsView.tsx              # NOVO — FilterBar + ProductTable
    ├── ExportView.tsx                # NOVO — versões + PDF
    ├── ExecutiveSummary.tsx          # NOVO
    └── DashboardStatusFilter.tsx     # NOVO — filtro simples
```

**Structure Decision**: Monorepo existente; feature toca domain-metrics (SSOT), API (agregação + PDF + export), web (3 abas), worker (input bruto). Admin inalterado.

## Complexity Tracking

> Nenhuma violação da constituição que exija justificativa.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |

---

## Phase 0: Research ✅

Concluído em [research.md](./research.md). Decisões-chave:

| Tópico | Decisão |
|--------|---------|
| Backfill | Script batch + `calculateItemStatus` (não re-run job) |
| PDF | Server-side `pdfkit` na API |
| Gráfico PDF | Barras vetoriais pdfkit (não Recharts no servidor) |
| Filtros abas | Independentes (dashboard vs products no Zustand) |
| Status config | Mover para `@prudens/shared` |
| Resumo | Endpoint dedicado `GET /api/client/dashboard/summary` |

---

## Phase 1: Design & Contracts ✅

Artefatos: [data-model.md](./data-model.md), [contracts/api.openapi.yaml](./contracts/api.openapi.yaml), [quickstart.md](./quickstart.md).

### 1.1 Domain-metrics — cascata e insights

**Arquivo**: `packages/domain-metrics/src/calculate-item-status.ts`

1. Estender input: `{ stock_days: number | null, stock: number, idd, average_demand, tied_up_capital }`.
2. Implementar passo 0 antes de normalização.
3. Passo 5: `healthy` somente se `days > 30` e `0 ≤ idd ≤ 20`; `15 ≤ days ≤ 30` + IDD saudável → `low_stock`.
4. `buildActionInsight`: variantes `low_stock` (volume vs oportunidade) e `stuck_stock` (demanda zero vs excesso).
5. Atualizar testes em `calculate-item-status.test.ts` (todos os casos do quickstart §2).

**Worker**: `process-import.ts` — passar `stock` e `stockDays` bruto (não coercer null → 0 antes da função).

### 1.2 Backfill

**Arquivo**: `apps/api/src/scripts/backfill-item-status.ts`

- Para cada empresa com job ativo: SELECT produtos → `calculateItemStatus` → UPDATE.
- Comando npm: `"backfill:status": "tsx src/scripts/backfill-item-status.ts"`.
- Documentar execução pós-deploy em quickstart §3.

### 1.3 Shared types e status-config

**Arquivos**: `packages/shared/src/types/index.ts`, `packages/shared/src/status-config.ts`

- DTOs: `ClientDashboardSummaryDto`, `ExportVersionDto`, `ClientExportVersionsDto`, helpers `ProductHighlightDto`, `RiskProductDto`, `StatusCountDto`.
- Mover `STATUS_CONFIG` / `STATUS_DISPLAY_ORDER` do web; web reexporta.

### 1.4 API — resumo executivo

| Layer | Arquivo | Responsabilidade |
|-------|---------|------------------|
| Route | `client-dashboard-summary.ts` | Zod query `item_status[]` → service |
| Service | `client-dashboard-summary-service.ts` | Resolve job ativo, chama repository |
| Repository | `stock-product-repository.ts` | `aggregateExecutiveSummary()` — Drizzle SUM/GROUP/LIMIT |

Registrar rota em `server.ts`.

### 1.5 API — exportação

Estender `client-export-service.ts`:

| Método | Endpoint |
|--------|----------|
| `listVersions(ctx)` | `GET /api/client/export/versions` |
| `getFileByJobId(ctx, jobId)` | `GET /api/client/export/files/:jobId` |
| `getActiveFileExport` | existente |

Validação: job pertence a `ctx.companyId`, `status === completed`, `r2ObjectKey` presente.

**PDF**: `client-export-pdf-service.ts`

- Carrega overview, summary, produtos (agrupados por status), chart data ordenado por IDD ASC.
- Monta PDF pdfkit: capa INDEX, intro, resumo (cards textuais), seções por status, gráfico barras, glossário de status/ações.
- Cores/labels de `@prudens/shared/status-config`; números de `@prudens/shared/formatters`.
- Rota `POST /api/client/export/pdf` — sem body; relatório integral da importação ativa (spec FR-016).

### 1.6 Frontend — navegação e rotas

**`navigation.ts`**: adicionar itens cliente:

| id | label | href | icon |
|----|-------|------|------|
| `products` | Produtos | `/produtos` | `Package` ou `List` |
| `export` | Exportação | `/exportacao` | `Download` |

**Rotas App Router**:

- `(client)/dashboard/page.tsx` — SSR overview + products iniciais para chart; client fetch summary.
- `(client)/produtos/page.tsx` — SSR products page 1; FilterBar + table.
- `(client)/exportacao/page.tsx` — SSR versions list; download + PDF buttons.

**`page-meta.ts`**: títulos/subtítulos pt-BR para `/produtos` e `/exportacao`.

### 1.7 Frontend — store e views

Refatorar `dashboardStore.ts`:

```typescript
// Dashboard tab
dashboardItemStatuses: ItemStatus[];
dashboardSummary: ClientDashboardSummaryDto | null;
dashboardChartData: ChartDataPointDto[];

// Products tab (independente)
term, itemStatuses, ranges, sort, order, page, products, ...
```

- `DashboardView`: IndexHeader, `ExecutiveSummary`, `DashboardStatusFilter`, `IddBarChart`.
- `ProductsView`: `FilterBar`, `ProductTable`, paginação (extrair lógica de refetch de DashboardView).
- `ExportView`: lista versões, botões download (presigned via API), botão PDF.

Remover `ExportButton` e `FilterBar` do Dashboard; mover export para ExportView.

### 1.8 UI — ExecutiveSummary

Componente cards flat (borda 0,5px, sem sombra):

- 3 KPIs financeiros totais
- Grid contagem por status (badges/cores de status-config)
- Top 3 risco (nome + score formatado)
- Grid extremos (menor/maior dias, IDD, fat. projetado; maiores capital/perda)

Fetch: `GET /api/client/dashboard/summary?item_status=...` ao mudar filtro dashboard.

---

## Phase 2: Task Breakdown (delegado a `/speckit.tasks`)

Ordem sugerida de implementação:

1. **P1** — domain-metrics + testes + worker input
2. **P1** — backfill script
3. **P1** — shared types + status-config move
4. **P1** — API summary (repository → service → route)
5. **P1** — Frontend navegação + rotas + store split + Dashboard/Products views
6. **P2** — API export versions + download by jobId
7. **P2** — API PDF service + ExportView
8. **P2** — Smoke quickstart completo

---

## API Endpoints Summary

| Method | Path | Service |
|--------|------|---------|
| GET | `/api/client/dashboard/summary` | `client-dashboard-summary-service` |
| GET | `/api/client/export/versions` | `client-export-service` |
| GET | `/api/client/export/files/:jobId` | `client-export-service` |
| GET | `/api/client/export/active-file` | existente |
| POST | `/api/client/export/pdf` | `client-export-pdf-service` |

Endpoints existentes inalterados: `/api/client/overview`, `/api/client/products`, `/api/client/products/ranges`.

## Risks & Mitigations

| Risco | Mitigação |
|-------|-----------|
| PDF lento com muitos SKUs | Limitar altura gráfico (amostra ou escala); paginar seções por status |
| Backfill em produção | Script idempotente; rodar off-peak; log contagem atualizada |
| Divergência cores PDF/web | SSOT `@prudens/shared/status-config` |
| Filtros cruzados entre abas | Slices independentes no Zustand + testes manuais quickstart §4 |

## Dependencies

- Spec 007 (design system) — tokens, sidebar, mobile nav
- Spec 009 (status matrix) — badges, chart colors, cascata base
- Spec 008 (export active file) — padrão presigned R2
