# Research: Abas do dashboard cliente e ajustes de status

**Feature**: `010-client-dashboard-tabs` | **Date**: 2026-05-29

## R1 — Backfill de `item_status` / `action_insight` existentes

**Decision**: Script de backfill em lote (`apps/api/src/scripts/backfill-item-status.ts`, executável via `pnpm --filter @prudens/api backfill:status`) que percorre `stock_products` da importação ativa de cada empresa, relê colunas já persistidas (`stock_days`, `stock`, `idd`, `average_demand`, `tied_up_capital`) e chama `calculateItemStatus` de `@prudens/domain-metrics` para atualizar `item_status` e `action_insight` via Drizzle. Novas importações recebem regras automaticamente no worker.

**Rationale**: A alteração é puramente derivada de campos existentes; re-run completo do job (R2 da planilha + parser + INSERT) é desnecessário, mais lento e arriscado (substitui linhas, depende de R2). Backfill é idempotente, testável e alinhado ao princípio V (uma função canônica).

**Alternatives considered**:
- Re-enfileirar `process-import` para cada job ativo — rejeitado (I/O R2 + parse + delete/insert; downtime operacional).
- Aguardar próxima importação natural — rejeitado (dados incorretos até reimportação).
- Migration SQL com CASE — rejeitado (duplica lógica de negócio; viola SSOT).

## R2 — Entrada de `calculateItemStatus` para passo 0 (dias indefinidos)

**Decision**: Estender `CalculateItemStatusInput` com `stock: number` e `stock_days: number | null` (valor bruto antes de normalização). Passo 0: `stock > 0`, `average_demand === 0`, e `stock_days` null/NaN/±Infinity → `stuck_stock`. Worker deixa de coercer `stockDays` para `0` antes da chamada; passa `p.stockDays != null ? Number(p.stockDays) : null` e `stock` numérico.

**Rationale**: Coerção atual (`null → 0`) dispara `critical_rupture` incorretamente. A detecção precisa ocorrer antes de `normalizeStockDays`.

**Alternatives considered**:
- Flag booleana `indefinite_stock_days` no parser — rejeitado (regra de classificação pertence a `domain-metrics`).
- Tratar só `Infinity` — rejeitado (spec inclui null/NaN).

## R3 — Variantes de `action_insight`

**Decision**: `buildActionInsight` recebe contexto de origem via status + subtipo inferido:
- `low_stock`: dois templates — (a) `days < 15` enfatiza volume insuficiente; (b) `15 ≤ days ≤ 30` com IDD saudável enfatiza perda de oportunidade de venda. Ambos citam dias reais; remover frase fixa "não dura duas semanas" quando `days ≥ 15`.
- `stuck_stock`: template passo 0 (demanda zero, dias indefinidos) distinto do template passo 3 (`days > 90`); passo 0 omite contagem de dias e cita demanda zero + impulsionar vendas.

**Rationale**: Spec FR-005/FR-006 exige coerência sem prazos incorretos; subtipo derivável dos inputs sem coluna extra.

**Alternatives considered**:
- Coluna `status_reason` — rejeitado (sem novas colunas).
- Texto único genérico — rejeitado (perde orientação operacional).

## R4 — Geração de PDF: server-side vs client-side

**Decision**: **Server-side na API** via `pdfkit` (já declarado em `apps/api/package.json`; usado historicamente em spec 001, removido em 008). Novo `client-export-pdf-service.ts` no layer Service; rota `POST /api/client/export/pdf` **sem body** — relatório integral da importação ativa (spec FR-016).

**Rationale**: Constituição proíbe lógica de negócio no frontend; PDF agrega resumo + produtos agrupados + gráfico — dados sensíveis e volume pertencem ao backend. `pdfkit` evita Chromium/Puppeteer no container Coolify. Client-side (`window.print`, `@react-pdf/renderer` no browser) reintroduziria montagem de relatório no cliente.

**Alternatives considered**:
- `@react-pdf/renderer` no API — rejeitado (runtime React desnecessário no Fastify).
- Puppeteer/Playwright headless — rejeitado (memória, dependências OS, antipadrão para API lean).
- Client-side com canvas — rejeitado (viola camadas; difícil garantir identidade INDEX).

## R5 — Biblioteca e gráfico IDD no PDF

**Decision**: `pdfkit` com desenho vetorial simples (retângulos coloridos por status, eixo X implícito por ordem crescente de IDD). Cores/labels importados de `@prudens/shared/status-config` (extraído de `apps/web/src/lib/status-config.ts`). Formatadores de `@prudens/shared/formatters`.

**Rationale**: Recharts é dependência frontend; pdfkit não renderiza React. Barras simples atendem spec ("gráfico de variação de IDD ordenado do menor ao maior") sem nova dependência.

**Alternatives considered**:
- Rasterizar Recharts no servidor — rejeitado (requer headless browser ou duplicar chart logic).
- Tabela em vez de gráfico — rejeitado (spec exige gráfico).

## R6 — Metadados de status compartilhados (SSOT visual)

**Decision**: Mover `STATUS_CONFIG` e `STATUS_DISPLAY_ORDER` para `packages/shared/src/status-config.ts`; `apps/web/src/lib/status-config.ts` reexporta. API PDF importa do shared.

**Rationale**: Princípio V — labels/cores/ações não podem divergir entre web e PDF. Mesmo padrão da spec 009 (formatters em shared).

**Alternatives considered**:
- Duplicar mapa de cores no service PDF — rejeitado (DRY).
- Manter só no web e passar cores via request — rejeitado (cliente não define identidade).

## R7 — Estado de filtros entre abas (Zustand)

**Decision**: Refatorar `dashboardStore.ts` em slices lógicos dentro do mesmo store:
- **`dashboard`**: `dashboardItemStatuses[]`, `dashboardChartData`, `dashboardSummary` (fetch separado).
- **`products`**: `term`, `itemStatuses`, ranges numéricos, `sort`, `order`, `page`, `products`, paginação.

Filtros **independentes por aba**: alterar filtros em Produtos não altera gráfico/resumo do Dashboard; filtro simples de status do Dashboard não altera tabela de Produtos.

**Rationale**: Spec FR-012/FR-014 exige escopos distintos. Um único conjunto de filtros compartilhado violaria US3 (filtros de Produtos não afetam Dashboard).

**Alternatives considered**:
- Dois stores Zustand (`useDashboardTabStore`, `useProductsTabStore`) — viável, mas duplica overview/range bounds; um store com namespaces é suficiente.
- Persistir filtros em `sessionStorage` — fora de escopo; manter memória de sessão como hoje.

## R8 — Endpoint de resumo executivo

**Decision**: Novo `GET /api/client/dashboard/summary?item_status=...` (multi-value opcional) com `client-dashboard-summary-service.ts` → `stockProductRepository.aggregateExecutiveSummary()`. DTO `ClientDashboardSummaryDto` em `@prudens/shared/types`. Não estender `ClientOverviewDto` (responsabilidade única: header IDD médio vs agregações pesadas).

**Rationale**: Overview atual (`client-overview-service`) retorna 4 campos leves; resumo tem ~15 agregações + Top 3 + extremos — separação mantém cacheabilidade e contratos claros.

**Alternatives considered**:
- Incluir resumo em `GET /api/client/products` — rejeitado (payload inflado a cada paginação).
- Calcular resumo no frontend — rejeitado (viola FR-018 e constituição).

## R9 — Listagem de versões exportáveis

**Decision**: `GET /api/client/export/versions` retorna `{ active: ExportVersionDto | null, history: ExportVersionDto[] }` onde `ExportVersionDto = { jobId, filename, completedAt, isActive }`. Download: `GET /api/client/export/files/:jobId` (presigned URL, valida `companyId` + job `completed` + `r2ObjectKey` presente). Estende `client-export-service.ts`.

**Rationale**: Reutiliza `importJobRepository.findByCompany` filtrado por `status = completed`; padrão idêntico ao `active-file` existente.

**Alternatives considered**:
- Um endpoint por versão sem listagem — rejeitado (UX da aba Exportação exige seleção).
- Download direto sem presigned URL — rejeitado (R2 já usa presigned em `r2StorageService`).

## R10 — Casos de borda numéricos (atualização spec 009)

**Decision**:

| Condição | Resultado |
|----------|-----------|
| `stock > 0`, `avg = 0`, `stock_days` null/NaN/±Inf | `stuck_stock` (passo 0) |
| `stock_days` negativo | normalizar → 0 → `critical_rupture` |
| `stock_days = 0` real | `critical_rupture` |
| `15 ≤ days ≤ 30`, `0 ≤ idd ≤ 20` | `low_stock` |
| `days = 30`, `idd 0–20` | `low_stock` |
| `days = 31`, `idd 0–20` | `healthy` |
| `idd` null/NaN na faixa 15–44 (passo 5) | `unbalanced` |

**Rationale**: Alinha testes unitários e spec 010 edge cases.

**Alternatives considered**:
- `days = 30` como `healthy` — rejeitado (spec: Saudável exige `days > 30`).
