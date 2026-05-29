# Implementation Plan: Matriz bidimensional de status de estoque

**Branch**: `009-stock-status-matrix` | **Date**: 2026-05-29 | **Spec**: [spec.md](./spec.md)  
**Input**: Planejar implementação da matriz de status, `action_insight`, worker, migrations, filtros e tooltip. Seguir constituição v1.1.0. Stack: Next.js 15, Fastify, PostgreSQL 16/Drizzle, BullMQ, SheetJS, Zod, Shadcn/UI, Tailwind v4, Recharts, Clerk.

> **Nota**: O prompt citou “spec 007”; a feature ativa neste branch é **`009-stock-status-matrix`** ([spec.md](./spec.md)).

## Summary

Substituir a classificação `item_status` baseada só em IDD (`distribution` | `adequate` | `boost`) por uma **cascata bidimensional** (dias de estoque + IDD na faixa 15–44), persistir **`action_insight`** (texto pt-BR no worker), expor na API/filtros, e atualizar dashboard cliente (badge, tooltip Shadcn, gráfico Recharts) com **`STATUS_CONFIG`** como única fonte visual. Cálculo canônico em `@prudens/domain-metrics`; fachada em `idd.service.ts`; formatadores pt-BR em `@prudens/shared/formatters`.

## Technical Context

**Language/Version**: TypeScript strict — Next.js 15 App Router (Turbopack), Node.js 20 LTS  
**Primary Dependencies**: Fastify, Drizzle, BullMQ, SheetJS (xlsx), Zod, Shadcn/UI, Tailwind v4, Recharts, Clerk, Zustand  
**Storage**: PostgreSQL 16 (Drizzle), Redis 7 (BullMQ), Cloudflare R2  
**Testing**: Vitest em `packages/domain-metrics` (cascata + templates); smoke manual via [quickstart.md](./quickstart.md)  
**Target Platform**: Vercel (`apps/web`), Hetzner/Coolify (`apps/api`, `apps/worker`)  
**Project Type**: web-service (mobile-first + API + worker)  
**Performance Goals**: Filtro de status perceptível &lt;2s até ~5k SKUs (spec SC-005); sem regressão em paginação cursor  
**Constraints**: Route→Service→Repository; worker separado; pt-BR na UI e mensagens operador; DRY no cálculo  
**Scale/Scope**: 7 status; 2 migrations; ~15 arquivos tocados no monorepo

## Constitution Check

*GATE: Pre-design — PASS | Post-design — PASS*

| Gate | Status | Notes |
|------|--------|-------|
| Stack | PASS | Stack explícita aprovada; sem libs proibidas |
| Layer boundaries | PASS | Web→API fetch; worker→Postgres/R2; sem DB no frontend |
| API sequence | PASS | `client-products` route Zod → service → repository |
| Validation & auth | PASS | Novo enum Zod para `item_status`; Clerk inalterado |
| Secrets & CORS | PASS | Sem alteração |
| DRY & naming | PASS | Ver Complexity Tracking (formatters + status config) |
| Mobile-first | PASS | Tooltip/badge em viewport móvel; FilterBar existente |
| Operator language (pt-BR) | PASS | Labels, `action_insight`, templates em português |
| Actionable errors | PASS | Import mantém erros por linha/coluna em pt-BR |

## Project Structure

### Documentation (this feature)

```text
specs/009-stock-status-matrix/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/api.openapi.yaml
└── tasks.md              # /speckit.tasks
```

### Source Code (touch map)

```text
apps/api/
├── drizzle/migrations/0005_stock_item_status_v2.sql
├── drizzle/migrations/0006_add_action_insight.sql
├── drizzle/schema/stock-products.ts
├── src/services/idd.service.ts
├── src/schemas/client-product-filters.ts
├── src/services/client-products-service.ts
├── src/repositories/stock-product-repository.ts
└── src/lib/mappers.ts

apps/worker/
├── src/jobs/process-import.ts
└── src/services/spreadsheet-parser-service.ts   # remove status calc

packages/domain-metrics/
├── src/calculate-item-status.ts                 # NEW canonical
├── src/calculate-item-status.test.ts
└── src/index.ts                                 # export; remove idd-item-status

packages/shared/
├── src/types/index.ts                           # ItemStatus union
├── src/formatters.ts                            # NEW pt-BR formatters
└── package.json                                 # export ./formatters

apps/web/
├── src/lib/status-config.ts                     # NEW STATUS_CONFIG
├── src/lib/status-colors.ts
├── src/lib/formatters.ts                        # re-export shared
├── src/lib/idd-display.ts                       # deprecate STATUS_COLORS
├── src/components/shared/StatusBadge.tsx
├── src/components/client/StatusFilterGroup.tsx  # NEW (extract from FilterBar)
├── src/components/client/FilterBar.tsx
├── src/components/client/ProductTable.tsx
├── src/components/client/IddBarChart.tsx
├── src/store/dashboardStore.ts
└── src/lib/strings.ts                           # remove legacy itemStatus keys
```

**Structure Decision**: Monorepo Prudens existente; evolução de 002/004 sem novos apps.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Formatters em `@prudens/shared` (não só web) | `action_insight` gerado no worker | Duplicar Intl viola DRY; web path não importável no worker |
| Cálculo em `domain-metrics`, não só `idd.service.ts` | Worker + API precisam mesma regra | Lógica só na API quebra worker e constituição V |
| ENUM PG `item_status_v2` | Requisito explícito de migration | Só CHECK em text não cria tipo nomeado pedido |

---

## Fase 0 — Migration de banco de dados

**Arquivos**: `0005_stock_item_status_v2.sql`, `0006_add_action_insight.sql`, `stock-products.ts`

### 0005 — Substituir `item_status` por ENUM `item_status_v2`

Ordem SQL **obrigatória**:

```sql
-- 1. Novo tipo
CREATE TYPE item_status_v2 AS ENUM (
  'critical_rupture', 'low_stock', 'unbalanced', 'stuck_stock',
  'slight_excess', 'healthy', 'concentrated'
);

-- 2. Coluna temporária
ALTER TABLE stock_products ADD COLUMN item_status_new item_status_v2;

-- 3. Fallback produção (registros existentes)
UPDATE stock_products SET item_status_new = 'healthy'::item_status_v2;

-- 4. Remover restrição legada
ALTER TABLE stock_products DROP CONSTRAINT IF EXISTS stock_products_item_status_check;

-- 5–6. Trocar coluna
ALTER TABLE stock_products DROP COLUMN item_status;
ALTER TABLE stock_products RENAME COLUMN item_status_new TO item_status;

-- 7. NOT NULL
ALTER TABLE stock_products ALTER COLUMN item_status SET NOT NULL;

-- 8. Limpar tipo antigo se existir
DROP TYPE IF EXISTS item_status;

-- 9. Índice filtro
DROP INDEX IF EXISTS stock_products_company_status;
CREATE INDEX stock_products_company_status ON stock_products (company_id, item_status);
```

**Deploy**: API/worker antigos que esperam `text` com valores legados **devem ser atualizados antes ou junto** com esta migration — valores antigos deixam de existir na coluna após o UPDATE fallback.

### 0006 — Coluna `action_insight`

```sql
ALTER TABLE stock_products ADD COLUMN action_insight text;
-- nullable; existentes ficam NULL até reimport
```

**Ordem de execução**: `0005` → `0006` (nunca invertido).

**Estado pós-migrate sem reimport**: `item_status = healthy`, `action_insight = NULL` — app nova tolera NULL no tooltip (sem hover content).

**Drizzle**: `pgEnum('item_status_v2', [...])` + `actionInsight: text('action_insight')` após migrations aplicadas.

---

## Fase 1 — Serviço de status e insight

### Localização (constituição V)

| Camada | Arquivo | Papel |
|--------|---------|-------|
| Canônico | `packages/domain-metrics/src/calculate-item-status.ts` | `calculateItemStatus(input)` |
| Testes | `packages/domain-metrics/src/calculate-item-status.test.ts` | Vitest obrigatório |
| Fachada API | `apps/api/src/services/idd.service.ts` | `export { calculateItemStatus } from '@prudens/domain-metrics'` |
| Formatadores | `packages/shared/src/formatters.ts` | `formatPercent`, `formatCurrency` |

Remover `idd-item-status.ts` e testes antigos; atualizar `domain-metrics/src/index.ts`.

### Assinatura

```typescript
export interface CalculateItemStatusInput {
  stock_days: number;
  idd: number;
  average_demand: number;
  tied_up_capital: number;
}

export interface CalculateItemStatusResult {
  item_status: ItemStatus;
  action_insight: string;
}

export function calculateItemStatus(
  input: CalculateItemStatusInput,
): CalculateItemStatusResult;
```

### Cascata (ordem fixa — não reordenar)

```typescript
function normalizeStockDays(v: number | null | undefined): number {
  if (v == null || !Number.isFinite(v) || v < 0) return 0;
  return v;
}

// 1. stockDays === 0 → critical_rupture
// 2. stockDays > 0 && stockDays < 15 → low_stock
// 3. stockDays > 90 → stuck_stock
// 4. stockDays >= 45 && stockDays <= 90 → slight_excess
// 5. stockDays >= 15 && stockDays <= 44:
//      idd null/NaN → unbalanced
//      idd < 0 → unbalanced
//      idd >= 0 && idd <= 20 → healthy
//      idd > 20 → concentrated
```

### `action_insight` — templates

Função interna `buildActionInsight(status, vars)` com template strings; interpolação:

- `stock_days`: uma casa decimal, locale pt-BR (ex.: `12,5`).
- `average_demand`: inteiro (valor já passado com `Math.floor` no worker).
- `idd`: `formatPercent(idd, { decimals: 0 })` de `@prudens/shared/formatters`.
- `tied_up_capital`: `formatCurrency(tied_up_capital)` — templates de `stuck_stock` sem prefixo
  literal `R$` antes do valor formatado (evitar “R$ R$ 1.234”).

Textos exatos conforme spec FR-006 (7 variantes).

### Casos de teste obrigatórios (Vitest)

| stock_days | idd | item_status |
|------------|-----|-------------|
| 0 | 99 | `critical_rupture` |
| 7 | -10 | `low_stock` |
| 100 | 0 | `stuck_stock` |
| 60 | 50 | `slight_excess` |
| 30 | -5 | `unbalanced` |
| 30 | 10 | `healthy` |
| 30 | 25 | `concentrated` |

Testes adicionais recomendados: `stock_days` null → `critical_rupture`; `idd` null com 30 dias → `unbalanced`; limites 14/15, 44/45, 90/91.

### Validação parser vs. cálculo (spec Assumptions)

| Camada | `stock_days` inválido na planilha | `idd` inválido na planilha | Após parse, valores defensivos |
|--------|-----------------------------------|----------------------------|--------------------------------|
| Parser | Linha rejeitada, mensagem pt-BR | Linha rejeitada (IDD obrigatório) | — |
| `calculateItemStatus` | — | — | `stock_days` null/negativo → 0; `idd` null/NaN em 15–44 → `unbalanced` |

---

## Fase 2 — Atualização do worker

**Arquivo principal**: `apps/worker/src/jobs/process-import.ts`

### Fluxo por produto

```typescript
const stock = p.stock != null ? Number(p.stock) : 0;
const avgRaw = p.averageDemand != null ? Number(p.averageDemand) : 0;
const avgFloored = Math.floor(avgRaw);
const stockDays = p.stockDays != null ? Number(p.stockDays) : 0;
const idd = Number(p.idd);

const financial = unitPrice != null
  ? calculateFinancialMetrics({ stock, average_demand: avgFloored, unit_price: unitPrice })
  : null;

const { item_status, action_insight } = calculateItemStatus({
  stock_days: stockDays,
  idd,
  average_demand: avgFloored,
  tied_up_capital: financial?.tied_up_capital ?? 0,
});
```

### INSERT único

Incluir `item_status` e `action_insight` na mesma lista de colunas/valores do `INSERT` — sem `UPDATE` posterior.

**Parser** (`spreadsheet-parser-service.ts`): remover bloco `computeItemStatusFromIdd`; não persistir `itemStatus` no objeto parseado (ou manter campo opcional removido do tipo exportado).

---

## Fase 3 — Mapeamento visual (`STATUS_CONFIG`)

**Novo**: `apps/web/src/lib/status-config.ts`

```typescript
export const STATUS_DISPLAY_ORDER = [
  'critical_rupture', 'low_stock', 'unbalanced', 'stuck_stock',
  'slight_excess', 'healthy', 'concentrated',
] as const satisfies readonly ItemStatus[];

export const STATUS_CONFIG: Record<ItemStatus, {
  label: string;
  color: string;       // hex
  actionLabel: string;
  pulseAnimation: boolean;
}> = { /* valores spec FR-008 */ };
```

### `StatusBadge`

- Importar `STATUS_CONFIG[status]`.
- Estilo: `color`, `backgroundColor: ${color}18`.
- Exibir `label` em destaque e `actionLabel` logo abaixo (texto menor, mesma cor ou
  `text-text-subtitle`) — ambos visíveis no badge sem hover (spec FR-008 / US2).
- Não usar `strings.itemStatus` legado.
- Se `pulseAnimation`: classe `animate-pulse` no badge (borda ou fundo).

### `status-colors.ts`

```typescript
import { STATUS_CONFIG } from './status-config';
export function getStatusColor(status: ItemStatus): string {
  return STATUS_CONFIG[status]?.color ?? '#6b7280';
}
```

Remover uso de `idd-display.ts` para cores de status; manter arquivo só se ainda usado para outros fins.

---

## Fase 4 — Tooltip contextual

### `StatusBadge` props

```typescript
interface Props {
  status: ItemStatus;
  actionInsight?: string | null;
}
```

- Se `actionInsight` truthy: envolver badge em `<Tooltip delayDuration={400}>` (Shadcn).
- `<TooltipTrigger asChild>` no `<span>` do badge.
- `<TooltipContent className="max-w-[320px] text-[13px] leading-snug">` com texto puro.
- Sem ícone ℹ️ em qualquer estado.

### `ProductTable`

```tsx
<StatusBadge status={p.itemStatus} actionInsight={p.actionInsight} />
```

Mapper API → DTO: `action_insight` → `actionInsight` (camelCase).

**Ordenação**: cabeçalho `item_status` permanece botão de sort no `<th>`; tooltip só no badge dentro da célula — sem `TooltipTrigger` no `<th>`.

---

## Fase 5 — Filtros de status

### Componente

**Novo** `StatusFilterGroup.tsx`: chips/botões para cada status em `STATUS_DISPLAY_ORDER`, cores/labels de `STATUS_CONFIG`.

`FilterBar.tsx` importa `StatusFilterGroup` no lugar do bloco inline com `ALL_STATUSES` legado.

### Zustand

`apps/web/src/store/dashboardStore.ts`: `itemStatuses: ItemStatus[]` com novos literais; `buildProductsQuery` envia `item_status` repetido na query string (padrão atual).

### API

- `client-product-filters.ts`: `z.enum([...7 valores...])` — rejeitar legados.
- `stock-product-repository.ts`: `WHERE item_status IN (...)` com Drizzle `inArray`.
- `StockProductDto` + mapper: incluir `actionInsight`.

---

## Fase 6 — Gráfico de barras (Recharts)

**Arquivo**: `IddBarChart.tsx`

- Células: `fill={getStatusColor(entry.item_status)}`.
- Tooltip customizado:

```tsx
<Tooltip
  formatter={(value: number) => [formatPercent(Number(value)), 'IDD']}
  labelFormatter={(_label, payload) => {
    const point = payload?.[0]?.payload as ChartDataPointDto;
    const statusLabel = STATUS_CONFIG[point.item_status]?.label ?? point.item_status;
    return `${point.product_name} · ${statusLabel}`;
  }}
/>
```

Garantir `ChartDataPointDto.item_status` tipado com novo `ItemStatus` em `@prudens/shared/types`.

---

## Limpeza obrigatória (pós-implementação)

Grep e remover referências a `distribution`, `adequate`, `boost`:

- `packages/shared/src/types/index.ts`
- `apps/web/src/lib/strings.ts` (`itemStatus` legado)
- Tailwind tokens `status-distribution` usados em auth (renomear apenas se confundir com estoque — fora do escopo crítico, mas não usar para stock status)
- `scripts/smoke-002-quickstart.ts` → criar/atualizar `smoke-009` com novos valores
- Testes `idd-item-status.test.ts` → substituídos

---

## Constitution Check (pós-design)

| Gate | Status |
|------|--------|
| DRY | PASS — um `calculateItemStatus`, um `STATUS_CONFIG`, formatters compartilhados |
| Layers | PASS — worker calcula; API persiste via import indireto; web só exibe |
| pt-BR | PASS — templates e labels |
| Sem lógica de negócio no frontend | PASS — sem recálculo de status no cliente |

---

## Próximo comando

Executar **`/speckit.tasks`** para quebrar este plano em tarefas ordenadas por fase.
