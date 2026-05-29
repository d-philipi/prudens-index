# Tasks: Abas do Dashboard Cliente e Ajustes de Status

**Input**: Design documents from `/specs/010-client-dashboard-tabs/`  
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/api.openapi.yaml`, `quickstart.md`

**Tests**: Vitest obrigatório para `calculateItemStatus` em `packages/domain-metrics` (plan + spec US1). Demais validação via `quickstart.md`.

**Organization**: Fases mapeadas para user stories; branch `010-client-dashboard-tabs`.

## Format: `[ID] [P?] [Story] Description`

## Path Conventions

- Monorepo: `apps/web/`, `apps/api/`, `apps/worker/`, `packages/shared/`, `packages/domain-metrics/`
- API layer order: `routes/` → `services/` → `repositories/` (never invert)
- Cálculo canônico: `packages/domain-metrics/src/calculate-item-status.ts`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: DTOs compartilhados e `status-config` como SSOT para web + PDF.

- [X] T001 Confirmar diretório ativo `specs/010-client-dashboard-tabs` em `.specify/feature.json`
- [X] T002 [P] Adicionar `ProductHighlightDto`, `RiskProductDto`, `StatusCountDto`, `ClientDashboardSummaryDto`, `ExportVersionDto`, `ClientExportVersionsDto` em `packages/shared/src/types/index.ts`
- [X] T003 [P] Criar `packages/shared/src/status-config.ts` — mover `STATUS_CONFIG` e `STATUS_DISPLAY_ORDER` de `apps/web/src/lib/status-config.ts`
- [X] T004 [P] Exportar `./status-config` em `packages/shared/package.json`
- [X] T005 [P] Alterar `apps/web/src/lib/status-config.ts` para reexportar de `@prudens/shared/status-config`
- [X] T006 [P] Atualizar imports em `apps/web/src/lib/status-colors.ts`, `apps/web/src/components/shared/StatusBadge.tsx`, `apps/web/src/components/client/StatusFilterGroup.tsx`, `apps/web/src/components/client/IddBarChart.tsx` para usar `@prudens/shared/status-config` se necessário

**Checkpoint**: `pnpm --filter @prudens/shared typecheck` passa; web compila com reexport.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Cascata de status atualizada (SSOT), worker alimentado corretamente, backfill. **Bloqueia US2–US4** (dados de status/insight corretos).

**⚠️ CRITICAL**: Nenhuma aba cliente end-to-end até Vitest verde e worker atualizado.

- [X] T007 Estender `CalculateItemStatusInput` (`stock_days: number | null`, `stock: number`) e implementar passo 0, piso 30 dias para `healthy`, faixa 15–30 → `low_stock`, variantes de insight em `packages/domain-metrics/src/calculate-item-status.ts`
- [X] T008 Atualizar Vitest em `packages/domain-metrics/src/calculate-item-status.test.ts` — casos quickstart §2: passo 0 (stock>0, avg=0, days null/Infinity), days 30/31 com IDD 0–20, days 30 low_stock vs 31 healthy, insights sem "duas semanas" para 25 dias, stuck_stock demanda zero (executar após T007)
- [X] T009 Atualizar `apps/worker/src/jobs/process-import.ts` — passar `stock` e `stock_days` bruto (`null` permitido) para `calculateItemStatus`; não coercer null→0 antes da chamada
- [X] T010 Criar `apps/api/src/scripts/backfill-item-status.ts` — SELECT `stock`, `stock_days` (nullable), `idd`, `average_demand`, `tied_up_capital` por produto de jobs ativos; chamar `calculateItemStatus` e UPDATE `item_status`/`action_insight`; adicionar `"backfill:status": "tsx src/scripts/backfill-item-status.ts"` em `apps/api/package.json`

**Checkpoint**: `pnpm --filter @prudens/domain-metrics test` verde; nova importação classifica passo 0 e piso 30d; backfill executável.

---

## Phase 3: User Story 1 — Classificação corrigida no processamento (Priority: P1) 🎯 MVP

**Goal**: Status e insights persistidos no processamento com regras 010; dados existentes recalculáveis.

**Independent Test**: Importar planilha com demanda zero + estoque positivo + dias vazios → `stuck_stock`; produto 25 dias IDD 10% → `low_stock`; SQL confirma (`quickstart.md` §2, §8).

### Implementation for User Story 1

- [X] T011 [US1] Executar backfill em ambiente local (`pnpm --filter @prudens/api backfill:status`) e validar amostra SQL conforme `quickstart.md` §3
- [ ] T012 [US1] Smoke import — linha demanda zero com estoque>0 e dias indefinidos persiste `stuck_stock` + insight de impulsionar vendas (`quickstart.md` §8)

**Checkpoint**: 100% dos casos de borda da cascata 010 passam no Vitest e em import real.

---

## Phase 4: User Story 2 — Navegação, Dashboard e resumo executivo (Priority: P1)

**Goal**: Três destinos na nav; aba Dashboard com gráfico IDD, resumo executivo e filtro simples por status.

**Independent Test**: Login cliente → nav com Dashboard/Produtos/Exportação; `/dashboard` exibe resumo + gráfico; filtro de status altera gráfico e resumo, sem FilterBar completo (`quickstart.md` §4–5).

### Implementation for User Story 2

- [X] T013 [P] [US2] Implementar `aggregateExecutiveSummary(companyId, importJobId, itemStatuses?)` em `apps/api/src/repositories/stock-product-repository.ts` — totais financeiros, GROUP BY status, Top 3 `(lost_revenue + tied_up_capital) DESC, product_name ASC LIMIT 3`, extremos min/max; mapear `ProductHighlightDto.value` conforme `data-model.md` (dias / IDD / centavos por campo)
- [X] T014 [US2] Criar `apps/api/src/services/client-dashboard-summary-service.ts` — resolve job ativo via `importJobRepository`, delega agregação, retorna `ClientDashboardSummaryDto`
- [X] T015 [P] [US2] Criar `apps/api/src/schemas/client-dashboard-summary-schemas.ts` — Zod query `item_status` array opcional
- [X] T016 [US2] Criar `apps/api/src/routes/client-dashboard-summary.ts` — `GET /api/client/dashboard/summary`; registrar em `apps/api/src/server.ts`
- [X] T017 [P] [US2] Adicionar itens cliente Produtos (`/produtos`, ícone Package) e Exportação (`/exportacao`, ícone Download) em `apps/web/src/lib/navigation.ts`; estender `NavItemId` e `isNavActive`
- [X] T018 [P] [US2] Adicionar metas pt-BR para `/produtos` e `/exportacao` em `apps/web/src/lib/page-meta.ts`
- [X] T019 [US2] Refatorar `apps/web/src/store/dashboardStore.ts` — slices `dashboardItemStatuses`/`dashboardSummary`/`dashboardChartData` separados de filtros da aba Produtos (`term`, `itemStatuses`, ranges, paginação)
- [X] T020 [P] [US2] Criar `apps/web/src/components/client/DashboardStatusFilter.tsx` — chips na ordem `STATUS_DISPLAY_ORDER`, cores de `@prudens/shared/status-config`
- [X] T021 [US2] Criar `apps/web/src/components/client/ExecutiveSummary.tsx` — cards flat (borda 0,5px): totais financeiros, contagem por status, Top 3 risco, extremos; formatadores pt-BR
- [X] T022 [US2] Refatorar `apps/web/src/components/client/DashboardView.tsx` — IndexHeader + ExecutiveSummary + DashboardStatusFilter + IddBarChart; remover FilterBar, ProductTable, ExportButton; fetch `GET /api/client/dashboard/summary` e chart refetch ao mudar `dashboardItemStatuses`; manter estado vazio pt-BR (`strings.client.noStockData`) quando não houver importação ativa
- [X] T023 [US2] Atualizar `apps/web/src/app/(client)/dashboard/page.tsx` — SSR overview + produtos iniciais para chart; props alinhadas ao store refatorado

**Checkpoint**: Resumo exibe todos indicadores FR-011; filtro dashboard não expõe busca/faixas numéricas.

---

## Phase 5: User Story 3 — Análise detalhada na aba Produtos (Priority: P1)

**Goal**: Tabela completa com filtros avançados, ordenação e paginação em `/produtos`, independente do Dashboard.

**Independent Test**: `/produtos` com FilterBar completo; filtros alteram só a tabela; Dashboard inalterado (`quickstart.md` §4).

### Implementation for User Story 3

- [X] T024 [US3] Criar `apps/web/src/components/client/ProductsView.tsx` — extrair FilterBar + ProductTable + lógica de refetch/paginação/ordenação do antigo `DashboardView.tsx`; usar slice de filtros Produtos do store; estado vazio pt-BR coerente quando não houver importação ativa
- [X] T025 [US3] Criar `apps/web/src/app/(client)/produtos/page.tsx` — SSR `GET /api/client/products?limit=50&sort=idd&order=desc`; renderizar `ProductsView`; tratar ausência de dados como em dashboard
- [X] T026 [US3] Garantir `buildProductsQuery` em `apps/web/src/store/dashboardStore.ts` usa apenas estado da aba Produtos (não `dashboardItemStatuses`)

**Checkpoint**: Filtros status + busca + sliders aplicam só à tabela; paginação e sort funcionam.

---

## Phase 6: User Story 4 — Exportação de planilhas e relatório PDF (Priority: P2)

**Goal**: Aba Exportação com versões ativa/histórico + PDF server-side com identidade INDEX.

**Independent Test**: Listar versões, baixar ativa e histórica, gerar PDF com seções obrigatórias (`quickstart.md` §6–7).

### Implementation for User Story 4

- [X] T027 [P] [US4] Adicionar `listCompletedByCompany(companyId)` em `apps/api/src/repositories/import-job-repository.ts` — jobs `completed` ordenados por `completedAt DESC`
- [X] T028 [US4] Estender `apps/api/src/services/client-export-service.ts` — `listVersions(ctx)` retorna `{ active, history }` com `history` = jobs `completed` e `is_active = false` (job ativo não duplicado no histórico); `getFileByJobId(ctx, jobId)` valida posse, status completed e `r2ObjectKey`
- [X] T029 [P] [US4] Criar `apps/api/src/schemas/client-export-schemas.ts` — Zod param `jobId` UUID para download; remover ou deprecar `clientExportBodySchema` legado em `apps/api/src/schemas/client-product-filters.ts` (substituído por PDF integral sem body)
- [X] T030 [US4] Adicionar `GET /api/client/export/versions` e `GET /api/client/export/files/:jobId` em `apps/api/src/routes/client-export.ts`
- [X] T031 [US4] Criar `apps/api/src/services/client-export-pdf-service.ts` — pdfkit: capa INDEX, intro, resumo integral (`ClientDashboardSummaryDto` sem filtro), produtos agrupados por status, gráfico barras IDD crescente, glossário pt-BR; cores/labels de `@prudens/shared/status-config`
- [X] T032 [US4] Adicionar `POST /api/client/export/pdf` em `apps/api/src/routes/client-export.ts` — stream `application/pdf`, sem request body
- [X] T033 [P] [US4] Adicionar `downloadExportFile(token, jobId?)` e `downloadDashboardPdf(token)` em `apps/web/src/lib/apiClient.ts`
- [X] T034 [US4] Criar `apps/web/src/components/client/ExportView.tsx` — lista versões, botões download (ativa/histórico), botão gerar PDF integral; estados vazios pt-BR; remover ou reutilizar `apps/web/src/features/dashboard/components/ExportButton.tsx` se ficar órfão
- [X] T035 [US4] Criar `apps/web/src/app/(client)/exportacao/page.tsx` — SSR fetch `GET /api/client/export/versions`; renderizar `ExportView`

**Checkpoint**: Cliente baixa planilhas só da própria empresa; PDF integral contém resumo + status + gráfico IDD.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Strings, mobile nav, validação final.

- [X] T036 [P] Adicionar strings pt-BR para resumo executivo, aba Exportação e PDF em `apps/web/src/lib/strings.ts`
- [X] T037 [P] Verificar `apps/web/src/components/layout/MobileBottomNav.tsx` e `apps/web/src/components/layout/Sidebar.tsx` exibem 3 destinos cliente com item ativo correto
- [X] T038 Validar isolamento multi-empresa nos novos endpoints (403/404) conforme `quickstart.md` §7
- [ ] T039 Executar roteiro completo `specs/010-client-dashboard-tabs/quickstart.md` §2–8 — incluir estados vazios por aba (sem importação ativa) e PDF integral sem body
- [X] T040 [P] Verificar fachada `calculateItemStatus` em `apps/api/src/services/idd.service.ts` reexporta de `@prudens/domain-metrics` após alteração de input (padrão spec 009)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: Sem dependências — iniciar imediatamente
- **Phase 2 (Foundational)**: Depende de Phase 1 (types + status-config) — **BLOQUEIA US2–US4**
- **Phase 3 (US1)**: Depende de Phase 2 — validação/backfill
- **Phase 4 (US2)**: Depende de Phase 1 (DTOs) + Phase 2 (dados corretos); API summary pode iniciar após T002
- **Phase 5 (US3)**: Depende de T019 (store split); pode paralelizar com US2 após store definido
- **Phase 6 (US4)**: Depende de Phase 1 (DTOs + status-config para PDF); independente de US2/US3 UI
- **Phase 7 (Polish)**: Depende de US2–US4 completos

### User Story Dependencies

| Story | Depende de | Independente para teste |
|-------|------------|-------------------------|
| US1 (P1) | Phase 2 | Vitest + import SQL |
| US2 (P1) | US1 dados corretos (backfill/import) | Nav + dashboard + summary API |
| US3 (P1) | Store split (T019) | `/produtos` isolado do dashboard |
| US4 (P2) | status-config shared | Export API + `/exportacao` |

### Within Each User Story

- Repository antes de Service antes de Route (API)
- Store split antes de DashboardView/ProductsView
- Export service versions antes de PDF service

### Parallel Opportunities

- **Phase 1**: T002–T006 em paralelo (após T001)
- **Phase 2**: T010 paralelo após T007; T008 **sequencial após T007** (testes dependem da cascata)
- **Phase 4**: T013+T015 paralelos; T017+T018 paralelos; T020 paralelo a T021
- **Phase 6**: T027+T029 paralelos; T033 paralelo a T034
- **Cross-team**: Após Phase 2, dev A → US2, dev B → US3, dev C → US4 API

---

## Parallel Example: User Story 2

```bash
# Backend summary stack (sequencial interno: T013 → T014 → T016):
Task T013: aggregateExecutiveSummary in stock-product-repository.ts
Task T015: Zod schemas in client-dashboard-summary-schemas.ts

# Frontend nav (paralelo ao backend):
Task T017: navigation.ts — Produtos + Exportação
Task T018: page-meta.ts — títulos pt-BR
```

---

## Parallel Example: User Story 4

```bash
# API export (paralelo):
Task T027: import-job-repository listCompletedByCompany
Task T029: client-export-schemas Zod

# Após T028 service:
Task T031: client-export-pdf-service.ts
Task T033: apiClient download helpers
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Phase 1: Setup (T001–T006)
2. Phase 2: Foundational cascata (T007–T010)
3. Phase 3: US1 validação (T011–T012)
4. **STOP**: Vitest verde + import smoke — status correto em produção após backfill

### Incremental Delivery

1. Setup + Foundational + US1 → cascata correta (**MVP dados**)
2. US2 → Dashboard executivo + nav 3 abas
3. US3 → Produtos com filtros completos
4. US4 → Exportação planilhas + PDF
5. Polish → quickstart completo

### Suggested MVP Scope

**US1 apenas** (Phases 1–3): entrega valor imediato na classificação; UI permanece monolítica até US2.

**MVP produto** (Phases 1–4): Dashboard reorganizado + resumo — primeira entrega visível ao cliente.

---

## Notes

- Sem migration SQL nova — backfill obrigatório pós-deploy da cascata
- PDF integral da importação ativa — **sem** filtro de status no POST (spec FR-016 alinhado)
- Filtros Dashboard vs Produtos **must remain independent** (research R7)
- `[P]` = arquivos diferentes, sem dependência de tarefa incompleta no mesmo arquivo
- Commit sugerido após cada checkpoint de fase

---

## Task Summary

| Phase | Story | Tasks | Parallel tasks |
|-------|-------|-------|----------------|
| 1 Setup | — | T001–T006 (6) | 5 |
| 2 Foundational | — | T007–T010 (4) | 1 |
| 3 US1 | US1 | T011–T012 (2) | 0 |
| 4 US2 | US2 | T013–T023 (11) | 5 |
| 5 US3 | US3 | T024–T026 (3) | 0 |
| 6 US4 | US4 | T027–T035 (9) | 4 |
| 7 Polish | — | T036–T040 (5) | 3 |
| **Total** | | **40 tasks** | **16 parallel** |

### Independent Test Criteria

| Story | Critério |
|-------|----------|
| US1 | Vitest 100% casos 010; import demanda zero → stuck_stock; backfill SQL |
| US2 | Nav 3 abas; resumo FR-011; filtro status afeta gráfico+resumo only |
| US3 | `/produtos` filtros completos; dashboard não alterado |
| US4 | Versões + download + PDF com identidade INDEX |
