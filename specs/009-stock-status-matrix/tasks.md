# Tasks: Matriz bidimensional de status de estoque

**Input**: Design documents from `/specs/009-stock-status-matrix/`  
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/api.openapi.yaml`, `quickstart.md`

**Tests**: Vitest obrigatório para `calculateItemStatus` em `packages/domain-metrics` (plan Fase 1). Demais validação via `quickstart.md`.

**Organization**: Fases 0–6 do `plan.md` mapeadas para user stories; branch `009-stock-status-matrix`.

## Format: `[ID] [P?] [Story] Description`

## Path Conventions

- Monorepo: `apps/web/`, `apps/api/`, `apps/worker/`, `packages/shared/`, `packages/domain-metrics/`
- API layer order: `routes/` → `services/` → `repositories/` (never invert)
- Cálculo canônico: `packages/domain-metrics/src/calculate-item-status.ts` (fachada `apps/api/src/services/idd.service.ts`)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Tipos compartilhados, formatadores pt-BR reutilizáveis no worker e na web.

- [x] T001 Confirmar diretório ativo `specs/009-stock-status-matrix` em `.specify/feature.json`
- [x] T002 [P] Substituir union `ItemStatus` pelos 7 valores novos e atualizar `ChartDataPointDto.item_status` em `packages/shared/src/types/index.ts`
- [x] T003 [P] Adicionar `actionInsight: string | null` em `StockProductDto` em `packages/shared/src/types/index.ts`
- [x] T004 [P] Criar `packages/shared/src/formatters.ts` com `formatPercent` e `formatCurrency` (Intl pt-BR / BRL, copiar lógica de `apps/web/src/lib/formatters.ts`)
- [x] T005 [P] Exportar `./formatters` em `packages/shared/package.json`
- [x] T006 [P] Alterar `apps/web/src/lib/formatters.ts` para reexportar de `@prudens/shared/formatters`

**Checkpoint**: `pnpm --filter @prudens/shared typecheck` passa com novos tipos.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Migrations `0005`→`0006`, schema Drizzle, `calculateItemStatus` + testes, leitura API de `action_insight`. **Bloqueia todas as user stories.**

**⚠️ CRITICAL**: Nenhuma US end-to-end até migrations aplicadas e Vitest verde.

- [x] T007 Criar `apps/api/drizzle/migrations/0005_stock_item_status_v2.sql` — ENUM `item_status_v2`, coluna temporária, fallback `healthy`, drop CHECK legado, swap coluna, drop tipo antigo, recriar índice `stock_products_company_status` (ordem exata em `plan.md` Fase 0)
- [x] T008 Criar `apps/api/drizzle/migrations/0006_add_action_insight.sql` — `ALTER TABLE stock_products ADD COLUMN action_insight text` (nullable)
- [x] T009 Atualizar `apps/api/drizzle/schema/stock-products.ts` com `pgEnum('item_status_v2', [...])` em `itemStatus` e `actionInsight: text('action_insight')`
- [x] T010 Aplicar migrations via `pnpm --filter @prudens/api db:migrate` e verificar ENUM + coluna conforme `quickstart.md` §1
- [x] T011 Implementar `calculateItemStatus` e `buildActionInsight` em `packages/domain-metrics/src/calculate-item-status.ts` — cascata na ordem fixa do spec; normalizar `stock_days` null/negativo → 0; `idd` null/NaN na faixa 15–44 → `unbalanced`; templates pt-BR com `@prudens/shared/formatters` e formatação FR-007 (`stock_days` 1 decimal pt-BR, `average_demand` inteiro, `idd` 0 dec., `tied_up_capital` sem `R$` duplicado)
- [x] T012 [P] Implementar Vitest em `packages/domain-metrics/src/calculate-item-status.test.ts` — casos obrigatórios: (0,*→critical_rupture), (7,*→low_stock), (100,*→stuck_stock), (60,*→slight_excess), (30,-5→unbalanced), (30,10→healthy), (30,25→concentrated); incluir limites 14/15, 90/91
- [x] T013 Atualizar `packages/domain-metrics/src/index.ts` exportando `calculateItemStatus`; remover `idd-item-status.ts` e `idd-item-status.test.ts`
- [x] T014 Atualizar `apps/api/src/services/idd.service.ts` para reexportar `calculateItemStatus` de `@prudens/domain-metrics`
- [x] T015 [P] Incluir `action_insight` no select e filtros `item_status` em `apps/api/src/repositories/stock-product-repository.ts`
- [x] T016 [P] Mapear `actionInsight` e novos status em `apps/api/src/lib/mappers.ts`
- [x] T017 Atualizar `apps/api/src/services/client-products-service.ts` para expor `action_insight` no DTO de resposta

**Checkpoint**: `pnpm --filter @prudens/domain-metrics test` verde; DB com ENUM novo; API retorna `actionInsight` (pode ser `null` em dados pré-reimport).

---

## Phase 3: User Story 1 — Classificação automática na importação (Priority: P1) 🎯 MVP

**Goal**: Worker persiste `item_status` e `action_insight` no mesmo INSERT, sem recálculo no cliente.

**Independent Test**: Importar planilha com linhas nas faixas da cascata; SQL confirma status e texto de insight ( `quickstart.md` §4).

### Implementation for User Story 1

- [x] T018 [US1] Remover `computeItemStatusFromIdd` e campo `itemStatus` do fluxo de parse em `apps/worker/src/services/spreadsheet-parser-service.ts`
- [x] T019 [US1] Em `apps/worker/src/jobs/process-import.ts`, após `calculateFinancialMetrics`, chamar `calculateItemStatus` com `{ stock_days, idd, average_demand: Math.floor(avg), tied_up_capital }` e incluir `item_status` + `action_insight` no `INSERT` único (sem UPDATE separado)
- [x] T020 [US1] Garantir import de `calculateItemStatus` de `@prudens/domain-metrics` no worker (não de `apps/api`)

**Checkpoint**: Nenhuma linha nova com `distribution`/`adequate`/`boost`; insights interpolados em pt-BR após import.

---

## Phase 4: User Story 2 — Badge e tooltip na tabela (Priority: P1)

**Goal**: Badge com label/cor/ação de `STATUS_CONFIG`; tooltip Shadcn no hover do badge com `action_insight`; pulso em ruptura crítica.

**Independent Test**: Dashboard cliente — hover no badge mostra insight; ordenar coluna status não quebra tooltip (`quickstart.md` §5).

### Implementation for User Story 2

- [x] T021 [P] [US2] Criar `apps/web/src/lib/status-config.ts` com `STATUS_CONFIG`, `STATUS_DISPLAY_ORDER` e hex/labels/ações do spec FR-008
- [x] T022 [P] [US2] Atualizar `apps/web/src/lib/status-colors.ts` para delegar cores a `STATUS_CONFIG`
- [x] T023 [US2] Refatorar `apps/web/src/components/shared/StatusBadge.tsx` — usar `STATUS_CONFIG`; exibir `label` + `actionLabel` visíveis no badge (tipografia secundária para ação, spec FR-008); `animate-pulse` quando `pulseAnimation`; prop opcional `actionInsight` com `Tooltip` Shadcn (`delayDuration={400}`, `max-w-[320px] text-[13px]`), trigger = badge inteiro, sem ícone ℹ️
- [x] T024 [US2] Passar `actionInsight={p.actionInsight}` em `apps/web/src/components/client/ProductTable.tsx` sem transformar o texto
- [x] T025 [P] [US2] Remover uso de `statusColor`/`STATUS_COLORS` legados para item status em `apps/web/src/lib/idd-display.ts` (manter apenas o que ainda for necessário fora de estoque)

**Checkpoint**: Badges exibem 7 status com `label` + `actionLabel` visíveis; tooltip só com `actionInsight` presente; cabeçalho ordenável intacto.

---

## Phase 5: User Story 3 — Filtros e gráfico alinhados (Priority: P2)

**Goal**: Filtro lateral com 7 status (ordem de severidade), API filtra por combinação, gráfico e tabela sincronizados, PDF respeita filtros.

**Independent Test**: Selecionar status no filtro → tabela e gráfico idênticos; export PDF com subconjunto filtrado (`quickstart.md` §5–6).

### Implementation for User Story 3

- [x] T026 [US3] Atualizar `apps/api/src/schemas/client-product-filters.ts` — `z.enum` com 7 valores; rejeitar legados com 400
- [x] T027 [US3] Garantir filtro `inArray(item_status, …)` em `apps/api/src/repositories/stock-product-repository.ts` para os 7 literais — adicionar teste manual em `quickstart.md` §6 (multi-status) ou query SQL de amostra; rejeitar valores legados no Zod (T026)
- [x] T028 [P] [US3] Criar `apps/web/src/components/client/StatusFilterGroup.tsx` — chips na ordem `STATUS_DISPLAY_ORDER`, cores/labels de `STATUS_CONFIG`
- [x] T029 [US3] Refatorar `apps/web/src/components/client/FilterBar.tsx` — substituir `ALL_STATUSES` legado por `StatusFilterGroup`
- [x] T030 [US3] Verificar `apps/web/src/store/dashboardStore.ts` envia `item_status` repetido na query com union `ItemStatus` atualizada (sem alteração de lógica além dos tipos)
- [x] T031 [US3] Atualizar `apps/web/src/components/client/IddBarChart.tsx` — `getStatusColor(entry.item_status)`; tooltip `labelFormatter` com nome do produto + label de status via `STATUS_CONFIG`
- [x] T032 [US3] Confirmar exportação PDF em `apps/web/src/components/client/DashboardView.tsx` / `ExportButton` usa o mesmo subconjunto filtrado da store (ajustar se necessário)

**Checkpoint**: Filtros numéricos e busca continuam funcionando em conjunto; gráfico colorido por novo status.

---

## Phase 6: User Story 4 — Transição sem vestígios legados (Priority: P2)

**Goal**: Zero referências a `distribution`, `adequate`, `boost` no código e contratos runtime.

**Independent Test**: `rg` no monorepo sem hits em tipos/UI; smoke confirma valores DB (`quickstart.md` §3–4).

### Implementation for User Story 4

- [x] T033 [US4] Remover chaves `distribution`/`adequate`/`boost` de `strings.itemStatus` em `apps/web/src/lib/strings.ts`; consumidores usam `STATUS_CONFIG`
- [x] T034 [P] [US4] Varredura e limpeza de referências legadas em `apps/web`, `apps/api`, `apps/worker`, `packages/shared`, `packages/domain-metrics`, `scripts/` (incl. classes Tailwind `status-distribution` apenas se usadas para estoque)
- [x] T035 [US4] Atualizar ou criar script smoke `scripts/smoke-009-quickstart.ts` validando ENUM, ausência de status legados e amostra de `action_insight`
- [x] T036 [P] [US4] Alinhar `specs/009-stock-status-matrix/contracts/api.openapi.yaml` com implementação se divergir durante o desenvolvimento

**Checkpoint**: `pnpm --filter @prudens/domain-metrics test` + grep limpo; reimport recomendado para recalcular insights em produção.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Validação final e qualidade do monorepo.

- [x] T037 Executar `pnpm --filter @prudens/domain-metrics test` e corrigir falhas
- [x] T038 [P] Executar `pnpm --filter @prudens/shared --filter @prudens/api --filter @prudens/web --filter @prudens/worker typecheck`
- [x] T039 Validar manualmente checklist em `specs/009-stock-status-matrix/quickstart.md` (migrate → import → UI com `actionLabel` no badge → API filter 400 em legado → SC-005 tempo de filtro &lt;2s com importação grande)
- [x] T040 [P] Atualizar `.cursor/rules/specify-rules.mdc` / agent context se stack ou paths mudaram (opcional — script `update-agent-context` pós-merge)

---

## Dependencies & Execution Order

### Phase Dependencies

| Fase | Depende de | Bloqueia |
|------|------------|----------|
| 1 Setup | — | Fase 2 |
| 2 Foundational | Fase 1 | US1, US2, US3, US4 |
| 3 US1 (import) | Fase 2 | Dados corretos para US2/US3 |
| 4 US2 (badge) | Fase 2 (+ US1 para insights reais) | — |
| 5 US3 (filtros) | Fase 2, US1 recomendado | — |
| 6 US4 (limpeza) | US1–US3 | — |
| 7 Polish | US desejadas | — |

### User Story Dependencies

| Story | Pode testar sozinha após | Depende de |
|-------|--------------------------|------------|
| **US1** | Fase 2 + import | Migrations, `calculateItemStatus` |
| **US2** | Fase 2 + US1 (insights) | API `actionInsight`, `STATUS_CONFIG` |
| **US3** | Fase 2 + US1 | Zod filtros, `StatusFilterGroup` |
| **US4** | US1–US3 | Limpeza global |

### Within Each User Story

1. Backend/dados antes de UI (exceto `STATUS_CONFIG` paralelo à API)
2. `calculateItemStatus` + Vitest antes do worker
3. Migrations antes de INSERT com novos campos

### Parallel Opportunities

**Fase 1**: T002–T006 em paralelo após T001.

**Fase 2**: T012 ∥ T015 ∥ T016 após T011; T007–T008 sequenciais entre si mas ∥ T004–T006 se Setup pronto.

**US2**: T021 ∥ T022; T025 ∥ T024 após T023.

**US3**: T028 ∥ T026 após Foundational.

**US4**: T034 ∥ T036 após US1–US3.

---

## Parallel Example: User Story 1

```bash
# Após T011–T014 (calculateItemStatus pronto):
# T018 parser (remover status antigo)
# T019 process-import (integrar INSERT) — sequencial T018 → T019
```

---

## Parallel Example: User Story 2

```bash
# Em paralelo:
# T021 status-config.ts
# T022 status-colors.ts
# T025 idd-display cleanup

# Depois:
# T023 StatusBadge.tsx (depende T021)
# T024 ProductTable.tsx
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Fase 1 Setup  
2. Fase 2 Foundational (migrations + `calculateItemStatus` + Vitest)  
3. Fase 3 US1 (worker)  
4. **STOP**: SQL + `quickstart.md` §4 validam cascata e `action_insight`

### Entrega incremental

1. Setup + Foundational → base de dados e regra única  
2. US1 → dados corretos na importação (**MVP operacional**)  
3. US2 → operador vê badge + tooltip  
4. US3 → filtros e gráfico sincronizados  
5. US4 → remoção legado + smoke  
6. Polish → typecheck + quickstart manual  

### Deploy seguro (produção)

1. Migrations `0005` → `0006`  
2. API + worker (escrevem novos campos)  
3. Web  
4. Reimportar planilhas ativas para recalcular `action_insight` (registros antigos: `healthy` + `NULL`)

---

## Notes

- Domínio usa **7** valores de `item_status` (`critical_rupture` … `concentrated`); spec/plano alinhados pós-análise 2026-05-29.
- `filters.store.ts` não existe; store de filtros é `apps/web/src/store/dashboardStore.ts`.
- Não recalcular status no frontend (constituição III + spec FR-001).
- Commit após cada checkpoint; não commitar `.env`.
