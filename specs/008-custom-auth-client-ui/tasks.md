# Tasks: Autenticação Customizada, Dashboard do Cliente e Exportação de Planilha

**Input**: Design documents from `/specs/008-custom-auth-client-ui/`  
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/api.openapi.yaml`, `quickstart.md`

**Tests**: Vitest em `@prudens/domain-metrics` para truncagem (US6); demais validação manual via `quickstart.md`.

**Organization**: Tarefas por user story. **Ordem de execução recomendada** (plan.md): US6 → US7 → US3 → US1 → US2 → US4 → US5 → US8 (fases numeradas abaixo seguem essa ordem prática, não a ordem numérica das stories na spec).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependência de tarefa incompleta)
- **[Story]**: `US1`–`US8` conforme `spec.md`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: dependências, strings pt-BR, variáveis de ambiente e tipos compartilhados antes das stories.

- [x] T001 Documentar variáveis Clerk e R2 em `specs/008-custom-auth-client-ui/quickstart.md` (incluir `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login`, `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/accept-invite`, `CLERK_INVITE_REDIRECT_URL=.../accept-invite`)
- [x] T002 [P] Adicionar `@radix-ui/react-tooltip` em `apps/web/package.json` e instalar dependências (`pnpm install` na raiz)
- [x] T003 [P] Adicionar DTOs `ProductRangesResponse` e `ActiveFileExportResponse` em `packages/shared/src/types/index.ts` conforme `data-model.md`
- [x] T004 [P] Adicionar strings pt-BR (auth verify/invite, export, filtros, tooltips) em `apps/web/src/lib/strings.ts`
- [ ] T004a [P] Executar checklist **Configuração Clerk Dashboard** em `specs/008-custom-auth-client-ui/quickstart.md` (hosted pages off, OAuth off, convites, claim `publicMetadata`) — **bloqueante antes de US1/US2**
- [x] T005 [P] Criar componente Shadcn `Tooltip` em `apps/web/src/components/ui/tooltip.tsx` e envolver app com `TooltipProvider` em `apps/web/src/app/layout.tsx`

---

## Phase 2: User Story 6 — Demanda média truncada (Priority: P1) 🎯

**Goal**: Faturamento projetado, capital imobilizado e faturamento perdido usam `Math.floor(average_demand)` antes de qualquer cálculo.

**Independent Test**: `pnpm --filter @prudens/domain-metrics test` passa com casos 0.9→0, 1.9→1, 0.0→0; reimport opcional alinha linhas no banco.

### Tests for User Story 6

- [x] T006 [US6] Adicionar casos `it.each` (stock=100, unit_price=10) para demandas 0.9, 1.9 e 0.0 em `packages/domain-metrics/src/financial-metrics.test.ts`
- [x] T007 [US6] Atualizar casos existentes em `packages/domain-metrics/src/financial-metrics.test.ts` que conflitam com truncagem para baixo

### Implementation for User Story 6

- [x] T008 [US6] Implementar `flooredDemand = Math.floor(average_demand ?? 0)` e usar nas três fórmulas em `packages/domain-metrics/src/financial-metrics.ts`
- [x] T009 [US6] Confirmar `apps/api/src/services/financial.service.ts` re-exporta sem lógica duplicada
- [x] T010 [US6] Auditar grep `average_demand` / `projected_revenue` em `apps/` e `packages/` — garantir que métricas financeiras passam só por `calculateFinancialMetrics`
- [x] T011 [US6] Executar `pnpm --filter @prudens/domain-metrics test` até verde

**Checkpoint**: Worker (`apps/worker/src/jobs/process-import.ts`) herda fix automaticamente no próximo import.

---

## Phase 3: User Story 7 — Exportar planilha Excel ativa (Priority: P1)

**Goal**: Cliente baixa o `.xlsx` original do job ativo via URL assinada R2; botão substitui PDF.

**Independent Test**: `GET /api/client/export/active-file` com token client retorna 302 ou JSON `{ url, filename }`; download com nome `original_filename`; sem job ativo → 404 e botão desabilitado na UI.

### Implementation for User Story 7

- [x] T012 [P] [US7] Estender `getPresignedGetUrl(objectKey, expiresInSeconds)` em `apps/api/src/services/r2-storage-service.ts` (default 900, export usa 60)
- [x] T013 [US7] Implementar `client-export-service.ts` (`findActiveByCompany`, presigned URL, erros pt-BR) em `apps/api/src/services/client-export-service.ts`
- [x] T014 [US7] Substituir `POST /api/client/export-pdf` por `GET /api/client/export/active-file` em `apps/api/src/routes/client-export.ts` (302 preferido; fallback JSON documentado)
- [x] T015 [US7] Remover uso de `export-pdf-service.ts` em `apps/api/src/routes/client-export.ts` e deletar ou deprecar `apps/api/src/services/export-pdf-service.ts` se sem referências
- [x] T016 [P] [US7] Implementar `ExportButton` (idle/loading 10s/disabled + tooltip) em `apps/web/src/features/dashboard/components/ExportButton.tsx` — chamar `GET /api/client/export/active-file`; se resposta `302` seguir `Location`; se `200` JSON usar `{ url, filename }` com `window.location.href` ou `<a download>`
- [x] T017 [US7] Trocar import em `apps/web/src/components/client/DashboardView.tsx` para `features/dashboard/components/ExportButton.tsx` e desabilitar export quando `overview.activeImportJobId == null`
- [x] T018 [US7] Remover texto/opção PDF; validar label **Exportar planilha** + ícone download

**Checkpoint**: Nenhum `export-pdf` no frontend; curl quickstart §7 passa.

---

## Phase 4: User Story 3 — CustomSelect padronizado (Priority: P1)

**Goal**: Nenhum `<select>` nativo na UI; componente Index com borda #e2e2de, radius 8px, Inter 13px, chevron animado.

**Independent Test**: Inspecionar login, convite, import e filtros — só `CustomSelect` (ou wrapper sem nativo).

### Implementation for User Story 3

- [x] T019 [P] [US3] Criar `CustomSelect.tsx` com `@radix-ui/react-select` e estilos Index em `apps/web/src/components/shared/CustomSelect.tsx`
- [x] T020 [US3] Refatorar `SelectField.tsx` para delegar a `CustomSelect` sem `<select>` nativo em `apps/web/src/components/shared/SelectField.tsx` (ou deprecar e reexportar)
- [x] T021 [P] [US3] Substituir usos em `apps/web/src/features/admin/components/InviteUserForm.tsx`
- [x] T022 [P] [US3] Substituir usos em `apps/web/src/features/admin/components/EditUserPanel.tsx`
- [x] T023 [P] [US3] Substituir usos em `apps/web/src/components/ImportUploadForm.tsx`
- [x] T024 [US3] Buscar `rg "<select"` e `SelectField` em `apps/web/src` — migrar ocorrências restantes para `CustomSelect`

**Checkpoint**: Auditoria sem select nativo visível nas telas cobertas.

---

## Phase 5: User Story 1 — Login customizado com perfil (Priority: P1) 🎯 MVP auth

**Goal**: `/login` com card Prudens, perfil Cliente/Admin, cores dinâmicas, Clerk `useSignIn` sem UI embutida.

**Independent Test**: Abrir `/login` sem sessão; alternar cores 300ms; login válido redireciona por role; mismatch mostra pt-BR.

### Implementation for User Story 1

- [x] T025 [P] [US1] Criar `getProfileAccentColor` e tipo `LoginProfile` em `apps/web/src/lib/auth-theme.ts`
- [x] T026 [P] [US1] Criar `AuthCard.tsx` (logo, card 12px, borda 0.5px #e2e2de, sem sombra) em `apps/web/src/features/auth/components/AuthCard.tsx`
- [x] T027 [P] [US1] Criar `AuthDecorations.tsx` (5–6 SVG inline, transition fill/opacity 300ms) em `apps/web/src/features/auth/components/AuthDecorations.tsx`
- [x] T028 [US1] Implementar página `apps/web/src/app/(auth)/login/page.tsx` com `useState` perfil, `CustomSelect`, email/senha, `useSignIn`, validação role vs seleção, redirect `homePathForRole`
- [x] T029 [US1] Redirecionar `apps/web/src/app/(auth)/sign-in/[[...sign-in]]/page.tsx` para `/login`
- [x] T030 [US1] Atualizar `apps/web/src/middleware.ts`: rotas públicas `/login`, redirects não autenticado para `/login`
- [x] T031 [US1] Remover ou substituir `SignInEntry` / `<SignIn />` em fluxo principal; atualizar referências em `apps/web/src/app/(auth)/sign-in/` layout se existir
- [x] T032 [P] [US1] Atualizar redirects `redirect('/sign-in')` para `redirect('/login')` em layouts/pages client e admin sob `apps/web/src/app/`

**Checkpoint**: Zero componente visual Clerk na página de login.

---

## Phase 6: User Story 2 — Verificação e senha pós-convite (Priority: P1)

**Goal**: `/verify` para código; `/accept-invite` para convite com senha; redirect por `publicMetadata.role`.

**Independent Test**: Fluxo OTP → `/verify`; link convite → senha → dashboard admin ou client; token inválido → mensagem inline pt-BR.

### Implementation for User Story 2

- [x] T033 [US2] Implementar `apps/web/src/app/(auth)/verify/page.tsx` com `AuthCard`, campo código, `useSignIn` second factor, botão #1a4731
- [x] T034 [US2] Implementar `apps/web/src/app/(auth)/accept-invite/page.tsx` com token via `useSearchParams`, `useSignUp`, senha+confirmação, `setActive`, redirect por role
- [x] T035 [US2] Redirecionar rota legada `apps/web/src/app/(auth)/sign-up/[[...sign-up]]/page.tsx` para `/accept-invite`
- [x] T036 [US2] Atualizar `getClerkInviteRedirectUrl()` default para `/accept-invite` em `apps/api/src/lib/env.ts`
- [x] T037 [US2] Confirmar que `specs/008-custom-auth-client-ui/quickstart.md` e `apps/api/src/lib/env.ts` apontam convite para `/accept-invite` após T036 (sem duplicar T001)
- [x] T038 [US2] Incluir `/verify` e `/accept-invite` em `isPublicRoute` em `apps/web/src/middleware.ts`

**Checkpoint**: Convite end-to-end sem página hosted Clerk.

---

## Phase 7: User Story 4 — Barra de filtros horizontal (Priority: P1)

**Goal**: Filtros em linha flex; ranges IDD/dias/capital com min/max da API; labels descritivos formatados.

**Independent Test**: Expandir filtros no desktop — uma linha; sliders iniciam nos extremos do job ativo; labels pt-BR com %, dias e R$.

### Implementation for User Story 4

- [x] T039 [P] [US4] Adicionar `aggregateRanges(importJobId)` em `apps/api/src/repositories/stock-product-repository.ts` (MIN/MAX idd, stock_days, tied_up_capital)
- [x] T040 [US4] Implementar `client-products-ranges-service.ts` em `apps/api/src/services/client-products-ranges-service.ts`
- [x] T041 [US4] Registrar `GET /api/client/products/ranges` em `apps/api/src/routes/client-products.ts` (Zod query se necessário, `assertClient`)
- [x] T042 [P] [US4] Criar `RangeFilter.tsx` em `apps/web/src/features/dashboard/components/RangeFilter.tsx` (incluir UX quando `min === max`: label “valor único” ou slider degenerado legível)
- [x] T043 [US4] Reestruturar `apps/web/src/components/client/FilterBar.tsx` (flex nowrap gap-16, flex-1, três `RangeFilter`, formatLabel via `apps/web/src/lib/formatters.ts`)
- [x] T044 [US4] Estender `apps/web/src/store/dashboardStore.ts` com `setRangeBounds`, remover defaults fixos -100/365 na inicialização
- [x] T045 [US4] Buscar ranges no mount em `apps/web/src/components/client/DashboardView.tsx` e inicializar store; tratar `hasActiveJob: false`
- [x] T046 [US4] Atualizar `clearFilters` em `apps/web/src/store/dashboardStore.ts` para restaurar bounds dinâmicos

**Checkpoint**: `GET /api/client/products/ranges` alinhado a `contracts/api.openapi.yaml`.

---

## Phase 8: User Story 5 — Tooltips nas colunas (Priority: P2)

**Goal**: Ícone “i” com tooltip pt-BR; clique no label ordena sem interferência.

**Independent Test**: Hover em ícone de cada coluna — texto FR-019; clique no nome da coluna ordena.

### Implementation for User Story 5

- [x] T047 [P] [US5] Criar `COLUMN_TOOLTIPS` com todos os textos da spec em `apps/web/src/lib/column-tooltips.ts`
- [x] T048 [US5] Criar `ColumnHeader.tsx` (label botão sort + ícone info 12px como único trigger do Tooltip; suporte foco/teclado no ícone) em `apps/web/src/features/dashboard/components/ColumnHeader.tsx`
- [x] T049 [US5] Integrar `ColumnHeader` no cabeçalho de `apps/web/src/components/client/ProductTable.tsx` usando chaves de `COLUMN_TOOLTIPS` (sem tooltip hardcoded no componente)

**Checkpoint**: 15 colunas com tooltip conforme spec.

---

## Phase 9: User Story 8 — Logotipo centralizado na sidebar (Priority: P2)

**Goal**: “Prudens/INDEX” e “PI” centralizados; colapsado com I âmbar.

**Independent Test**: Alternar sidebar expandida/colapsada — sem texto cortado.

### Implementation for User Story 8

- [x] T050 [US8] Ajustar variantes expandido/colapsado (PI, I em #d4a020) em `apps/web/src/components/layout/Logo.tsx`
- [x] T051 [US8] Centralizar container do logo (`justify-center`) em `apps/web/src/components/layout/Sidebar.tsx`

**Checkpoint**: Logo alinhado em desktop ≥1280px.

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: limpeza, rotas legadas, validação final.

- [x] T052 [P] Atualizar `apps/web/src/components/auth/SignInEntry.tsx` — remover ou marcar deprecated se não usado
- [x] T053 [P] Atualizar `AuthSignOutButton` redirect para `/login` em `apps/web/src/components/AuthSignOutButton.tsx`
- [x] T054 [P] Atualizar `apps/web/src/app/page.tsx` redirect inicial para `/login` quando aplicável
- [ ] T055 Executar checklist completo em `specs/008-custom-auth-client-ui/quickstart.md` (incluir SC-006: export inicia em ≤5s com planilha ativa)
- [x] T056 [P] Atualizar exemplos OpenAPI em `specs/008-custom-auth-client-ui/contracts/api.openapi.yaml` se implementação divergir (status codes reais)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sem dependências
- **US6 (Phase 2)**: após Setup — **primeiro entregável de negócio**
- **US7 (Phase 3)**: após Setup; paralelo a US6 se equipe dividida
- **US3 (Phase 4)**: após Setup — **bloqueia US1** (login usa CustomSelect)
- **US1 (Phase 5)**: após US3 + Setup
- **US2 (Phase 6)**: após US1 (compartilha `AuthCard`, middleware)
- **US4 (Phase 7)**: após Setup; independente de auth
- **US5 (Phase 8)**: após US4 opcional (só `ProductTable`)
- **US8 (Phase 9)**: independente
- **Polish (Phase 10)**: após stories desejadas

### User Story Dependency Graph

```text
Setup → US6 (financial)
Setup → US7 (export) ─────────────────────────┐
Setup → US3 (CustomSelect) → US1 → US2       │
Setup → US4 (filters) → US5 (tooltips)        │
Setup → US8 (sidebar)                         │
                    Polish ←──────────────────┘
```

### Parallel Opportunities

- **Phase 1**: T002, T003, T004, T005 em paralelo
- **Após Phase 1**: US6 (T006–T011) e US7 (T012–T018) em paralelo em devs diferentes
- **US3**: T021, T022, T023 em paralelo após T019–T020
- **US1**: T025, T026, T027 em paralelo antes de T028
- **US4**: T039 + T042 em paralelo; depois T043–T046 sequencial na store

### Parallel Example: User Story 7

```bash
# API track:
T012 r2-storage-service.ts
T013 client-export-service.ts
T014 client-export.ts routes

# Web track (após T013):
T016 ExportButton.tsx
T017 DashboardView.tsx
```

---

## Implementation Strategy

### MVP First (recomendado)

1. Phase 1 Setup (inclui **T004a** Clerk Dashboard)  
2. Phase 2 US6 (dados financeiros corretos)  
3. Phase 4 US3 (CustomSelect)  
4. Phase 5 US1 (login)  
5. **Validar** login + métricas em import novo  
6. Demais stories na **ordem das fases** deste arquivo: US7 → US2 → US4 → US5 → US8

### Entrega incremental

| Incremento | Fases / stories | Valor |
|------------|-----------------|--------|
| 1 | US6 | Cálculos financeiros corretos |
| 2 | US3 + US1 | Login customizado com selects padronizados |
| 3 | US2 | Convite + verify |
| 4 | US7 | Export planilha real |
| 5 | US4 + US5 | Dashboard cliente polida |
| 6 | US8 | Identidade sidebar |

A **ordem das fases 2–9** no `tasks.md` (US6 → US7 → US3 → US1 → US2 → US4 → US5 → US8) é a sequência de implementação do `plan.md`. O MVP acima é um subconjunto que adia US7 até após auth mínima.

### Ordem de fases no arquivo vs spec

As **fases 2–9** neste arquivo seguem a **ordem de implementação do plan.md**, não a numeração US1→US8 da spec. Os labels `[USn]` em cada tarefa mantêm rastreabilidade com `spec.md`.

---

## Notes

- Reimportar planilha após US6 para alinhar métricas persistidas (ver `quickstart.md`)
- Clerk Dashboard: executar **T004a** antes de validar US1/US2
- Não commitar secrets; `NEXT_PUBLIC_*` só URLs públicas
- Commit após cada checkpoint de story
