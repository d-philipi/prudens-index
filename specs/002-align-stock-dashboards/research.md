# Research: Alinhamento de Estoque, Status por IDD e Painéis Admin/Cliente

**Feature**: `002-align-stock-dashboards` | **Date**: 2026-05-22

## R1 — Onde vive a lógica única de `item_status` (constituição vs. pedido do plano)

**Decision**: Implementação pura em `packages/domain-metrics/src/idd-item-status.ts`; `apps/api/src/services/idd.service.ts` reexporta a mesma função como superfície do layer Service; o worker importa apenas `@prudens/domain-metrics`.

**Rationale**: Constituição V exige uma única implementação e proíbe duplicação; o worker não pode depender de `apps/api` (violaria separação de containers/camadas). O caminho `idd.service.ts` atende ao contrato do plano como ponto documentado da API sem copiar código.

**Alternatives considered**:
- Lógica só em `apps/api` — rejeitado: worker não importa API.
- Duplicar função no worker — rejeitado: viola DRY.

**Assinatura canônica**:

```typescript
export type ItemStatusValue = 'distribution' | 'adequate' | 'boost';

export function computeItemStatusFromIdd(idd: number | null | undefined): ItemStatusValue;
```

**Casos de borda**:
| Entrada | Retorno | Nota |
|---------|---------|------|
| `idd < 0` | `distribution` | |
| `0 ≤ idd ≤ 20` | `adequate` | Limites inclusivos |
| `idd > 20` | `boost` | |
| `null`, `undefined`, `NaN` | Linha rejeitada no parse (preferência spec); se persistida por migração legada, tratar como `0` → `adequate` |

---

## R2 — Localização de `sheet-mapping` (API + worker)

**Decision**: Objeto de mapeamento canônico em `packages/shared/src/sheet-mapping.ts`; `apps/api/src/lib/sheet-mapping.ts` faz `export * from '@prudens/shared/sheet-mapping'` para satisfazer o path solicitado no plano.

**Rationale**: Worker já depende de `@prudens/shared`; evita dependência worker→api. Um único objeto `SHEET_COLUMN_MAPPING` alimenta parser (worker) e validação (API).

**Alternatives considered**:
- Somente em `apps/api` — rejeitado: worker não acessa pacote API.

---

## R3 — Tipo de `item_status` no PostgreSQL

**Decision**: Coluna `text NOT NULL` com `CHECK (item_status IN ('distribution','adequate','boost'))`; remover enum PostgreSQL `item_status` legado após migração.

**Rationale**: Pedido explícito do plano (text + check); novos valores incompatíveis com enum antigo (`critical`, `attention`, `excess`).

**Alternatives considered**:
- Novo `pgEnum` Drizzle — rejeitado: pedido foi text + check.

---

## R4 — Migração de `jsonb` (listas de filiais) para `integer` (contagens)

**Decision**: Na migration `0001`, backfill com `COALESCE(jsonb_array_length(col), 0)` quando valor for array JSON; se valor numérico legado existir em texto, `CAST` seguro com fallback 0.

**Rationale**: Preserva cardinalidade aproximada de dados antigos sem perder linhas de produto.

**Alternatives considered**:
- Truncar tabela — rejeitado: perda de dados inaceitável.

---

## R5 — Paginação e gráfico unificado (cliente)

**Decision**: Cursor keyset pagination server-side em `GET /api/client/products`; mesmo response inclui `chart_data` derivado do **mesmo** filtro SQL (subquery ou CTE), limitado a N barras (ex.: 500) para payload; tabela usa `limit` + `cursor`.

**Rationale**: Evita duas round-trips; alinha gráfico e tabela; escala melhor que carregar 5k linhas no cliente (spec SC-005).

**Alternatives considered**:
- Filtro 100% client-side (001) — rejeitado para esta feature: volume e requisito de cursor server-side.

---

## R6 — Filtro por filial

**Decision**: **Não implementar** query param `filial` (spec Q1:A). Endpoints aceitam `term`, `item_status` (repetível ou CSV), `sort`, `order`, `cursor`, `limit`.

**Rationale**: Spec fechada após clarificação; plano do usuário mencionava filial — sobrescrito pela spec.

---

## R7 — Cores do Recharts por `item_status`

**Decision**: Mapa único `ITEM_STATUS_CHART_COLORS` em `apps/web/src/lib/item-status-chart-colors.ts`; `IddBarChart` importa somente daí; API pode enviar `item_status` por barra sem enviar cor.

**Rationale**: Constituição V — sem duplicar hex/rgb em `ProductTable` ou store.

---

## R8 — Rotas admin/cliente (prefixo `/api`)

**Decision**: Manter prefixo existente do monorepo: `/api/admin/*`, `/api/client/*` (não `/admin` nu).

**Rationale**: Consistência com `server.ts` e client `apiFetch` atual.

---

## R9 — Testes

**Decision**: Vitest para `computeItemStatusFromIdd`, Zod row schema, cursor encode/decode; smoke manual via `quickstart.md`.

**Rationale**: Alinhado ao plano 001; sem Playwright obrigatório nesta entrega.

---

## R10 — Pós-analyze (2026-05-22)

**Decision**: Spec alinhada ao plano: filtros cliente só via API; FR-016 = lista `avgIddByCompany`; FR-022 colunas enumeradas; job `completed` com erros parciais de linha se ≥1 insert; empty state sem importação ativa.

**Rationale**: Fecha achados I1, C1, C2, A1, U1, U2, C3 da análise spec/plan/tasks.
