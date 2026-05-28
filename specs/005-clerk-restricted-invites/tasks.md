# Tasks: Autenticação Restrita e Convites via Clerk



**Input**: Design documents from `/specs/005-clerk-restricted-invites/`  

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/api.openapi.yaml`, `quickstart.md`



**Tests**: Validação manual via `quickstart.md` (Fase 3 do plano); sem Vitest/Playwright automatizado na v1.



**Organization**: Tarefas agrupadas por user story. Respeitar **divisão dual-source** (`spec.md` § Divisão técnica, `plan.md` § Gatilhos S1–S4).



## Format: `[ID] [P?] [Story] Description`



- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependência de tarefa incompleta)

- **[Story]**: Mapeia à user story (`US1`, `US2`, `US3`)



---



## Phase 1: Setup (Shared Infrastructure)



**Purpose**: tipos compartilhados, strings pt-BR, variáveis de ambiente e Clerk Dashboard antes do backend.



- [x] T001 Documentar convenção de `CLERK_INVITE_REDIRECT_URL` (URL **completa** com `/sign-up`, ex.: `http://localhost:3000/sign-up`) em `specs/005-clerk-restricted-invites/quickstart.md`; usar `getClerkInviteRedirectUrl()` de `apps/api/src/lib/env.ts` em `createInvitation` (sem concatenar `/sign-up` no código)

- [x] T002 [P] Adicionar DTOs `AdminUserListItemDto`, `InviteUserRequest`, `UpdateUserRequest`, `InviteUserResponse` em `packages/shared/src/types/index.ts`

- [x] T003 [P] Adicionar labels pt-BR da aba Usuários em `apps/web/src/lib/strings.ts` (título, colunas, erros de convite/edição, empty state, botão “Tentar novamente”)

- [x] T004 [P] Criar schemas Zod de API `inviteUserBodySchema` e `updateUserBodySchema` em `apps/api/src/schemas/admin-user-schemas.ts`

- [ ] T004a [P] Executar checklist **Configuração Clerk Dashboard** em `specs/005-clerk-restricted-invites/quickstart.md` (sign-up público off, OAuth off, Email+Password, Invitations on, e-mail de convite, session claim `publicMetadata`) — **bloqueante para validar US3**



---



## Phase 2: Foundational (Blocking Prerequisites)



**Purpose**: infraestrutura Clerk + sincronização `users` (S1–S3) — **bloqueia US1, US2 e chamadas `apiFetch` pós-convite**.



**⚠️ CRITICAL**: Nenhuma user story deve ser validada end-to-end sem esta fase.



- [x] T005 Criar singleton `clerkClient` em `apps/api/src/lib/clerk-client.ts` (`createClerkClient` + `CLERK_SECRET_KEY`)

- [x] T006 [P] Implementar `buildPublicMetadata`, `parsePublicMetadata` e validação de role/companyId em `apps/api/src/lib/clerk-metadata.ts` (fonte única de metadata)

- [x] T007 Implementar `user-sync-service.ts` com `upsertFromMetadata` e `syncFromClerk(clerkUserId)` (getUser → parse → upsert) + validação de FK empresa em `apps/api/src/services/user-sync-service.ts`

- [x] T008 Estender `user-repository.ts` com `upsertByClerkId` e métodos auxiliares em `apps/api/src/repositories/user-repository.ts`

- [x] T009 Implementar lazy sync (gatilho S3) em `apps/api/src/plugins/auth.ts` — se JWT válido e sem linha em `users`, chamar `userSyncService.syncFromClerk(clerkUserId)`

- [x] T010 Garantir `resolveAuthContext` continua lendo somente `users` em `apps/api/src/services/auth-context-service.ts` (sem bypass por JWT direto)



**Checkpoint**: convite aceito + primeiro `apiFetch` retorna 200 com linha em `users` espelhada (teste manual com seed ou convite de teste).



---



## Phase 3: User Story 1 - Aba Usuários: listar, convidar e editar (Priority: P1) 🎯 MVP



**Goal**: página `/admin/usuarios` com listagem (e-mail, perfil, empresa, status), formulário de convite e edição de perfil/empresa; API admin com Clerk SDK + sync `users` (S2).



**Independent Test**: admin convida Cliente com empresa → lista mostra pendente → edita para outra empresa → Clerk e `users` coerentes; `PATCH` atualiza ambas as camadas.



### Implementation for User Story 1



- [x] T011 [US1] Implementar `listUsers` (limit padrão ~100, documentar paginação futura), `inviteUser` (`redirectUrl: getClerkInviteRedirectUrl()`), `updateUserOrInvitation` em `apps/api/src/services/clerk-user-service.ts`; fallback: se `updateInvitation` falhar, retornar 409 pt-BR orientando reenvio de convite

- [x] T012 [US1] Implementar `admin-user-service.ts` (valida empresa, monta metadata via `clerk-metadata`, orquestra sync S2, bloqueia auto-rebaixamento) em `apps/api/src/services/admin-user-service.ts`

- [x] T013 [US1] Criar rotas `GET/POST /api/admin/users` e `PATCH /api/admin/users/:id` com Zod + `assertAdmin` em `apps/api/src/routes/admin-users.ts`

- [x] T014 [US1] Registrar `adminUsersRoutes` em `apps/api/src/server.ts`

- [x] T015 [P] [US1] Criar `inviteUserSchema` e `updateUserSchema` cliente em `apps/web/src/features/admin/schemas/user-schemas.ts`

- [x] T016 [P] [US1] Implementar `InviteUserForm` (role Admin/Cliente, empresa condicional) em `apps/web/src/features/admin/components/InviteUserForm.tsx`

- [x] T017 [P] [US1] Implementar `UsersTable` (colunas e-mail, perfil, empresa, status; ação Editar; tabela scrollável em mobile; **empty state** pt-BR quando lista vazia) em `apps/web/src/features/admin/components/UsersTable.tsx`

- [x] T018 [US1] Implementar `EditUserPanel` (painel expansível na mesma página; e-mail readonly; role; empresa) em `apps/web/src/features/admin/components/EditUserPanel.tsx`

- [x] T019 [US1] Montar `UsersPage` (lista + convite + edição; loading; erro de listagem com botão **Tentar novamente**) em `apps/web/src/features/admin/components/UsersPage.tsx`

- [x] T020 [US1] Criar página `apps/web/src/app/(admin)/admin/usuarios/page.tsx` consumindo `UsersPage`

- [x] T021 [US1] Adicionar link **Usuários** no header em `apps/web/src/app/(admin)/admin/layout.tsx`



**Checkpoint**: User Story 1 funcional via API + UI sem depender de US2/US3.



---



## Phase 4: User Story 2 - Convidado ativa conta e define senha (Priority: P1)



**Goal**: e-mail de convite → `/sign-up` → definição de senha → redirect por perfil; lazy sync (S3) na primeira chamada à API.



**Independent Test**: abrir link do convite, definir senha, aterrisar em `/admin/imports` ou `/dashboard`; `users` e Clerk metadata alinhados.



### Implementation for User Story 2



- [x] T022 [P] [US2] Criar `apps/web/src/app/(auth)/sign-up/[[...sign-up]]/page.tsx` com `<SignUp routing="path" path="/sign-up" signInUrl="/sign-in" />` (props OAuth/sign-up público: ver T026)

- [x] T023 [US2] Incluir `/sign-up(.*)` em rotas públicas em `apps/web/src/middleware.ts`

- [x] T025 [US2] Verificar redirect pós-login em `apps/web/src/app/page.tsx` e `apps/web/src/lib/clerkRoles.ts` (`homePathForRole`) após ativação



**Checkpoint**: fluxo convite → sign-up → dashboard funcional com metadata correta.



---



## Phase 5: User Story 3 - Acesso bloqueado (cadastro público e OAuth) (Priority: P2)



**Goal**: somente e-mail/senha; sem autocadastro nem OAuth; acesso pendente sem metadata válida.



**Independent Test**: `/sign-up` sem ticket bloqueado; SignIn/SignUp sem botões sociais nem cadastro público; usuário sem metadata em `/acesso-pendente`. Pré-requisito: T004a concluída.



### Implementation for User Story 3



- [x] T026 [US3] Consolidar props de `<SignIn />` e `<SignUp />` em `apps/web/src/app/(auth)/sign-in/[[...sign-in]]/page.tsx` e `sign-up/[[...sign-up]]/page.tsx` — ocultar OAuth, omitir `signUpUrl`/cadastro público

- [x] T027 [US3] Confirmar middleware bloqueia `/admin` e `/dashboard` sem role em `apps/web/src/middleware.ts` (redirect `/acesso-pendente`)

- [x] T028 [US3] Atualizar `apps/web/src/app/(auth)/acesso-pendente/page.tsx` com texto alinhado ao fluxo de convite (sem instruir cadastro manual no Dashboard)



**Checkpoint**: auditoria UI + Clerk Dashboard (T004a) conforme `quickstart.md` (T6 do plano).



---



## Phase 6: Polish & Cross-Cutting Concerns



**Purpose**: validação final, typecheck e documentação operacional.



- [x] T029 [P] Alinhar `specs/005-clerk-restricted-invites/contracts/api.openapi.yaml` com implementação final (se necessário)

- [x] T030 Executar `pnpm --filter @prudens/api typecheck` e `pnpm --filter @prudens/web typecheck`; corrigir falhas

- [ ] T031 Validar checklist manual T1–T6 do `plan.md` seguindo `specs/005-clerk-restricted-invites/quickstart.md` (incl. SC-007/SC-008 dual-source, SC-002 listagem até ~100 usuários)

- [ ] T032 Confirmar envio de e-mail de convite (FR-011) e troubleshooting em `specs/005-clerk-restricted-invites/quickstart.md` após teste real



---



## Dependencies & Execution Order



### Phase Dependencies



- **Phase 1 (Setup)**: início imediato; **T004a** antes de validar US3

- **Phase 2 (Foundational)**: depende de T002/T004 — **bloqueia todas as user stories**

- **Phase 3 (US1)**: depende de Phase 2 — MVP da feature

- **Phase 4 (US2)**: depende de Phase 2; teste E2E de convite depende de US1 (T011–T014)

- **Phase 5 (US3)**: depende de T004a + US2 parcial (rotas auth)

- **Phase 6 (Polish)**: após US1–US3 desejadas



### User Story Dependencies



| Story | Depende de | Independente após |

|-------|------------|-------------------|

| US1 (P1) | Foundational (sync + Clerk lib) | Sim — API + `/admin/usuarios` |

| US2 (P1) | Foundational; convite (US1 backend) para teste real | Sim — `/sign-up` + redirect |

| US3 (P2) | T004a, US2 parcial | Sim — auditoria de bloqueios |



### Within User Story 1



1. T011 → T012 → T013 → T014 (API)

2. T015 paralelo a T011–T014

3. T016–T018 paralelos após T015

4. T019 → T020 → T021



### Parallel Opportunities



- **Phase 1**: T002 ∥ T003 ∥ T004 ∥ T004a

- **Phase 2**: T006 ∥ T008 (após T005)

- **US1**: T015 ∥ T016 ∥ T017 (após T014); T016 ∥ T017 ∥ T018

- **US2**: T022 ∥ T023 (após Foundational)

- **Polish**: T029 ∥ T030



---



## Parallel Example: User Story 1



```bash

# Após T014 (rotas registradas):

Task T015: "schemas cliente em apps/web/.../user-schemas.ts"

Task T016: "InviteUserForm.tsx"

Task T017: "UsersTable.tsx"

Task T018: "EditUserPanel.tsx"

# Depois sequencial: T019 → T020 → T021

```



---



## Parallel Example: Foundational + US2 shell



```bash

# Após T009 (lazy sync):

Task T022: "sign-up page.tsx"

Task T023: "middleware /sign-up público"

# Em paralelo com início de US1 backend (T011+)

```



---



## Implementation Strategy



### MVP First (User Story 1 + Foundational)



1. Phase 1 + Phase 2 (sync dual-source obrigatório)

2. Phase 3 (US1) — aba Usuários + API admin

3. **Validar**: listar, convidar, editar; `users` ↔ Clerk coerentes

4. Demo parcial sem fluxo de e-mail



### Incremental Delivery



1. Foundational → US1 (gestão admin)

2. US2 → ativação por convite

3. US3 → endurecer bloqueios OAuth/autocadastro (após T004a)

4. Polish + quickstart



### Dual-Source Reminder (implementação)



| Gatilho | Tarefa principal |

|---------|------------------|

| S3 Lazy sync | T009 (`syncFromClerk`) |

| S2 Edição admin | T012 + T007 |

| S1 Convite | T011 (`publicMetadata` no invitation) |

| Web rotas | T023, T027 (JWT only) |

| API negócio | T009 + T010 (`users` only) |



---



## Notes



- **Clerk secret** apenas em `apps/api`; web usa `apiFetch` + JWT.

- **Metadata** somente via `clerk-metadata.ts`; proibido duplicar em rotas ou componentes.

- **E-mail** não editável na UI de edição (spec); convite define e-mail.

- **T024 removida**: props SignIn/SignUp consolidadas em T026 (evita duplicação US2/US3).

- Total de tarefas: **33** (Setup: 5, Foundational: 6, US1: 11, US2: 3, US3: 3, Polish: 4).


