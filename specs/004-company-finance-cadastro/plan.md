# Implementation Plan: Cadastro de Empresas, Valor Unitário e Métricas Financeiras

**Branch**: `004-company-finance-cadastro` | **Date**: 2026-05-28 | **Spec**: `specs/004-company-finance-cadastro/spec.md`  
**Input**: Feature specification from `specs/004-company-finance-cadastro/spec.md`

## Summary

Estender o Prudens Index com:

1. Campos cadastrais opcionais em `companies` e fluxo admin **Nova empresa** → redirecionamento automático para imports.
2. Coluna de planilha **Valor Unitário** e três métricas financeiras calculadas **somente no worker** via função pura única.
3. Exibição das colunas financeiras na tabela do cliente com `formatCurrency` (BRL).
4. Correção de layout da dashboard do cliente para eliminar scroll horizontal em desktop ≥ 1280px.

Stack: Next.js 15 App Router, Fastify, PostgreSQL 16 + Drizzle, Zod, Clerk, Tailwind v4, Recharts. **Sem novas bibliotecas.**

## Technical Context

**Language/Version**: TypeScript strict — Next.js 15 App Router (Turbopack), Node.js 20 LTS  
**Primary Dependencies**: Fastify, Drizzle, Zod, BullMQ, SheetJS (xlsx), Clerk, Shadcn/UI, Tailwind v4, Recharts  
**Storage**: PostgreSQL 16 (Drizzle), Redis 7 (BullMQ), Cloudflare R2  
**Testing**: Vitest em `@prudens/domain-metrics` para cálculo financeiro; validação manual via `quickstart.md`  
**Target Platform**: Vercel (web), Coolify (API + worker separados)  
**Project Type**: monorepo (`apps/web`, `apps/api`, `apps/worker`, `packages/shared`, `packages/domain-metrics`)  
**Performance Goals**: Import com centenas de linhas mantém SLA atual; tabela cliente sem reflow horizontal em 1280px  
**Constraints**: Route → Service → Repository; pt-BR na UI; fórmulas financeiras em um único módulo; sem libs novas  
**Scale/Scope**: Admin (listagem + nova empresa + imports), worker (parse + insert), cliente (tabela + layout)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Reference: `.specify/memory/constitution.md` (v1.1.0)

| Gate | Status | Notes |
|------|--------|-------|
| Stack | PASS | Sem libs novas; Intl nativo para moeda |
| Layer boundaries | PASS | Web → API; worker processa planilha; sem DB no frontend |
| API sequence | PASS | `POST /admin/companies`: Route → `admin-company-service` → `company-repository` |
| Validation & auth | PASS | Zod em route e formulário cliente; `assertAdmin` |
| Secrets & CORS | PASS | Sem alteração |
| DRY | PASS | Fórmulas em `domain-metrics`; sheet mapping em `packages/shared`; `formatCurrency` único |
| Mobile-first | PASS | Formulário em página dedicada |
| Operator language (pt-BR) | PASS | Strings em `strings.ts`; erros de linha em pt-BR |
| Actionable errors | PASS | Valor Unitário inválido gera erro estruturado por linha/coluna |

**Nota de design (financial.service.ts)**: A implementação canônica das fórmulas fica em `packages/domain-metrics/src/financial-metrics.ts` (worker já depende deste pacote). `apps/api/src/services/financial.service.ts` re-exporta a mesma função para a camada de serviço da API — **zero duplicação de fórmulas**.

Nenhuma violação exige Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/004-company-finance-cadastro/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── contracts/
    └── api.openapi.yaml
```

### Source Code (repository root)

```text
apps/api/
├── drizzle/schema/companies.ts              # +cnpj, address, neighborhood, city, state
├── drizzle/schema/stock-products.ts         # +unit_price, projected_revenue, tied_up_capital, lost_revenue
├── drizzle/migrations/0003_company_cadastro.sql
├── drizzle/migrations/0004_stock_products_financial.sql
├── scripts/migrate.ts                       # shouldRun para 0003/0004
├── src/routes/admin-companies.ts            # +POST
├── src/services/admin-company-service.ts    # +createCompany
├── src/services/financial.service.ts        # re-export calculateFinancialMetrics
├── src/repositories/company-repository.ts   # +create, findByCnpj
└── src/lib/mappers.ts                       # +campos financeiros no DTO

packages/domain-metrics/src/
├── financial-metrics.ts                     # implementação única das fórmulas
└── financial-metrics.test.ts

packages/shared/src/
├── sheet-mapping.ts                         # +Valor Unitário
├── spreadsheetTemplate.ts                   # header, schema, mapRawRow
└── types/index.ts                           # StockProductDto estendido

apps/worker/src/
├── services/spreadsheet-parser-service.ts   # unit_price no ParsedProductRow
└── jobs/process-import.ts                 # calculateFinancialMetrics + INSERT

apps/web/src/
├── app/(admin)/admin/page.tsx               # botão Nova empresa
├── app/(admin)/admin/companies/new/page.tsx # página do formulário
├── features/admin/components/CreateCompanyForm.tsx
├── lib/formatters.ts                        # +formatCurrency
├── lib/strings.ts                           # labels cadastro e colunas financeiras
└── components/client/ProductTable.tsx       # colunas + layout compacto
```

**Structure Decision**: manter monorepo existente; cálculo financeiro em `domain-metrics` (padrão de `idd-item-status`); API expõe via `financial.service.ts`.

---

## Implementation Phases (sequência obrigatória)

### Fase 0 — Migration de banco de dados

**Objetivo**: adicionar colunas nullable sem alterar dados existentes.

#### Arquivos de migration (ordem de execução)

| Ordem | Arquivo | Tabela | Ação |
|------:|---------|--------|------|
| 1 | `apps/api/drizzle/migrations/0003_company_cadastro.sql` | `companies` | `ADD COLUMN IF NOT EXISTS` |
| 2 | `apps/api/drizzle/migrations/0004_stock_products_financial.sql` | `stock_products` | `ADD COLUMN IF NOT EXISTS` |

#### `0003_company_cadastro.sql` (conteúdo planejado)

```sql
ALTER TABLE companies ADD COLUMN IF NOT EXISTS cnpj text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS neighborhood text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS state char(2);

CREATE UNIQUE INDEX IF NOT EXISTS companies_cnpj_unique
  ON companies (cnpj) WHERE cnpj IS NOT NULL;
```

#### `0004_stock_products_financial.sql` (conteúdo planejado)

```sql
ALTER TABLE stock_products ADD COLUMN IF NOT EXISTS unit_price numeric(12, 4);
ALTER TABLE stock_products ADD COLUMN IF NOT EXISTS projected_revenue integer;
ALTER TABLE stock_products ADD COLUMN IF NOT EXISTS tied_up_capital integer;
ALTER TABLE stock_products ADD COLUMN IF NOT EXISTS lost_revenue integer;
```

#### Drizzle schema

- Atualizar `apps/api/drizzle/schema/companies.ts` com os cinco campos opcionais (`state` como `char(2)`).
- Atualizar `apps/api/drizzle/schema/stock-products.ts` com `unitPrice` (numeric), `projectedRevenue`, `tiedUpCapital`, `lostRevenue` (integer), todos nullable.

#### `apps/api/scripts/migrate.ts`

Adicionar em `shouldRun`:

- `0003_company_cadastro.sql` → executar se coluna `companies.cnpj` não existir.
- `0004_stock_products_financial.sql` → executar se coluna `stock_products.unit_price` não existir.

#### Garantia de dados existentes

- Migrations usam apenas `ADD COLUMN` nullable — **nenhum UPDATE** em linhas existentes.
- Produtos importados antes da spec permanecem com `unit_price` e métricas financeiras `NULL`.
- Jobs e empresas existentes continuam consultáveis sem migração de dados.

**Comando**: `pnpm --filter @prudens/api db:migrate`

---

### Fase 1 — Serviço de cálculo financeiro

**Objetivo**: uma única implementação das três fórmulas, testável e reutilizável pelo worker.

#### Arquivo canônico

`packages/domain-metrics/src/financial-metrics.ts`

#### Arquivo de fachada API (sem lógica duplicada)

`apps/api/src/services/financial.service.ts`:

```typescript
export { calculateFinancialMetrics } from '@prudens/domain-metrics/financial-metrics';
```

(Exportar também via `packages/domain-metrics/src/index.ts`.)

#### Assinatura exata

```typescript
export interface FinancialMetrics {
  projected_revenue: number;
  tied_up_capital: number;
  lost_revenue: number;
}

export function calculateFinancialMetrics(input: {
  stock: number;
  average_demand: number;
  unit_price: number;
}): FinancialMetrics;
```

#### Implementação (único lugar com fórmulas)

```typescript
const { stock, average_demand, unit_price } = input;
if (!unit_price || unit_price <= 0) {
  return { projected_revenue: 0, tied_up_capital: 0, lost_revenue: 0 };
}
const demand = average_demand ?? 0;
const stk = stock ?? 0;
return {
  projected_revenue: Math.round(Math.min(stk, demand) * unit_price),
  tied_up_capital: Math.round(Math.max(0, stk - demand) * unit_price),
  lost_revenue: Math.round(Math.max(0, demand - stk) * unit_price),
};
```

#### Casos de teste esperados (`financial-metrics.test.ts`)

| stock | average_demand | unit_price | projected_revenue | tied_up_capital | lost_revenue |
|------:|---------------:|-----------:|------------------:|----------------:|-------------:|
| 100 | 80 | 10 | 800 | 200 | 0 |
| 50 | 120 | 5 | 250 | 0 | 350 |
| 30 | 30 | 7.5 | 225 | 0 | 0 |
| 0 | 100 | 20 | 0 | 0 | 2000 |
| 100 | 0 | 15 | 0 | 1500 | 0 |
| 10 | 5 | 0 | 0 | 0 | 0 |
| 10 | 5 | null→0* | 0 | 0 | 0 |

\*Chamador passa `0` quando `unit_price` ausente após validação; função nunca lança.

---

### Fase 2 — Atualização do parser de planilha

**Objetivo**: ler Valor Unitário, validar, calcular métricas no worker e persistir em um único INSERT.

#### Mapeamento (fonte única)

Atualizar **somente** `packages/shared/src/sheet-mapping.ts` (fonte canônica; `apps/api/src/lib/sheet-mapping.ts` continua re-exportando):

```typescript
'Valor Unitário': { field: 'unit_price', type: 'float' as const },
```

#### Cabeçalhos e validação estrutural

Em `packages/shared/src/spreadsheetTemplate.ts`:

- Adicionar `'Valor Unitário'` ao final de `SPREADSHEET_HEADERS` (após `'dias estoque'`).
- Em `mapRawRow`: `unit_price: cellToNumber(cells['Valor Unitário'])`.
- Em `spreadsheetRowSchema`:

```typescript
unit_price: floatCell.pipe(
  z.number().positive({ message: 'Valor unitário deve ser positivo' }),
),
```

Coluna obrigatória no cabeçalho; por linha, `unit_price` ausente, texto ou ≤ 0 → falha de validação Zod → erro estruturado via `toValidationErrors` (coluna "Valor Unitário", pt-BR). O mesmo padrão aplica-se a `stock` e `average_demand` quando inválidos (colunas `estoque` e `demanda media` no cabeçalho).

#### Worker — fluxo após validação da linha

Em `apps/worker/src/services/spreadsheet-parser-service.ts`:

- Estender `ParsedProductRow` com `unitPrice: number` (número já validado).

Em `apps/worker/src/jobs/process-import.ts`, **por produto válido**:

```typescript
import { calculateFinancialMetrics } from '@prudens/domain-metrics';

const stock = p.stock != null ? Number(p.stock) : 0;
const avg = p.averageDemand != null ? Number(p.averageDemand) : 0;
const unitPrice = p.unitPrice;
const financial = calculateFinancialMetrics({
  stock,
  average_demand: avg,
  unit_price: unitPrice,
});
```

#### INSERT único (campos novos)

```sql
INSERT INTO stock_products (
  ..., unit_price, projected_revenue, tied_up_capital, lost_revenue
) VALUES (
  ..., ${unitPrice}, ${financial.projected_revenue},
  ${financial.tied_up_capital}, ${financial.lost_revenue}
)
```

**Proibido**: recalcular fórmulas em mapper, API ou frontend.

---

### Fase 3 — Endpoint e formulário de criação de empresa

#### API — `POST /api/admin/companies`

**Route** (`apps/api/src/routes/admin-companies.ts`):

```typescript
const createBodySchema = z.object({
  name: z.string().trim().min(2),
  cnpj: z.string().optional().transform(normalizeCnpj).nullable(),
  address: z.string().trim().optional().nullable(),
  neighborhood: z.string().trim().optional().nullable(),
  city: z.string().trim().optional().nullable(),
  state: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{2}$/)
    .optional()
    .nullable(),
}).superRefine((data, ctx) => {
  if (data.cnpj && !isValidCnpjDigits(data.cnpj)) {
    ctx.addIssue({ code: 'custom', path: ['cnpj'], message: 'CNPJ inválido' });
  }
});
```

**Service** (`admin-company-service.create`):

- Validar `name` (mín. 2 caracteres); retornar `400` com mensagem pt-BR se inválido.
- Gerar `slug` único a partir de `name` (`slugify` + sufixo incremental se colisão).
- `companyRepository.create(...)` com campos opcionais.
- Se CNPJ duplicado (unique violation) → erro com `statusCode: 409`, `message: 'CNPJ já cadastrado'`.
- Se falha de unicidade de slug após retries → `400` com mensagem pt-BR no formulário.

**Response 201**: `CompanyCreated` (ver `data-model.md`).

#### Frontend — `CreateCompanyForm`

Arquivo: `apps/web/src/features/admin/components/CreateCompanyForm.tsx`

- Client component com `react-hook-form` **não** (constituição não lista; usar Zod + `useState` ou `zodResolver` se já no projeto — preferir Zod manual + `safeParse` antes de submit para **zero deps novas**).
- Campos: nome (obrigatório), CNPJ, endereço, bairro, cidade, UF.
- `createCompanySchema.safeParse(form)` no submit; se falhar, setar erros por campo e **return** (sem `fetch`).
- `apiFetch` POST com token Clerk; em `409`, erro inline em `cnpj`; demais erros em banner.
- Sucesso (`201`): `router.push(`/admin/companies/${data.id}/imports`)`.

#### Botão e rota

- `apps/web/src/app/(admin)/admin/page.tsx`: botão **Nova empresa** (`Link` para `/admin/companies/new`) no topo da listagem.
- `apps/web/src/app/(admin)/admin/companies/new/page.tsx`: renderiza `CreateCompanyForm` + `Breadcrumb` (Empresas → Nova empresa).

**Decisão UX**: página dedicada (não modal) — ver `research.md` R2.

---

### Fase 4 — Exibição das colunas financeiras na tabela do cliente

#### Formatação monetária — fonte única (`apps/web/src/lib/formatters.ts`)

```typescript
export function formatCurrency(value: number | null | undefined): string;
// Intl pt-BR, BRL, 0 casas decimais — projectedRevenue, tiedUpCapital, lostRevenue

export function formatUnitPrice(value: number | null | undefined): string;
// Intl pt-BR, BRL, 2 casas decimais — unitPrice
```

- **Locale**: `pt-BR` em ambas
- `formatPercent` permanece inalterado; sem duplicar lógica de locale

#### `ProductTable` — novas colunas (ordem após existentes)

| Label UI | Campo DTO | Formatter |
|----------|-----------|-----------|
| Valor Unitário | `unitPrice` | `formatUnitPrice` |
| Faturamento Projetado | `projectedRevenue` | `formatCurrency` |
| Capital Imobilizado | `tiedUpCapital` | `formatCurrency` |
| Faturamento Perdido | `lostRevenue` | `formatCurrency` |

#### API cliente

- `toStockProductDto` em `mappers.ts`: mapear novos campos.
- `stock-product-repository` `SORT_COLUMNS`: adicionar chaves para ordenação (`unit_price`, `projected_revenue`, etc.).

#### Strings

Adicionar em `apps/web/src/lib/strings.ts` labels pt-BR das quatro colunas.

---

### Fase 5 — Correção de layout e eliminação de scroll horizontal

#### Auditoria (componentes)

| Componente | Risco de overflow |
|------------|-------------------|
| `dashboard/layout.tsx` | `max-w-7xl` + `p-4 md:p-8` reduz área útil |
| `DashboardView.tsx` | `flex` com sidebar fixa + gap-6 |
| `FilterSidebar.tsx` | largura fixa empurra conteúdo — **incluir no escopo US3** |
| `ProductTable.tsx` | `overflow-x-auto` + `min-w-full` + muitas colunas |
| `ProductTable` thead/cells | `whitespace-nowrap` + `px-3` |

#### Correções Tailwind planejadas

1. **`apps/web/src/app/(client)/dashboard/layout.tsx`**
   - `max-w-7xl` → `w-full max-w-[1600px]`
   - `p-4 md:p-8` → `px-3 py-4 md:px-4 md:py-6`

2. **`DashboardView.tsx`**
   - `gap-6` → `gap-3 lg:gap-4`
   - Wrapper do conteúdo principal: `min-w-0 flex-1 overflow-x-hidden`

3. **`FilterSidebar.tsx`**
   - Garantir largura máxima fixa compatível com flex (`shrink-0`, largura estável) para não empurrar a tabela além da viewport

4. **`ProductTable.tsx`**
   - Remover `overflow-x-auto` do container externo (ou manter apenas se contenção interna falhar — preferir remover e usar `overflow-x-hidden` no pai).
   - `table`: `w-full table-fixed text-xs md:text-sm`
   - Células: `px-2 py-1.5` (reduzir de `px-3 py-2`)
   - Colunas longas (Produto): `truncate` + `title` tooltip nativo
   - Evitar `min-w-full` que force largura mínima além da viewport

5. **Breakpoints de referência**
   - Mínimo: **1280px** (sem scroll horizontal)
   - Validar também: 1440px, 1920px

6. **Novas colunas financeiras**
   - Cabeçalhos abreviados se necessário em `strings` (ex.: "Fat. projetado") com `title` completo no `<th title="...">` para economizar largura sem perder significado.

**Não incluído nesta fase**: toggle de ocultar colunas (adiado).

---

## Phase 0 / Phase 1 Deliverables (this command)

| Artifact | Path | Status |
|----------|------|--------|
| Research | `specs/004-company-finance-cadastro/research.md` | Done |
| Data model | `specs/004-company-finance-cadastro/data-model.md` | Done |
| API contract | `specs/004-company-finance-cadastro/contracts/api.openapi.yaml` | Done |
| Quickstart | `specs/004-company-finance-cadastro/quickstart.md` | Done |
| Plan | `specs/004-company-finance-cadastro/plan.md` | Done |

## Constitution Check (post-design)

| Gate | Status |
|------|--------|
| Stack | PASS |
| Layer boundaries | PASS |
| API sequence | PASS |
| DRY (financial) | PASS — `domain-metrics` + re-export API |
| pt-BR / actionable errors | PASS |

## Complexity Tracking

| Topic | Decision | Simpler alternative rejected |
|-------|----------|------------------------------|
| Financial formulas location | `domain-metrics` + `financial.service.ts` re-export | API-only file breaks worker access |
| Create company UI | Dedicated page | Modal too cramped for 6 fields |
