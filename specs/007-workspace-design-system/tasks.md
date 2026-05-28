# Tasks: Sistema de Design Workspace — Prudens Index

**Input**: Design documents from `/specs/007-workspace-design-system/`  
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/design-tokens.yaml`, `contracts/api.openapi.yaml`, `quickstart.md`

**Tests**: Validação manual via `quickstart.md` (spec não exige TDD automatizado para UI).

**Organization**: Tarefas agrupadas por user story (`US1`–`US5`) para implementação e validação independentes.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependência de tarefa incompleta)
- **[Story]**: Mapeia à user story da spec (`US1`–`US5`)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: tokens, strings e utilitários compartilhados antes do shell e das telas.

- [x] T001 Criar `apps/web/src/styles/design-tokens.css` com paleta, tipografia e `@theme` Tailwind v4 conforme `specs/007-workspace-design-system/contracts/design-tokens.yaml`
- [x] T002 Importar `design-tokens.css` em `apps/web/src/app/globals.css` e remover classes `slate-*` do `body` em `apps/web/src/app/layout.tsx`
- [x] T003 [P] Adicionar strings pt-BR de navegação, filtros, entrada (Admin/Cliente) e mensagens de mismatch de perfil em `apps/web/src/lib/strings.ts`
- [x] T004 [P] Criar `apps/web/src/lib/idd-display.ts` com helpers de cor IDD (hero card, tabela, badges) conforme FR-002 e spec

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: fontes, componentes de layout base e `AuthLayout` — **bloqueia todas as user stories**.

**⚠️ CRITICAL**: Nenhuma user story deve ser considerada completa sem esta fase.

- [x] T005 Configurar `next/font/google` (Plus Jakarta Sans, Inter, JetBrains Mono) e variáveis CSS em `apps/web/src/app/layout.tsx`
- [x] T006 [P] Implementar `Logo.tsx` (variantes `onDark` / `onLight`) em `apps/web/src/components/layout/Logo.tsx`
- [x] T007 [P] Implementar `PageHeader.tsx` (título 18px/500, subtítulo 13px `#6b7280`, gap 24px) em `apps/web/src/components/layout/PageHeader.tsx`
- [x] T008 [P] Implementar `useSidebarCollapsed.ts` com chave `prudens.sidebar.collapsed` em `apps/web/src/hooks/useSidebarCollapsed.ts`
- [x] T009 Implementar `AuthLayout.tsx` (fundo `#f5f5f3`, card `#ffffff`, borda 0.5px, logo) em `apps/web/src/components/layout/AuthLayout.tsx`
- [x] T010 Criar `(auth)/layout.tsx` aplicando `AuthLayout` em `apps/web/src/app/(auth)/layout.tsx`

**Checkpoint**: tokens, fontes e wrappers de layout prontos.

---

## Phase 3: User Story 4 — Tela de entrada Admin ou Cliente (Priority: P1)

**Goal**: `/sign-in` como única porta pública com seletor Admin/Cliente, só e-mail/senha, sem link de cadastro.

**Independent Test**: Acessar `/sign-in` deslogado → seletor visível com cores distintas → login admin/cliente correto redireciona; perfil errado mostra mensagem pt-BR; zero CTAs de sign-up.

### Implementation for User Story 4

- [x] T011 [P] [US4] Implementar `EntryProfileSelector.tsx` (tiles Admin `#1a4731` / Cliente `#d4a020`) em `apps/web/src/components/auth/EntryProfileSelector.tsx`
- [x] T012 [US4] Implementar `SignInEntry.tsx` (estado `selectedProfile`, Clerk `SignIn`, validação pós-login vs `parseRoleFromSessionClaims`; redirect com `homePathForRole`: admin → `/admin/imports`, client → `/dashboard`) em `apps/web/src/components/auth/SignInEntry.tsx`
- [x] T013 [US4] Substituir conteúdo de `apps/web/src/app/(auth)/sign-in/[[...sign-in]]/page.tsx` para usar `SignInEntry` (ocultar OAuth, `footerActionLink`, sem `signUpUrl`)
- [x] T014 [P] [US4] Centralizar `authAppearance` Clerk (primária `#1a4731`) em `apps/web/src/lib/clerk-appearance.ts` e reutilizar em sign-in/sign-up
- [x] T015 [US4] Atualizar `apps/web/src/app/page.tsx` para redirecionar não autenticados a `/sign-in` (manter redirect por `homePathForRole` quando autenticado)
- [x] T015b [US4] Garantir redirect de visitantes não autenticados para `/sign-in` em `apps/web/src/middleware.ts` (FR-020; alinhar com `plan.md` wave 5b)
- [x] T016 [P] [US4] Restylar `apps/web/src/app/(auth)/acesso-pendente/page.tsx` com tokens; remover referência promocional a cadastro público em `sign-up` (orientar apenas link de convite)
- [x] T017 [P] [US4] Aplicar `AuthLayout` + `authAppearance` em `apps/web/src/app/(auth)/sign-up/[[...sign-up]]/page.tsx` (rota só convite; sem link na entrada)

**Checkpoint**: fluxo de entrada conforme FR-020–FR-025 e spec 005 (invite-only).

---

## Phase 4: User Story 1 — Navegação e identidade consistentes (Priority: P1) 🎯 MVP shell

**Goal**: sidebar 220/64px colapsável, bottom nav mobile, nav por perfil, `PageHeader` em páginas autenticadas.

**Independent Test**: Qualquer rota autenticada admin/cliente exibe shell, logo, item ativo, colapso persistido, sem scroll horizontal ≥1280px.

### Implementation for User Story 1

- [x] T018 [P] [US1] Implementar `SidebarNavItem.tsx`, mapa de rotas por perfil em `apps/web/src/lib/navigation.ts` e metadados `PageHeader` por rota em `apps/web/src/lib/page-meta.ts` (FR-009)
- [x] T019 [US1] Implementar `Sidebar.tsx` (220px/64px, transição 200ms, rodapé colapsar, tooltips quando colapsada, foco por teclado e `aria-label` nos ícones colapsados) em `apps/web/src/components/layout/Sidebar.tsx`
- [x] T020 [P] [US1] Implementar `MobileBottomNav.tsx` (alvos de toque ≥44px, `aria-current` no item ativo) em `apps/web/src/components/layout/MobileBottomNav.tsx`
- [x] T021 [US1] Implementar `AppShell.tsx` (duas colunas, main `max-w-[1280px]`, fundo `#f5f5f3`, renderizar `PageHeader` via `resolvePageMeta(pathname)` em `apps/web/src/lib/page-meta.ts`) em `apps/web/src/components/layout/AppShell.tsx`
- [x] T022 [US1] Integrar `AppShell` em `apps/web/src/app/(client)/dashboard/layout.tsx` (remover header legado; título/subtítulo somente via `page-meta.ts`, sem header duplicado na página)
- [x] T023 [US1] Integrar `AppShell` em `apps/web/src/app/(admin)/admin/layout.tsx` (substituir nav horizontal atual)
- [x] T024 [US1] Completar `apps/web/src/lib/page-meta.ts` e `resolvePageMeta(pathname)` com matching por segmentos (rotas estáticas exatas + padrões `/admin/companies/:id` e `/admin/companies/:id/imports`); entradas para FR-009/FR-016; títulos/subtítulos pt-BR em `strings.ts`

**Checkpoint**: User Story 1 — shell navegável admin e cliente.

---

## Phase 5: User Story 2 — Dashboard do cliente (Priority: P1)

**Goal**: card IDD hero, gráfico, filtros horizontais colapsáveis sincronizados com API, tabela densa e paginação.

**Independent Test**: `quickstart.md` §3 — filtros afetam gráfico e tabela; sticky header; cores IDD/status.

### Implementation for User Story 2

- [x] T025 [US2] Estender `ProductQueryParams` e `buildWhere` com `idd_min/max`, `stock_days_min/max`, `tied_up_capital_min/max` em `apps/api/src/repositories/stock-product-repository.ts`
- [x] T026 [US2] Estender Zod query schema em `apps/api/src/routes/client-products.ts` com `idd_min/max` (−100..100), `stock_days_min/max`, `tied_up_capital_min/max` e `.refine()` garantindo `min ≤ max` por par; retornar 400 pt-BR em range inválido (contrato `api.openapi.yaml`); repassar ao service em `client-products-service.ts` (Route → Service → Repository)
- [x] T027 [P] [US2] Estender `buildProductsQuery` e estado de filtros (`iddMin`, `iddMax`, `stockDaysMin`, `stockDaysMax`, `tiedUpCapitalMin/Max`, `tiedUpCapitalMax` derivado do maior valor nos produtos carregados, `filtersPanelOpen`, `hasActiveFilters`) em `apps/web/src/store/dashboardStore.ts`
- [x] T028 [P] [US2] Propagar novos query params e mesma validação Zod de ranges em `apps/api/src/routes/client-export.ts` e `apps/web/src/components/client/ExportButton.tsx`
- [x] T029 [US2] Restylar hero IDD em `apps/web/src/components/client/IndexHeader.tsx` (fundo `#1a4731`, mono 32px, cores hero)
- [x] T030 [P] [US2] Restylar `apps/web/src/components/client/IddBarChart.tsx` (cores status, sem legenda, tooltip com %)
- [x] T031 [US2] Criar `FilterBar.tsx` colapsável horizontal com busca, checkboxes de status com **ponto colorido** por status (FR-012), sliders IDD/dias/capital e botão "Limpar filtros" em `apps/web/src/components/client/FilterBar.tsx`
- [x] T032 [US2] Refatorar `apps/web/src/components/client/DashboardView.tsx` (layout vertical: card → filtros → gráfico → tabela; remover `FilterSidebar`; após `setInitial`/refetch, atualizar `tiedUpCapitalMax` no store a partir dos itens retornados)
- [x] T033 [P] [US2] Criar `StatusBadge.tsx` em `apps/web/src/components/shared/StatusBadge.tsx`
- [x] T034 [US2] Restylar `apps/web/src/components/client/ProductTable.tsx` (sticky header, 40px, mono, %, R$, cores IDD, badges)
- [x] T035 [P] [US2] Restylar `apps/web/src/components/shared/Pagination.tsx` (primeira/anterior/numerada/próxima/última; contador acima da tabela)
- [x] T036 [US2] Remover ou deprecar `apps/web/src/components/client/FilterSidebar.tsx` após migração para `FilterBar.tsx`

**Checkpoint**: dashboard cliente conforme FR-010–FR-013.

---

## Phase 6: User Story 3 — Painel administrativo (Priority: P2)

**Goal**: métricas, grid de empresas, detalhe, usuários, imports e formulários com tokens do design system.

**Independent Test**: Percorrer rotas admin do `quickstart.md` §4 com shell US1 e cards/tabelas alinhados.

### Implementation for User Story 3

- [x] T037 [P] [US3] Restylar `apps/web/src/components/admin/MetricsPanel.tsx` (fundo `#f5f5f3`, borda 0.5px, sem shadow)
- [x] T038 [P] [US3] Restylar `apps/web/src/components/admin/CompanyCard.tsx` e `CompanySearch.tsx` (IDD condicional, grid; busca client-side responsiva — meta percebida menor que 1s até ~500 empresas, edge case spec)
- [x] T039 [US3] Atualizar `apps/web/src/app/(admin)/admin/page.tsx` com layout de grid de empresas (PageHeader via `AppShell`/`page-meta.ts` — não duplicar header local)
- [x] T040 [US3] Restylar `apps/web/src/features/admin/components/CompanyOverview.tsx` e `apps/web/src/app/(admin)/admin/companies/[id]/page.tsx`
- [x] T041 [P] [US3] Restylar `apps/web/src/components/ImportStatusPanel.tsx` e páginas `apps/web/src/app/(admin)/admin/imports/page.tsx` e `companies/[id]/imports/page.tsx`
- [x] T042 [P] [US3] Restylar `apps/web/src/features/admin/components/UsersPage.tsx`, `UsersTable.tsx`, `InviteUserForm.tsx`, `EditUserPanel.tsx` e `usuarios/page.tsx`
- [x] T043 [US3] Restylar `CreateCompanyForm.tsx`, `ImportUploadForm.tsx`, `ValidationErrorList.tsx` e `companies/new/page.tsx`
- [x] T044 [P] [US3] Ajustar `apps/web/src/components/shared/Breadcrumb.tsx` para tokens (sem `slate-*`)

**Checkpoint**: painel admin visualmente unificado com cliente.

---

## Phase 7: User Story 5 — Tema claro e restrições globais (Priority: P2)

**Goal**: sem dark mode, sem shadows/gradientes decorativos, paleta consistente em todas as rotas.

**Independent Test**: Auditoria `quickstart.md` §1 e §8; SC-006.

### Implementation for User Story 5

- [x] T045 [US5] Forçar tema claro em `apps/web/src/app/layout.tsx` (`className` no `<html>`, sem `dark:` dependente de SO)
- [x] T046 [P] [US5] Auditar e remover `shadow-*`, `bg-gradient-*` e `slate-*` residuais em `apps/web/src/**/*.tsx` (grep + substituir por tokens)
- [x] T047 [US5] Restylar landing `apps/web/src/app/page.tsx` (redirecionamento) e garantir `apps/web/src/components/LoadingBlock.tsx` usa tokens
- [x] T048 [P] [US5] Garantir CTAs globais (`AuthSignOutButton.tsx`, botões primários) usam `#1a4731` em `apps/web/src/components/AuthSignOutButton.tsx`

**Checkpoint**: conformidade FR-004 e FR-017.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: validação final e qualidade.

- [ ] T049 Executar roteiro completo em `specs/007-workspace-design-system/quickstart.md` (desktop 1280px + mobile), incluindo FR-018: Tab na sidebar colapsada, Enter no seletor Admin/Cliente, foco visível nos filtros
- [x] T050 [P] Executar `pnpm --filter @prudens/web typecheck` e `pnpm --filter @prudens/web lint`
- [x] T051 [P] Executar `pnpm --filter @prudens/api typecheck` após alterações em `client-products` / repository
- [ ] T052 Capturar checklist visual por rota (tabela em quickstart §6), confirmar `PageHeader` em cada rota de `page-meta.ts`, SC-007/SC-008 na entrada, e corrigir desvios encontrados

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)** → **Phase 2 (Foundational)** → User stories
- **US4 (Phase 3)** pode iniciar logo após Phase 2 (não depende de `AppShell`)
- **US1 (Phase 4)** depende de Phase 2; recomendado antes de US2 para client layout
- **US2 (Phase 5)** depende de Phase 2; integração completa depende de US1 para shell cliente
- **US3 (Phase 6)** depende de US1 (shell admin)
- **US5 (Phase 7)** pode overlap com US3; concluir após telas principais
- **Phase 8** depende das stories desejadas para release

### User Story Dependencies

| Story | Depende de | Pode testar independentemente após |
|-------|------------|-----------------------------------|
| US4 | Phase 2 | Phase 3 completa |
| US1 | Phase 2 | Phase 4 completa |
| US2 | Phase 2; ideal US1 | Phase 5 completa (dados + API) |
| US3 | US1 | Phase 6 completa |
| US5 | US1–US3 (auditoria) | Phase 7 completa |

### Within US2 (API — constitution order)

`client-products.ts` (Route/Zod) → `client-products-service.ts` → `stock-product-repository.ts`

### Parallel Opportunities

- **Phase 1**: T003 ∥ T004
- **Phase 2**: T006 ∥ T007 ∥ T008
- **Phase 3**: T011 ∥ T014; T015 ∥ T015b; T016 ∥ T017
- **Phase 4**: T018 ∥ T020; T024 após T021
- **Phase 5**: T027 ∥ T028 ∥ T030 ∥ T033 ∥ T035 (após T025–T026)
- **Phase 6**: T037 ∥ T038 ∥ T041 ∥ T042 ∥ T044
- **Phase 7**: T046 ∥ T048
- **Phase 8**: T050 ∥ T051

---

## Parallel Example: User Story 4

```bash
# Após T010:
Task T011: EntryProfileSelector.tsx
Task T014: clerk-appearance.ts

# Depois:
Task T012: SignInEntry.tsx (depende T011)
Task T013: sign-in page.tsx
```

---

## Parallel Example: User Story 2

```bash
# Backend primeiro (sequencial T025 → T026):
# Depois em paralelo:
Task T027: dashboardStore.ts
Task T029: IndexHeader.tsx
Task T030: IddBarChart.tsx
Task T033: StatusBadge.tsx

# Integração:
Task T031 → T032 → T034
```

---

## Implementation Strategy

### MVP First (entrada + shell)

1. Phase 1 + Phase 2 (fundação)
2. Phase 3 (US4 — login Admin/Cliente)
3. Phase 4 (US1 — shell)
4. **STOP**: validar `/sign-in` + uma rota admin e `/dashboard` com shell

### Entrega incremental

1. US4 + US1 → navegação e acesso
2. US2 → dashboard cliente (valor principal)
3. US3 → admin
4. US5 + Phase 8 → auditoria e release

### Suggested MVP scope

**US4 + US1** (Phases 1–4): entrada clara e app autenticado com identidade Prudens.  
**US2** como segundo incremento obrigatório para spec P1 completa.

---

## Notes

- `/sign-up` **não** é removida — apenas desvinculada da UI de `/sign-in` (spec 005).
- Filtros numéricos exigem mesma cláusula `WHERE` em `countFiltered`, `findFiltered` e `chartData`.
- Conflitos com spec 003: prevalece 007 para estilo; manter comportamentos funcionais (tooltip, paginação, pt-BR).
- Total de tarefas: **53** (T001–T015, T015b, T016–T052). `T015b` é ID legado da análise (middleware); manter para não renumerar dependências.

---

## Task Count Summary

| Phase | Story | Tasks | IDs |
|-------|-------|------:|-----|
| 1 Setup | — | 4 | T001–T004 |
| 2 Foundational | — | 6 | T005–T010 |
| 3 | US4 Login | 8 | T011–T017, T015b |
| 4 | US1 Nav | 7 | T018–T024 |
| 5 | US2 Dashboard | 12 | T025–T036 |
| 6 | US3 Admin | 8 | T037–T044 |
| 7 | US5 Theme | 4 | T045–T048 |
| 8 Polish | — | 4 | T049–T052 |
| **Total** | | **53** | |
