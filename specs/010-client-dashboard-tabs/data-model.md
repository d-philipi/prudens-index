# Data Model: Abas do dashboard cliente e ajustes de status

**ORM**: Drizzle | **Database**: PostgreSQL 16 | **Feature**: `010-client-dashboard-tabs`

## Alterações de schema

**Nenhuma migration SQL nova.** Colunas existentes em `stock_products` e `import_jobs` são suficientes:

| Coluna existente | Uso nesta feature |
|------------------|-------------------|
| `stock_products.stock_days` | Cascata atualizada + extremos do resumo |
| `stock_products.stock` | Passo 0 (estoque > 0 com demanda zero) |
| `stock_products.average_demand` | Passo 0 + insights |
| `stock_products.idd` | Cascata passo 5 + extremos |
| `stock_products.projected_revenue` | Totais e extremos do resumo |
| `stock_products.tied_up_capital` | Totais, Top 3 risco, extremos |
| `stock_products.lost_revenue` | Totais, Top 3 risco, extremos |
| `stock_products.item_status` | Reclassificado via backfill/worker |
| `stock_products.action_insight` | Textos atualizados via backfill/worker |
| `import_jobs.is_active` | Identificar importação ativa |
| `import_jobs.r2_object_key` | Download de planilhas |
| `import_jobs.original_filename` | Label na aba Exportação |
| `import_jobs.completed_at` | Ordenação histórico |

## Cascata de status (atualizada — SSOT em `domain-metrics`)

| Passo | Condição | `item_status` |
|-------|----------|---------------|
| 0 | `stock > 0`, `average_demand = 0`, `stock_days` null/NaN/±Infinity | `stuck_stock` |
| 1 | `stock_days = 0` (incl. negativo normalizado) | `critical_rupture` |
| 2 | `0 < stock_days < 15` | `low_stock` |
| 3 | `stock_days > 90` | `stuck_stock` |
| 4 | `45 ≤ stock_days ≤ 90` | `slight_excess` |
| 5 | `15 ≤ stock_days ≤ 44`: IDD &lt; 0 → `unbalanced`; IDD &gt; 20 → `concentrated`; 0 ≤ IDD ≤ 20 e days &gt; 30 → `healthy`; 0 ≤ IDD ≤ 20 e 15 ≤ days ≤ 30 → `low_stock` |

### Variantes de `action_insight`

| Status | Subtipo | Critério |
|--------|---------|----------|
| `low_stock` | volume_insuficiente | passo 2 |
| `low_stock` | oportunidade_perdida | passo 5, 15 ≤ days ≤ 30, IDD 0–20 |
| `stuck_stock` | demanda_zero | passo 0 |
| `stuck_stock` | excesso_dias | passo 3 |

Demais status: templates spec 009 inalterados.

## DTOs novos (`@prudens/shared/types`)

### `ClientDashboardSummaryDto`

```typescript
export interface ProductHighlightDto {
  productName: string;
  ean: string | null;
  /** Unidade depende do campo pai — ver tabela abaixo */
  value: number;
}
```

**Semântica de `ProductHighlightDto.value` por campo do resumo:**

| Campo em `ClientDashboardSummaryDto` | `value` representa |
|--------------------------------------|--------------------|
| `minStockDays` / `maxStockDays` | Dias de estoque (decimal) |
| `minIdd` / `maxIdd` | IDD (%) |
| `minProjectedRevenue` / `maxProjectedRevenue` | Faturamento projetado (centavos/unidade mínima) |
| `maxTiedUpCapital` | Capital imobilizado (centavos/unidade mínima) |
| `maxLostRevenue` | Faturamento perdido (centavos/unidade mínima) |

```typescript
// continuação ClientDashboardSummaryDto

export interface RiskProductDto {
  productName: string;
  ean: string | null;
  lostRevenue: number;
  tiedUpCapital: number;
  riskScore: number; // lostRevenue + tiedUpCapital
}

export interface StatusCountDto {
  status: ItemStatus;
  count: number;
}

export interface ClientDashboardSummaryDto {
  totalProjectedRevenue: number;
  totalTiedUpCapital: number;
  totalLostRevenue: number;
  statusCounts: StatusCountDto[]; // 7 entradas, ordem STATUS_DISPLAY_ORDER
  topRiskProducts: RiskProductDto[]; // max 3
  minStockDays: ProductHighlightDto | null;
  maxStockDays: ProductHighlightDto | null;
  minIdd: ProductHighlightDto | null;
  maxIdd: ProductHighlightDto | null;
  minProjectedRevenue: ProductHighlightDto | null;
  maxProjectedRevenue: ProductHighlightDto | null;
  maxTiedUpCapital: ProductHighlightDto | null;
  maxLostRevenue: ProductHighlightDto | null;
}
```

Valores monetários: inteiros em centavos ou unidade mínima (mesmo contrato de `StockProductDto.projectedRevenue`).

### `ExportVersionDto` / `ClientExportVersionsDto`

```typescript
export interface ExportVersionDto {
  jobId: string;
  filename: string;
  completedAt: string | null; // ISO
  isActive: boolean;
}

export interface ClientExportVersionsDto {
  active: ExportVersionDto | null;
  /** Jobs `completed` com `is_active = false`, ordenados por `completedAt DESC`; o job ativo não se repete aqui */
  history: ExportVersionDto[];
}
```

### `ExportFileResponseDto`

Reutiliza `ActiveFileExportResponseDto` (`{ url, filename }`).

## Repositório — agregações (`stockProductRepository`)

Novos métodos (Drizzle, importação ativa + filtro opcional `itemStatuses`):

| Método | Retorno |
|--------|---------|
| `aggregateExecutiveSummary(companyId, importJobId, itemStatuses?)` | `ClientDashboardSummaryDto` |
| `findChartDataFiltered(...)` | existente — reutilizar para Dashboard chart |

Agregações SQL:
- **Totais**: `SUM(projected_revenue)`, `SUM(tied_up_capital)`, `SUM(lost_revenue)` com `COALESCE(..., 0)`.
- **Contagem por status**: `GROUP BY item_status`.
- **Top 3 risco**: `ORDER BY (COALESCE(lost_revenue,0) + COALESCE(tied_up_capital,0)) DESC, product_name ASC LIMIT 3`.
- **Extremos**: subconsultas ou `ORDER BY ... LIMIT 1` por métrica (min/max stock_days, idd, projected_revenue; max tied_up_capital, lost_revenue).

Desempate Top 3: `product_name ASC`.

## Backfill (sem schema)

Script atualiza em batch:

```sql
UPDATE stock_products SET
  item_status = :status,
  action_insight = :insight
WHERE id = :id;
```

Somente jobs com `import_jobs.is_active = true` (ou flag `--all-jobs` para admin ops).

**Entrada por linha** (relida do banco, passada a `calculateItemStatus`):

`stock`, `stock_days` (nullable — não coercer null→0 antes da função), `idd`, `average_demand` (inteiro/truncado), `tied_up_capital`.

## PDF — payload interno (service layer, não exposto)

O service monta estrutura em memória a partir da **importação ativa completa** (sem filtros de usuário):

- `ClientOverviewDto` (cabeçalho)
- `ClientDashboardSummaryDto` (resumo integral — sem `itemStatuses`)
- `StockProductDto[]` agrupados por `item_status` (ordem `STATUS_DISPLAY_ORDER`)
- `ChartDataPointDto[]` ordenados por `idd ASC`

## TypeScript — extensão `CalculateItemStatusInput`

```typescript
export interface CalculateItemStatusInput {
  stock_days: number | null;
  stock: number;
  idd: number;
  average_demand: number;
  tied_up_capital: number;
}
```

## Relacionamentos (inalterados)

```text
companies 1 ── * import_jobs
import_jobs 1 ── * stock_products
import_jobs 1 ── 1 r2_object (via r2_object_key)
```

Isolamento: todas as queries filtram `company_id` do JWT cliente.
