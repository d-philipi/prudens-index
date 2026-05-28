# Tasks: Correções de Usabilidade e Idioma da UI

**Input**: Design documents from `/specs/003-fix-ui-usability/`  
**Prerequisites**: `plan.md` (required), `spec.md` (required), `research.md`, `data-model.md`, `contracts/api.openapi.yaml`, `quickstart.md`

**Tests**: Não foram solicitadas tarefas de TDD explícitas na spec; validação será feita pelos critérios independentes de cada user story e pelo `quickstart.md`.

**Organization**: Tasks agrupadas por user story para implementação e validação independentes.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependência de tarefa incompleta)
- **[Story]**: Mapeia a tarefa à user story (`US1`, `US2`, `US3`)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: preparar artefatos compartilhados e contratos base para execução das histórias.

- [X] T001 Criar catálogo central de textos em `apps/web/src/lib/strings.ts` com domínios `common`, `admin`, `client`, `errors` e `status`
- [X] T002 [P] Criar função pura de cor por status em `apps/web/src/lib/status-colors.ts` e reexportar compatibilidade com `apps/web/src/lib/item-status-chart-colors.ts`
- [X] T003 [P] Criar função pura `formatPercent` em `apps/web/src/lib/formatters.ts`
- [X] T004 [P] Criar componente compartilhado de navegação em `apps/web/src/components/shared/Breadcrumb.tsx`
- [X] T005 [P] Criar componente compartilhado de paginação em `apps/web/src/components/shared/Pagination.tsx`
- [X] T006 [P] Criar componente `ValidationErrorList` em `apps/web/src/components/admin/ValidationErrorList.tsx`
- [X] T007 [P] Criar componente `CompanyOverview` em `apps/web/src/features/admin/components/CompanyOverview.tsx`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: estabelecer base de dados, tipos e endpoints bloqueantes para todas as histórias.

**⚠️ CRITICAL**: Nenhuma user story deve ser finalizada sem esta fase concluída.

- [X] T008 Criar migration para persistência de erros estruturados em `apps/api/drizzle/migrations/0002_import_validation_errors.sql`
- [X] T009 Atualizar schema `import_jobs` com campo `validation_errors` em `apps/api/drizzle/schema/import-jobs.ts`
- [X] T010 [P] Atualizar tipos compartilhados para erros estruturados e overview admin em `packages/shared/src/types/index.ts`
- [X] T011 [P] Consolidar acesso canônico ao mapeamento de colunas em `apps/api/src/lib/sheet-mapping.ts`
- [X] T012 Implementar leitura/escrita de `validation_errors` no repositório em `apps/api/src/repositories/import-job-repository.ts`
- [X] T013 [P] Criar serviço de erros de import em `apps/api/src/services/import-errors-service.ts`
- [X] T014 Implementar rota `GET /api/admin/companies/:id/jobs/:jobId/errors` em `apps/api/src/routes/admin-imports.ts` seguindo Route → Service → Repository
- [X] T015 Integrar rota/serviço no bootstrap de API em `apps/api/src/server.ts`

**Checkpoint**: base de persistência e contrato de erros disponíveis para implementação das histórias.

---

## Phase 3: User Story 1 - Corrigir mensagens e idioma na UI + erros acionáveis (Priority: P1) 🎯 MVP

**Goal**: garantir 100% de copy visível em pt-BR e relatório de erros de planilha detalhado, acionável e disponível na aba de imports.

**Independent Test**: importar planilha com linhas válidas/ inválidas e navegar por admin/cliente sem strings em inglês; validar lista de erros com linha, coluna e motivo em português.

### Implementation for User Story 1

- [X] T016 [US1] Refatorar parser para produzir erros estruturados (`row_number`, `column_name`, `error_message`) em `apps/worker/src/services/spreadsheet-parser-service.ts`
- [X] T017 [US1] Persistir erros estruturados no job e resumir status em pt-BR em `apps/worker/src/jobs/process-import.ts`
- [X] T018 [US1] Atualizar mapeadores de DTO para expor erros estruturados quando necessário em `apps/api/src/lib/mappers.ts`
- [X] T019 [US1] Consumir endpoint de erros e renderizar `ValidationErrorList` em `apps/web/src/components/ImportStatusPanel.tsx`
- [X] T020 [US1] Atualizar tela de imports para exibir relatório detalhado por empresa/job em `apps/web/src/app/(admin)/admin/imports/page.tsx`
- [X] T021 [P] [US1] Substituir textos hardcoded por `strings` em `apps/web/src/components/ImportUploadForm.tsx`
- [X] T022 [P] [US1] Substituir textos hardcoded por `strings` em `apps/web/src/components/ImportStatusPanel.tsx`
- [X] T023 [P] [US1] Substituir textos hardcoded por `strings` em `apps/web/src/components/client/IddBarChart.tsx`
- [X] T024 [P] [US1] Substituir textos hardcoded por `strings` em `apps/web/src/components/client/ProductTable.tsx`
- [X] T025 [P] [US1] Substituir textos hardcoded por `strings` em `apps/web/src/app/(admin)/admin/imports/page.tsx`
- [X] T026 [P] [US1] Substituir textos hardcoded por `strings` em `apps/web/src/app/(admin)/admin/page.tsx`
- [X] T027 [US1] Inventariar e substituir textos visíveis remanescentes em telas admin/cliente para atingir cobertura total de pt-BR em `apps/web/src/**/*.{ts,tsx}`
- [X] T028 [US1] Garantir campos explícitos de esperado/recebido no erro estruturado (`expected_value`, `received_value`) em `apps/worker/src/services/spreadsheet-parser-service.ts` e `packages/shared/src/types/index.ts`

**Checkpoint**: User Story 1 funcional e validável independentemente (MVP da spec 003).

---

## Phase 4: User Story 2 - Navegação e contexto no admin (Priority: P2)

**Goal**: padronizar navegação hierárquica com breadcrumb e manter contexto da empresa visível no detalhe e imports.

**Independent Test**: validar breadcrumbs clicáveis em listagem/detalhe/imports, botão “Voltar para empresas” e seção `CompanyOverview` fixa no topo.

### Implementation for User Story 2

- [X] T029 [US2] Aplicar `Breadcrumb` como primeiro bloco visual em `apps/web/src/app/(admin)/admin/page.tsx`
- [X] T030 [US2] Aplicar `Breadcrumb` e `CompanyOverview` no detalhe da empresa em `apps/web/src/app/(admin)/admin/companies/[id]/page.tsx`
- [X] T031 [US2] Criar rota/página primária de imports por empresa com breadcrumb hierárquico em `apps/web/src/app/(admin)/admin/companies/[id]/imports/page.tsx`
- [X] T032 [US2] Manter `apps/web/src/app/(admin)/admin/imports/page.tsx` como fluxo global de suporte com navegação para rota primária por empresa
- [X] T033 [US2] Adicionar botão “Voltar para empresas” com navegação Next em `apps/web/src/app/(admin)/admin/companies/[id]/imports/page.tsx`
- [X] T034 [US2] Estender `GET /api/admin/companies/:id` com `stats.totalProducts`, `stats.avgIdd`, `stats.lastUpdatedAt` e `company.metadata` em `apps/api/src/services/admin-company-service.ts`
- [X] T035 [US2] Atualizar repositório de empresas para suportar métricas e dados cadastrais de overview em `apps/api/src/repositories/company-repository.ts`
- [X] T036 [US2] Ajustar contrato/tipos do detalhe admin com novos campos em `packages/shared/src/types/index.ts`

**Checkpoint**: User Stories 1 e 2 operam independentemente com navegação admin completa.

---

## Phase 5: User Story 3 - Melhorar gráfico e tabela no cliente (Priority: P3)

**Goal**: melhorar legibilidade analítica no dashboard cliente com gráfico sem legenda, tooltip útil, cores canônicas, paginação completa, sticky header e percentuais consistentes.

**Independent Test**: em dataset grande, validar tooltip/cor no gráfico, paginação completa e sticky header na tabela, com `%` em cabeçalhos e células das colunas definidas.

### Implementation for User Story 3

- [X] T037 [US3] Remover legenda, configurar tooltip com nome+IDD% e usar `getStatusColor` em `apps/web/src/components/client/IddBarChart.tsx`
- [X] T038 [US3] Aplicar cor por status na coluna de status (badge/ponto) da tabela usando `getStatusColor` em `apps/web/src/components/client/ProductTable.tsx`
- [X] T039 [US3] Evoluir estado de paginação no Zustand (`currentPage`, `totalPages`, reset por filtro) em `apps/web/src/store/dashboardStore.ts`
- [X] T040 [US3] Atualizar query client products para paginação por página mantendo filtros/sort em `apps/api/src/routes/client-products.ts`
- [X] T041 [US3] Implementar paginação por página e metadados de total no serviço em `apps/api/src/services/client-products-service.ts`
- [X] T042 [US3] Ajustar repositório para suportar paginação completa com contagem total em `apps/api/src/repositories/stock-product-repository.ts`
- [X] T043 [US3] Integrar componente `Pagination` na tabela em `apps/web/src/components/client/ProductTable.tsx`
- [X] T044 [US3] Aplicar cabeçalho sticky com alinhamento consistente da grade em `apps/web/src/components/client/ProductTable.tsx`
- [X] T045 [US3] Aplicar `formatPercent` nas colunas Distribuição, Demanda x Dist. e IDD em `apps/web/src/components/client/ProductTable.tsx`
- [X] T046 [US3] Atualizar `DashboardView` para orquestrar paginação/filtros/sort com store revisada em `apps/web/src/components/client/DashboardView.tsx`

**Checkpoint**: todas as user stories completas e independentes.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: finalizar consistência transversal, contrato e validação final da feature.

- [X] T047 [P] Atualizar contrato OpenAPI do endpoint `GET /api/admin/companies/{id}/jobs/{jobId}/errors` e schema final de erro estruturado em `specs/003-fix-ui-usability/contracts/api.openapi.yaml`
- [X] T048 [P] Atualizar `quickstart.md` com passos e exemplos finais de validação em `specs/003-fix-ui-usability/quickstart.md`
- [X] T049 Executar checklist manual completo da spec 003 e registrar evidências em `specs/003-fix-ui-usability/checklists/requirements.md`
- [X] T050 Rodar validação integrada dos fluxos admin/cliente/imports e ajustar regressões de copy pt-BR em `apps/web/src/lib/strings.ts`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: inicia imediatamente
- **Phase 2 (Foundational)**: depende de Phase 1 e bloqueia todas as user stories
- **Phase 3 (US1)**: depende de Phase 2
- **Phase 4 (US2)**: depende de Phase 2 (pode iniciar após US1 MVP ou em paralelo com equipe separada)
- **Phase 5 (US3)**: depende de Phase 2 (ideal após US1 para reaproveitar `strings`/utilitários)
- **Phase 6 (Polish)**: depende das fases US1, US2 e US3 concluídas

### User Story Dependencies

- **US1 (P1)**: independente após foundational; define MVP
- **US2 (P2)**: independente funcionalmente; consome tipos/overview estendidos
- **US3 (P3)**: independente funcionalmente; compartilha utilitários comuns criados no setup

### Within Each User Story

- Backend de dados/contrato antes da renderização final de UI
- Componentes compartilhados antes de páginas consumidoras
- Store e API de paginação antes da integração da tabela

### Parallel Opportunities

- Setup paralelizável: T002, T003, T004, T005, T006, T007
- Foundational paralelizável: T010, T011, T013
- US1 paralelizável: T021–T026
- Polish paralelizável: T047, T048

---

## Parallel Example: User Story 1

```bash
# Refatorações de copy em paralelo (após contrato de strings pronto):
T021 apps/web/src/components/ImportUploadForm.tsx
T022 apps/web/src/components/ImportStatusPanel.tsx
T023 apps/web/src/components/client/IddBarChart.tsx
T024 apps/web/src/components/client/ProductTable.tsx
T025 apps/web/src/app/(admin)/admin/imports/page.tsx
T026 apps/web/src/app/(admin)/admin/page.tsx
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Concluir Phase 1 (Setup)
2. Concluir Phase 2 (Foundational)
3. Concluir Phase 3 (US1)
4. Validar independentemente pelo critério da US1 (import parcial + copy pt-BR)

### Incremental Delivery

1. Entregar MVP com US1
2. Adicionar US2 (navegação/contexto admin)
3. Adicionar US3 (gráfico/tabela cliente)
4. Finalizar com Phase 6 (polish e validação cruzada)

### Parallel Team Strategy

1. Time todo em Setup + Foundational
2. Após base pronta:
   - Dev A: US1 (worker/api imports + UI de erros)
   - Dev B: US2 (navegação admin + overview)
   - Dev C: US3 (dashboard cliente + paginação)

---

## Notes

- Todas as tarefas seguem formato checklist obrigatório com ID, labels e path explícito.
- Não há inclusão de novas bibliotecas; qualquer exceção exigiria justificativa explícita no plano.
- Toda string visível ao usuário final deve sair de `apps/web/src/lib/strings.ts`.
