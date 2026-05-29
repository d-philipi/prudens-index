# Data Model: Matriz bidimensional de status e action_insight

**ORM**: Drizzle | **Database**: PostgreSQL 16 | **Feature**: `009-stock-status-matrix`

## `item_status` (substituição completa)

| Valor | Label (UI) | Determinado por |
|-------|------------|-----------------|
| `critical_rupture` | Ruptura Crítica | Passo 1: `stock_days = 0` |
| `low_stock` | Estoque Baixo | Passo 2: `0 < stock_days < 15` |
| `stuck_stock` | Estoque Encalhado | Passo 3: `stock_days > 90` |
| `slight_excess` | Excesso Leve | Passo 4: `45 ≤ stock_days ≤ 90` |
| `unbalanced` | Desbalanceado | Passo 5: `15 ≤ stock_days ≤ 44` e `idd < 0` |
| `healthy` | Saudável | Passo 5: `15 ≤ stock_days ≤ 44` e `0 ≤ idd ≤ 20` |
| `concentrated` | Concentrado | Passo 5: `15 ≤ stock_days ≤ 44` e `idd > 20` |

**Removidos**: `distribution`, `adequate`, `boost`.

**Cascata**: primeira condição satisfeita vence; passos 1–4 ignoram IDD.

**Bordas implementação**:
- `stock_days` null / negativo / NaN → normalizar para `0` antes da cascata.
- `idd` null / NaN no passo 5 → `unbalanced`.

## `action_insight` (novo)

| Coluna | Tipo PostgreSQL | Drizzle | Nullable | Origem |
|--------|-----------------|---------|----------|--------|
| `action_insight` | `text` | `text('action_insight')` | YES | `calculateItemStatus` no worker |

Gerado no mesmo instante que `item_status`; não vem da planilha. Texto pt-BR com valores interpolados (ver spec FR-006).

## Drizzle schema (`stock_products`)

```typescript
import { pgEnum } from 'drizzle-orm/pg-core';

export const itemStatusEnum = pgEnum('item_status_v2', [
  'critical_rupture',
  'low_stock',
  'unbalanced',
  'stuck_stock',
  'slight_excess',
  'healthy',
  'concentrated',
]);

// stock_products:
itemStatus: itemStatusEnum('item_status').notNull(),
actionInsight: text('action_insight'),
```

> Após migration SQL, o tipo PG exposto na coluna pode ser renomeado de `item_status_v2` para reutilizar nome de coluna `item_status` (ver plan Fase 0).

## Migrations (ordem obrigatória)

### `0005_stock_item_status_v2.sql`

1. `CREATE TYPE item_status_v2 AS ENUM (...)` — 7 valores listados acima.
2. `ALTER TABLE stock_products ADD COLUMN item_status_new item_status_v2;`
3. `UPDATE stock_products SET item_status_new = 'healthy'::item_status_v2;` — fallback para linhas existentes.
4. `ALTER TABLE stock_products DROP CONSTRAINT IF EXISTS stock_products_item_status_check;`
5. `ALTER TABLE stock_products DROP COLUMN item_status;`
6. `ALTER TABLE stock_products RENAME COLUMN item_status_new TO item_status;`
7. `ALTER TABLE stock_products ALTER COLUMN item_status SET NOT NULL;`
8. `DROP TYPE IF EXISTS item_status;` — legado, se existir.
9. Recriar índice `stock_products_company_status` em `(company_id, item_status)`.

### `0006_add_action_insight.sql`

1. `ALTER TABLE stock_products ADD COLUMN action_insight text;` — nullable; linhas existentes permanecem `NULL`.

**Deploy**: aplicar `0005` antes de `0006`. Versões antigas da API que não leem `action_insight` continuam funcionando; versão nova deve tolerar `NULL` no tooltip.

## TypeScript (`@prudens/shared/types`)

```typescript
export type ItemStatus =
  | 'critical_rupture'
  | 'low_stock'
  | 'unbalanced'
  | 'stuck_stock'
  | 'slight_excess'
  | 'healthy'
  | 'concentrated';

export interface StockProductDto {
  // ...campos existentes...
  itemStatus: ItemStatus;
  actionInsight: string | null;
}
```

## API filter schema

`item_status` query param: array dos 7 valores (Zod `z.enum([...])`); rejeitar valores legados com 400.

## Derived function signature

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
```

## Entity relationships

Inalterado em relação a 002: `companies` → `import_jobs` → `stock_products`.

## State diagram (cascata, não transição)

```text
stock_days == 0 ──────────────────────────────► critical_rupture
stock_days in (0,15) ─────────────────────────► low_stock
stock_days > 90 ──────────────────────────────► stuck_stock
stock_days in [45,90] ────────────────────────► slight_excess
stock_days in [15,44] + idd bands ────────────► unbalanced | healthy | concentrated
```

Não há transição de status em runtime; recálculo apenas em novo import.
