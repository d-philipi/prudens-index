# Data Model — 004 Company Finance Cadastro

## 1) Company (extensão `companies`)

| Field (DB) | Drizzle / TS | Type | Required | Rules |
|------------|--------------|------|----------|-------|
| `cnpj` | `cnpj` | text | no | Normalizado para 14 dígitos quando informado; único se não nulo |
| `address` | `address` | text | no | Logradouro e número |
| `neighborhood` | `neighborhood` | text | no | Bairro |
| `city` | `city` | text | no | Cidade |
| `state` | `state` | char(2) | no | UF com 2 letras |

Campos existentes (`id`, `name`, `slug`, `created_at`, `updated_at`) inalterados.

### CreateCompanyInput (API / formulário)

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `name` | string | yes | min 2, trim |
| `cnpj` | string | no | 14 dígitos após normalização quando preenchido |
| `address` | string | no | max length razoável |
| `neighborhood` | string | no | — |
| `city` | string | no | — |
| `state` | string | no | regex `^[A-Za-z]{2}$` quando preenchido |

### CreateCompanyResponse

| Field | Type |
|-------|------|
| `id` | uuid |
| `name` | string |
| `slug` | string |
| `cnpj` | string \| null |
| `address` | string \| null |
| `neighborhood` | string \| null |
| `city` | string \| null |
| `state` | string \| null |
| `createdAt` | ISO datetime |

## 2) StockProduct (extensão `stock_products`)

| Field (DB) | Type | Required on insert | Rules |
|------------|------|-------------------|-------|
| `unit_price` | numeric(12,4) | sim (novas importações) | Lido da planilha; positivo |
| `projected_revenue` | integer | calculado | `round(min(stock, avg_demand) * unit_price)` |
| `tied_up_capital` | integer | calculado | `round(max(0, stock - avg_demand) * unit_price)` |
| `lost_revenue` | integer | calculado | `round(max(0, avg_demand - stock) * unit_price)` |

Registros anteriores à migration: quatro colunas `NULL` (sem backfill).

### FinancialMetrics (objeto calculado — não tabela)

| Field | Type |
|-------|------|
| `projected_revenue` | int |
| `tied_up_capital` | int |
| `lost_revenue` | int |

## 3) Spreadsheet column mapping (extensão)

| Header planilha (pt-BR) | Campo interno | Tipo |
|-------------------------|---------------|------|
| Valor Unitário | `unit_price` | float |

Atualizar `SPREADSHEET_HEADERS` e `validateSpreadsheetHeaders` para incluir **Valor Unitário** como **12ª coluna**, imediatamente após `dias estoque` (breaking change: planilhas com 11 colunas são rejeitadas).

## 4) StockProductDto (cliente)

Extensão de `StockProductDto` em `packages/shared/src/types/index.ts`:

| Field | Type |
|-------|------|
| `unitPrice` | number \| null |
| `projectedRevenue` | number \| null |
| `tiedUpCapital` | number \| null |
| `lostRevenue` | number \| null |

## 5) Relacionamentos (inalterados)

- `Company` 1—N `ImportJob`
- `ImportJob` 1—N `StockProduct` (importação ativa filtra produtos exibidos ao cliente)
