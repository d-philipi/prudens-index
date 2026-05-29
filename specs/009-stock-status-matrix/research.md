# Research: Matriz bidimensional de status de estoque

**Feature**: `009-stock-status-matrix` | **Date**: 2026-05-29

## R1 — Onde vive o cálculo de status (constituição V)

**Decision**: Implementação canônica em `packages/domain-metrics/src/calculate-item-status.ts`; `apps/api/src/services/idd.service.ts` reexporta `calculateItemStatus` como fachada (mesmo padrão de `computeItemStatusFromIdd` hoje).

**Rationale**: Princípio V exige uma única fonte de verdade. O worker não pode importar `apps/api`; `domain-metrics` já é dependência do worker e da API.

**Alternatives considered**:
- Lógica só em `idd.service.ts` — rejeitado (worker duplicaria ou violaria camadas).
- Lógica só no worker — rejeitado (API não teria função testável compartilhada).

## R2 — Formatação pt-BR em `action_insight`

**Decision**: Extrair `formatPercent` e `formatCurrency` para `packages/shared/src/formatters.ts`; `apps/web/src/lib/formatters.ts` reexporta de `@prudens/shared/formatters`; `domain-metrics` importa de `@prudens/shared/formatters` ao montar templates.

**Rationale**: `action_insight` é gerado no worker; formatadores não podem ficar só em `apps/web`. Reexport no web preserva imports existentes.

**Alternatives considered**:
- Duplicar Intl no worker — rejeitado (viola DRY).
- Strings cruas sem formatação — rejeitado (spec FR-007).

## R3 — Tipo PostgreSQL para `item_status`

**Decision**: Migration `0005` cria `item_status_v2` ENUM, migra coluna com cast/fallback, remove CHECK legado e tipo antigo se existir. Migration `0006` adiciona `action_insight text NULL` em seguida.

**Rationale**: Pedido explícito do plano; PostgreSQL não altera valores de ENUM in-place. Estado atual usa `text` + CHECK — a migration substitui o CHECK pelo ENUM novo.

**Alternatives considered**:
- Apenas atualizar CHECK em `text` — mais simples, mas não atende requisito de ENUM nomeado `item_status_v2`.
- Drizzle `pgEnum` nativo — adotado no schema após SQL de migração.

## R4 — Fallback em produção durante deploy

**Decision**: Registros existentes recebem `item_status = 'healthy'` e `action_insight = NULL` na migration `0005`/`0006`. UI trata `action_insight` ausente sem tooltip até reimportação. Deploy ordem: migrate → API → worker → web.

**Rationale**: Evita quebra de leitura; badges exibem “Saudável” temporariamente até novo processamento recalcular insights corretos.

**Alternatives considered**:
- Bloquear dashboard até reimport — rejeitado (downtime operacional).
- Mapear `distribution`→`unbalanced`, etc. — rejeitado (spec pede fallback `healthy` + reprocessamento).

## R5 — Momento do cálculo no worker

**Decision**: Remover `computeItemStatusFromIdd` do parser; em `process-import.ts`, após `calculateFinancialMetrics`, chamar `calculateItemStatus` com `stock_days`, `idd`, `Math.floor(average_demand)`, `tied_up_capital`; persistir `item_status` e `action_insight` no mesmo `INSERT`.

**Rationale**: `tied_up_capital` e demanda truncada só existem após métricas financeiras; cascata depende de `stock_days` da planilha.

**Alternatives considered**:
- Calcular no parser antes das métricas — incorreto para `stuck_stock` (capital parado).

## R6 — UI: fonte única de cores/labels

**Decision**: `apps/web/src/lib/status-config.ts` exporta `STATUS_CONFIG` e ordem `STATUS_DISPLAY_ORDER`; `status-colors.ts`, `StatusBadge`, `FilterBar` (seção de status / futuro `StatusFilterGroup`) e `IddBarChart` importam daí.

**Rationale**: Spec exige uma única fonte de verdade visual; evita divergência com `idd-display.ts` legado.

**Alternatives considered**:
- Manter `strings.itemStatus` separado — rejeitado (duplica label com STATUS_CONFIG); migrar labels para STATUS_CONFIG e deprecar chaves antigas em `strings`.

## R7 — Store de filtros

**Decision**: Atualizar `apps/web/src/store/dashboardStore.ts` (não existe `filters.store.ts` no repositório); union `ItemStatus` em `@prudens/shared/types`.

**Rationale**: Alinhamento com código real; usuário referenciou nome genérico do store Zustand de filtros.

## R8 — Casos de borda numéricos

**Decision**: **Parser**: IDD e `stock_days` inválidos na planilha → linha rejeitada (pt-BR). **`calculateItemStatus`**: `stock_days` null/negativo/NaN → `0` → `critical_rupture`; `idd` null/NaN na faixa 15–44 → `unbalanced`.

**Rationale**: Validação de entrada na importação permanece rigorosa; o cálculo defensivo cobre valores anômalos pós-parse sem contradizer o parser.

**Alternatives considered**:
- Falhar job inteiro em qualquer null — rejeitado; mantém urgência de ruptura para `stock_days` defensivo.

## R9 — Badge: label + actionLabel + tooltip

**Decision**: `StatusBadge` exibe `label` e `actionLabel` de `STATUS_CONFIG` sempre visíveis; `action_insight` completo só no tooltip (hover).

**Rationale**: FR-008 e US2 exigem ação resumida no badge; insight longo permanece no tooltip (FR-010).
