# Data Model — 007 Workspace Design System

Esta feature é predominantemente de apresentação. Entidades abaixo descrevem **estado de UI** e **extensões de contrato de API** — não novas tabelas PostgreSQL.

## UI State Entities

### EntryProfileSelection

Estado na tela `/sign-in` (não persistido; opcional `sessionStorage` para restaurar após erro de mismatch).

| Field | Type | Rules |
|-------|------|-------|
| selectedProfile | `admin` \| `client` | Obrigatório antes de submeter login |
| mismatchError | string? | pt-BR quando `selectedProfile` ≠ `role` do JWT |

### SidebarPreference

Persistência local do layout de navegação.

| Field | Type | Rules |
|-------|------|-------|
| collapsed | boolean | `true` = 64px, `false` = 220px |
| storageKey | string | Constante `prudens.sidebar.collapsed` |

**Transitions**: toggle no rodapé da sidebar → grava imediatamente em `localStorage`.

### NavigationContext

Contexto derivado da sessão (Clerk) e pathname.

| Field | Type | Rules |
|-------|------|-------|
| role | `admin` \| `client` | Define itens visíveis na nav |
| activeItem | enum | `dashboard` \| `products` \| `companies` \| `users` \| `imports` |
| pathname | string | Usado para highlight do item ativo |

### PageHeaderContent

Metadados por rota em `apps/web/src/lib/page-meta.ts` (ou equivalente).

| Field | Type | Rules |
|-------|------|-------|
| title | string | Plus Jakarta Sans 18px/500 |
| subtitle | string? | Inter 13px `#6b7280` |

**Rotas mínimas cobertas (FR-009)**: `/dashboard`; `/admin`; `/admin/usuarios`; `/admin/imports`; `/admin/companies/new`; `/admin/companies/:id`; `/admin/companies/:id/imports`.

**Resolução de pathname** (`resolvePageMeta`): tentativa de match exato primeiro; depois padrões com parâmetros (`:id` UUID) para detalhe de empresa e imports por empresa.

### ClientDashboardFilters

Estado Zustand estendido em `dashboardStore` (cliente).

| Field | Type | Rules |
|-------|------|-------|
| term | string | Busca nome ou EAN |
| itemStatuses | ItemStatus[] | Checkbox múltiplo |
| iddMin | number | Default −100 |
| iddMax | number | Default +100 |
| stockDaysMin | number | Default 0 |
| stockDaysMax | number | Default 365 |
| tiedUpCapitalMin | number | Default 0 |
| tiedUpCapitalMax | number | Default dinâmico (max dos dados) |
| filtersPanelOpen | boolean | Painel colapsável |

**Invariant**: Qualquer alteração de filtro reseta `currentPage` para 1 e dispara refetch (debounce 300ms).

**Derived**: `hasActiveFilters` — qualquer campo diferente do default ou `term` não vazio ou `itemStatuses.length > 0`.

### DesignTokens (read-only reference)

Não persistidos; definidos em CSS.

| Token | Value | Usage |
|-------|-------|-------|
| brand.primary | `#1a4731` | Sidebar, CTAs |
| brand.accent | `#d4a020` | Logo DEX, nav active border |
| status.distribution | `#e84040` | Badge, bar chart |
| status.adequate | `#16a34a` | Badge, bar chart |
| status.boost | `#f59e0b` | Badge, bar chart |
| surface.page | `#f5f5f3` | Page background |
| surface.card | `#ffffff` | Cards |
| border.default | `#e2e2de` | 0.5px borders |
| idd.hero.negative | `#f87878` | Hero card IDD |
| idd.hero.positive | `#86efac` | Hero card IDD |
| idd.table.negative | `#e84040` | Table cells |
| idd.table.low | `#16a34a` | IDD 0–20 |
| idd.table.high | `#f59e0b` | IDD > 20 |

### StatusBadgeDisplay

Mapeamento visual de `ItemStatus` (domínio existente).

| itemStatus | Label (pt-BR) | Pill color |
|------------|---------------|------------|
| distribution | Distribuição | `#e84040` background tint |
| adequate | Adequado | `#16a34a` |
| boost | Impulsionar | `#f59e0b` |

## API Query Extension (no schema migration)

Estende `ClientProductsQuery` / `ProductQueryParams`:

| Param | Type | Filter column |
|-------|------|---------------|
| idd_min | number? | `stock_products.idd` ≥ |
| idd_max | number? | `stock_products.idd` ≤ |
| stock_days_min | number? | `stock_days` ≥ |
| stock_days_max | number? | `stock_days` ≤ |
| tied_up_capital_min | integer? | `tied_up_capital` ≥ |
| tied_up_capital_max | integer? | `tied_up_capital` ≤ |

Validação Zod: ranges coerentes (min ≤ max quando ambos presentes); limites IDD −100..100 na route.

## Relationships

```text
SidebarPreference ──used by──► AppShell
NavigationContext ──drives──► Sidebar / MobileBottomNav
ClientDashboardFilters ──serialized to──► GET /api/client/products query string
ClientDashboardFilters ──triggers──► chart_data + items + total (same filter set)
```
