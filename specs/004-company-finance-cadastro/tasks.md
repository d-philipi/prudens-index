# Tasks: Cadastro de Empresas, Valor Unitário e Métricas Financeiras

**Input**: Design documents from `/specs/004-company-finance-cadastro/`  
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/api.openapi.yaml`, `quickstart.md`

**Tests**: Vitest para `calculateFinancialMetrics` conforme `plan.md` Fase 1; demais validações via `quickstart.md` (sem TDD full-stack solicitado).

**Organization**: Tarefas agrupadas por user story para implementação e validação independentes.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependência de tarefa incompleta)
- **[Story]**: Mapeia à user story (`US1`, `US2`, `US3`)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: preparar strings e utilitários compartilhados antes das migrations e features.

- [x] T001 Adicionar labels pt-BR de cadastro de empresa e colunas financeiras em `apps/web/src/lib/strings.ts` (domínios `admin` e `client`)
- [x] T002 [P] Criar utilitário `normalizeCnpj` / `isValidCnpjDigits` em `apps/api/src/lib/cnpj.ts` para uso em route e validação compartilhada
- [x] T003 [P] Criar utilitário `slugifyCompanyName` com resolução de colisão em `apps/api/src/lib/slug.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: migrations, schemas, cálculo financeiro canônico e tipos compartilhados — **bloqueia todas as user stories**.

**⚠️ CRITICAL**: Nenhuma user story deve ser finalizada sem esta fase concluída.

- [x] T004 Criar migration `apps/api/drizzle/migrations/0003_company_cadastro.sql` (`cnpj`, `address`, `neighborhood`, `city`, `state` nullable + índice único parcial em `cnpj`)
- [x] T005 Criar migration `apps/api/drizzle/migrations/0004_stock_products_financial.sql` (`unit_price`, `projected_revenue`, `tied_up_capital`, `lost_revenue` nullable)
- [x] T006 Atualizar `shouldRun` para `0003` e `0004` em `apps/api/scripts/migrate.ts` e executar `pnpm --filter @prudens/api db:migrate`
- [x] T007 Atualizar schema Drizzle de empresas com campos cadastrais em `apps/api/drizzle/schema/companies.ts`
- [x] T008 [P] Atualizar schema Drizzle de produtos com campos financeiros em `apps/api/drizzle/schema/stock-products.ts`
- [x] T009 Implementar `calculateFinancialMetrics` (única implementação das fórmulas) em `packages/domain-metrics/src/financial-metrics.ts`
- [x] T010 [P] Adicionar testes Vitest com casos da tabela do plano e um caso de valores grandes (ex.: stock 999999) em `packages/domain-metrics/src/financial-metrics.test.ts`
- [x] T011 [P] Exportar `calculateFinancialMetrics` em `packages/domain-metrics/src/index.ts`
- [x] T012 Criar re-export sem lógica duplicada em `apps/api/src/services/financial.service.ts`
- [x] T013 [P] Estender `StockProductDto` e tipos `CreateCompanyRequest` / `CompanyCreated` em `packages/shared/src/types/index.ts`

**Checkpoint**: banco migrado, fórmulas testadas, tipos compartilhados prontos.

---

## Phase 3: User Story 1 - Cadastrar nova empresa no admin (Priority: P1) 🎯 MVP

**Goal**: botão "Nova empresa", formulário com validação inline, `POST /api/admin/companies`, redirect automático para imports.

**Independent Test**: criar empresa só com nome → redirect `/admin/companies/{id}/imports`; formulário inválido não dispara fetch; CNPJ duplicado exibe erro inline.

### Implementation for User Story 1

- [x] T014 [US1] Implementar `create` e `findByCnpj` em `apps/api/src/repositories/company-repository.ts`
- [x] T015 [US1] Implementar `createCompany` (validação de nome, slug único com sufixo, erro 409 CNPJ, erro 400 nome/slug em pt-BR) em `apps/api/src/services/admin-company-service.ts`
- [x] T016 [US1] Adicionar `POST /api/admin/companies` com Zod + `assertAdmin` em `apps/api/src/routes/admin-companies.ts` (Route → Service → Repository)
- [x] T017 [P] [US1] Criar schema Zod cliente `createCompanySchema` (nome mín. 2 caracteres, CNPJ, UF, etc.) em `apps/web/src/features/admin/schemas/create-company-schema.ts`
- [x] T018 [US1] Implementar `CreateCompanyForm` com validação inline e redirect em `apps/web/src/features/admin/components/CreateCompanyForm.tsx`
- [x] T019 [US1] Criar página `/admin/companies/new` com breadcrumb em `apps/web/src/app/(admin)/admin/companies/new/page.tsx`
- [x] T020 [US1] Adicionar botão/link "Nova empresa" no topo em `apps/web/src/app/(admin)/admin/page.tsx`
- [x] T021 [US1] Exibir campos cadastrais opcionais no `CompanyOverview` quando presentes em `apps/web/src/features/admin/components/CompanyOverview.tsx`

**Checkpoint**: User Story 1 funcional e validável independentemente (MVP da spec 004).

---

## Phase 4: User Story 2 - Importar planilha com Valor Unitário e métricas financeiras (Priority: P2)

**Goal**: coluna "Valor Unitário" na planilha; cálculo e persistência server-side das três métricas por linha no worker.

**Independent Test**: importar planilha com "Valor Unitário" → linhas válidas com `unit_price` e três inteiros corretos no banco; linha inválida gera erro pt-BR sem bloquear demais linhas.

### Implementation for User Story 2

- [x] T022 [US2] Adicionar `'Valor Unitário'` → `unit_price` em `packages/shared/src/sheet-mapping.ts`
- [x] T023 [US2] Atualizar `SPREADSHEET_HEADERS` (12 colunas), `mapRawRow`, `spreadsheetRowSchema` e mensagens pt-BR via `toValidationErrors` para `unit_price`, `stock` e `average_demand` em `packages/shared/src/spreadsheetTemplate.ts`
- [x] T024 [US2] Estender `ParsedProductRow` com `unitPrice` e garantir erros acionáveis por coluna em pt-BR em `apps/worker/src/services/spreadsheet-parser-service.ts`
- [x] T025 [US2] Chamar `calculateFinancialMetrics` e incluir quatro campos no `INSERT` em `apps/worker/src/jobs/process-import.ts`
- [x] T026 [US2] Mapear `unitPrice`, `projectedRevenue`, `tiedUpCapital`, `lostRevenue` em `apps/api/src/lib/mappers.ts` (`toStockProductDto`)
- [x] T027 [P] [US2] Adicionar colunas de ordenação financeiras em `apps/api/src/repositories/stock-product-repository.ts` (`SORT_COLUMNS`)
- [x] T028 [US2] Documentar breaking change 11→12 colunas e ordem do cabeçalho em `specs/004-company-finance-cadastro/quickstart.md` (sem duplicar alterações de T023)

**Checkpoint**: importações novas persistem métricas financeiras; fórmulas existem apenas em `financial-metrics.ts`.

---

## Phase 5: User Story 3 - Colunas financeiras e layout sem scroll horizontal (Priority: P3)

**Goal**: quatro colunas monetárias na tabela (`formatUnitPrice` com 2 decimais; `formatCurrency` sem decimais para métricas); dashboard sem overflow horizontal em ≥1280px.

**Independent Test**: dashboard com dados importados mostra Valor Unitário + 3 métricas em R$; em 1280px não há scroll horizontal na página.

### Implementation for User Story 3

- [x] T029 [US3] Implementar `formatCurrency` (0 decimais) e `formatUnitPrice` (2 decimais), Intl `pt-BR` / `BRL`, em `apps/web/src/lib/formatters.ts`
- [x] T030 [US3] Adicionar colunas Valor Unitário, Faturamento Projetado, Capital Imobilizado e Faturamento Perdido em `apps/web/src/components/client/ProductTable.tsx`
- [x] T031 [P] [US3] Aplicar `formatUnitPrice` em `unitPrice` e `formatCurrency` nas três métricas; cabeçalhos com `title` para labels abreviados em `apps/web/src/components/client/ProductTable.tsx`
- [x] T032 [US3] Ajustar layout do container em `apps/web/src/app/(client)/dashboard/layout.tsx` (`max-w`, padding reduzido)
- [x] T033 [US3] Aplicar `min-w-0`, `overflow-x-hidden` e gap menor em `apps/web/src/components/client/DashboardView.tsx`
- [x] T034 [P] [US3] Ajustar largura da sidebar para não forçar overflow em `apps/web/src/components/client/FilterSidebar.tsx`
- [x] T035 [US3] Compactar tabela (`table-fixed`, padding menor, `truncate`, remover `overflow-x-auto`) em `apps/web/src/components/client/ProductTable.tsx`
- [x] T036 [US3] Validar ordenação/paginação com novas colunas em `apps/web/src/components/client/ProductTable.tsx` e `apps/web/src/store/dashboardStore.ts`

**Checkpoint**: User Stories 1–3 completas e validáveis via `quickstart.md`.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: validação final, typecheck e alinhamento de contratos.

- [x] T037 [P] Atualizar contrato OpenAPI com campos financeiros em `GET /api/client/products` em `specs/004-company-finance-cadastro/contracts/api.openapi.yaml`
- [x] T038 Executar `pnpm --filter @prudens/domain-metrics test` e corrigir falhas
- [x] T039 [P] Executar `pnpm --filter @prudens/api typecheck` e `pnpm --filter @prudens/worker typecheck`
- [x] T040 [P] Executar `pnpm --filter @prudens/web typecheck` e corrigir falhas
- [x] T041 Validar fluxo completo seguindo `specs/004-company-finance-cadastro/quickstart.md` (criar empresa → import → dashboard cliente em 1280px)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: pode iniciar imediatamente
- **Phase 2 (Foundational)**: depende de Phase 1 — **bloqueia US1, US2 e US3**
- **Phase 3 (US1)**: depende de Phase 2 (migration `0003` + tipos)
- **Phase 4 (US2)**: depende de Phase 2 (migration `0004`, `financial-metrics`, tipos); empresa existente (US1 ou seed) para testar import
- **Phase 5 (US3)**: depende de Phase 2 (tipos/DTO) e dados de US2 para validação visual completa
- **Phase 6 (Polish)**: após histórias desejadas concluídas

### User Story Dependencies

| Story | Depende de | Independente após |
|-------|------------|-------------------|
| US1 (P1) | Foundational (`0003`, tipos empresa) | Sim — MVP sem planilha nova |
| US2 (P2) | Foundational (`0004`, financial-metrics) | Sim — com empresa para import |
| US3 (P3) | US2 para dados reais; tipos desde Foundational | Sim — layout testável com mock/null |

### Within Each User Story

- Repository antes de Service antes de Route (API)
- Schema Zod cliente antes de submit no formulário
- Parser/planilha antes de worker INSERT
- `formatCurrency` antes de colunas na tabela

### Parallel Opportunities

- **Phase 1**: T002 ∥ T003
- **Phase 2**: T008 ∥ T010 ∥ T011 ∥ T013 (após T007/T009)
- **US1**: T017 ∥ (após T016)
- **US2**: T027 ∥ (após T026)
- **US3**: T031 ∥ T032 ∥ T034 (após T029; T034 = FilterSidebar)
- **Polish**: T037 ∥ T039 ∥ T040

---

## Parallel Example: User Story 2

```bash
# Após T022–T024 concluídos, em paralelo:
Task T026: "Mapear campos financeiros em apps/api/src/lib/mappers.ts"
Task T027: "SORT_COLUMNS em apps/api/src/repositories/stock-product-repository.ts"
```

---

## Parallel Example: User Story 3

```bash
# Após T029:
Task T032: "dashboard/layout.tsx"
Task T033: "DashboardView.tsx"
Task T034: "FilterSidebar.tsx"
# Depois T035–T036 em ProductTable.tsx (mesmo arquivo — sequencial)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 + Phase 2 (migrations empresa + financial base mínima se US2 adiado — **mínimo**: `0003` + tipos; adiar `0004` só se MVP estrito for só cadastro)
2. Phase 3 (US1) completa
3. **Validar**: criar empresa → redirect imports
4. Demo/deploy parcial

> Para MVP estrito só cadastro: executar T004–T007, T013 (parcial), T014–T021; adiar T005–T012 e fases US2/US3.

### Incremental Delivery

1. Foundational completo
2. US1 → cadastro empresa
3. US2 → planilha + métricas
4. US3 → UI cliente + layout
5. Polish + quickstart

### Parallel Team Strategy

1. Time conclui Phase 2 junto
2. Dev A: US1 | Dev B: US2 (parser/worker) | Dev C: US3 (formatters/layout) após tipos em Foundational
3. US3 integração final quando US2 gerar dados

---

## Notes

- Fórmulas financeiras **somente** em `packages/domain-metrics/src/financial-metrics.ts`; `apps/api/src/services/financial.service.ts` é re-export (sem lógica duplicada).
- Mapeamento de colunas **somente** em `packages/shared/src/sheet-mapping.ts`.
- Moeda na UI: `formatCurrency` e `formatUnitPrice` **somente** em `apps/web/src/lib/formatters.ts`.
- Migrations são `ADD COLUMN` nullable — dados legados intactos.
- Planilha padrão: **12 colunas** (breaking change); ver quickstart.
- Formulário nova empresa: página dedicada `/admin/companies/new` (não modal).
- Total de tarefas: **41** (Setup: 3, Foundational: 10, US1: 8, US2: 7, US3: 8, Polish: 5).
