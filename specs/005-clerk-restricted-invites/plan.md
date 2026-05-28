# Implementation Plan: Autenticação Restrita e Convites via Clerk

**Branch**: `005-clerk-restricted-invites` | **Date**: 2026-05-28 | **Spec**: `specs/005-clerk-restricted-invites/spec.md`  
**Input**: Plano de Implementação Tecnológica: Autenticação Clerk + spec 005 (aba Usuários, convites, edição, onboarding)

## Summary

Implementar governança de acesso **invite-only** com Clerk (e-mail/senha, sem OAuth/autocadastro), aba admin **Usuários** (`/admin/usuarios`) para listar, convidar e editar perfis, API admin com `@clerk/backend` (`createInvitation`, listagem, `updateUser` / `updateInvitation`), sincronização com tabela `users` no Postgres, e rota `/sign-up` para aceite de convite com `<SignUp />`.

**Sem novas bibliotecas** — usar `@clerk/backend` e `@clerk/nextjs` já presentes.

**Divisão técnica (resumo)**: Clerk = identidade + `publicMetadata` (JWT na web); PostgreSQL `users` = autorização da API de negócio; sync obrigatório entre ambos (ver seção abaixo e `spec.md`).

## Divisão técnica: Clerk (identidade) vs Postgres `users` (autorização API)

Esta feature formaliza uma arquitetura **dual-source** já presente no monorepo. Implementação MUST respeitar a separação abaixo.

### Responsabilidades por camada

| Camada | Onde vive | Fonte de verdade | Consumidores |
|--------|-----------|------------------|--------------|
| **Identidade** | Clerk (`User`, `Invitation`, `publicMetadata`) | Metadado público no Clerk | Middleware Next (`clerkRoles.ts`), e-mail de convite, Dashboard Clerk |
| **Autorização API** | PostgreSQL `users` | Espelho de `role` + `company_id` + `clerk_user_id` | `auth-plugin` → `resolveAuthContext` → `assertAdmin` / `assertClient` em todas as rotas Fastify de negócio |
| **Gestão admin** | API `admin-users` → Clerk SDK | Escrita em Clerk primeiro; sync em `users` em seguida | Aba `/admin/usuarios` via `apiFetch` |

### Fluxo de leitura (quem consulta o quê)

```text
┌─────────────────────────────────────────────────────────────────┐
│ apps/web                                                         │
│  middleware.ts ──► sessionClaims.publicMetadata (Clerk JWT)      │
│                    └─► parseRoleFromSessionClaims → /admin|/dashboard │
│                                                                  │
│  apiFetch('/api/admin/companies' | '/api/client/...')            │
│       └─► Authorization: Bearer <Clerk JWT>                      │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│ apps/api                                                         │
│  plugins/auth.ts                                                 │
│    1. verifyToken (Clerk) → clerkUserId, email                   │
│    2. userRepository.findByClerkId(clerkUserId)                  │
│    3. se null → userSyncService.syncFromClerk(clerkUserId)  ◄──┐ │
│    4. AuthContext { userId, role, companyId } from `users`       │ │
│                                                                  │
│  routes/admin-users.ts → clerkClient (list/invite/update)        │
│    └─► após mutação → userSyncService.upsertFromMetadata() ──────┘ │
└─────────────────────────────────────────────────────────────────┘
```

**Importante**: o middleware **não** consulta Postgres. A API de negócio **não** deve usar só o JWT sem passar por `users`, senão `userId` interno (UUID) e FKs quebram.

### Metadado canônico (`publicMetadata`)

Único builder: `apps/api/src/lib/clerk-metadata.ts` — usado em:

- `invitations.createInvitation({ publicMetadata })`
- `users.updateUser({ publicMetadata })`
- `invitations.updateInvitation` (pendentes)
- `user-sync-service` ao montar INSERT/UPDATE em `users`

```typescript
// Admin
{ role: 'admin' }

// Client
{ role: 'client', companyId: '<uuid>' }
```

### Gatilhos de sincronização (`user-sync-service`)

| # | Gatilho | Ação |
|---|---------|------|
| S1 | `POST /api/admin/users` (convite) | Metadata no convite; linha `users` só após aceite + S3 ou S4 |
| S2 | `PATCH /api/admin/users/:id` | `updateUser` / `updateInvitation` no Clerk + `upsert` imediato em `users` se `user_*` |
| S3 | Primeiro request autenticado sem linha em `users` | `syncFromClerk(clerkUserId)` em `auth.ts` → delega a `upsertFromMetadata` (lazy sync) |
| S4 | (Opcional v1.1) Webhook Clerk `user.created` | `upsert` — fora do MVP; lazy sync cobre |

**Algoritmo lazy sync (S3)** — em `plugins/auth.ts` após `verifyToken`:

```text
user = findByClerkId(sub)
if (!user) {
  clerkUser = clerkClient.users.getUser(sub)
  metadata = clerkUser.publicMetadata
  if (!validRole(metadata)) → 401 ou null (acesso pendente na web)
  user = userSyncService.syncFromClerk(clerkUserId)
  // internamente: getUser no Clerk → parsePublicMetadata → upsertFromMetadata
}
return AuthContext from user
```

### Rotas por tipo

| Tipo | Exemplos | Autorização |
|------|----------|-------------|
| Públicas web | `/sign-in`, `/sign-up`, `/acesso-pendente` | Sem API |
| Admin negócio | `/api/admin/companies`, imports, metrics | JWT + `users.role === 'admin'` |
| Admin usuários | `/api/admin/users` | JWT + admin + Clerk SDK |
| Cliente | `/api/client/products`, overview | JWT + `users.role === 'client'` + `companyId` |

### Consistência e falhas

| Situação | Comportamento |
|----------|---------------|
| Metadata válido no Clerk, sem `users` | Lazy sync (S3); não retornar 401 na API de negócio |
| Metadata inválido/ausente | Web → `/acesso-pendente`; API → 401 |
| Admin edita perfil | Clerk + `users` na mesma transação de serviço (S2) |
| JWT desatualizado após edição | Web pode mostrar rota antiga até re-login; API usa `users` já atualizado |

### Arquivos tocados pela divisão

| Arquivo | Papel na divisão |
|---------|------------------|
| `apps/web/src/middleware.ts` | Só JWT / metadata |
| `apps/web/src/lib/clerkRoles.ts` | Parse `publicMetadata` \| `metadata` no claim |
| `apps/api/src/plugins/auth.ts` | JWT verify + lazy sync |
| `apps/api/src/services/auth-context-service.ts` | Lê só `users` |
| `apps/api/src/services/user-sync-service.ts` | Ponte Clerk → Postgres |
| `apps/api/src/services/clerk-user-service.ts` | Mutações Clerk |
| `apps/api/drizzle/schema/users.ts` | Espelho local |

## Technical Context

**Language/Version**: TypeScript strict — Next.js 15 App Router (web), Node.js 20 LTS (API)  
**Primary Dependencies**: Fastify, Drizzle, Zod, `@clerk/backend`, `@clerk/nextjs`, Shadcn/UI, Tailwind v4  
**Storage**: PostgreSQL 16 (`users`, `companies`); Clerk (users, invitations, publicMetadata)  
**Testing**: Validação manual via `quickstart.md` (Fase 3); sem Playwright na v1  
**Target Platform**: Vercel (web), Coolify (API)  
**Project Type**: monorepo (`apps/web`, `apps/api`, `packages/shared`)  
**Performance Goals**: Listagem admin até ~100 usuários em < 2s; convite disparado em < 3s  
**Constraints**: Route → Service → Repository; Clerk secret só na API; UI e erros em pt-BR  
**Scale/Scope**: Admin aba Usuários; rotas auth públicas `/sign-in`, `/sign-up`, `/acesso-pendente`

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Reference: `.specify/memory/constitution.md` (v1.1.0)

| Gate | Status | Notes |
|------|--------|-------|
| Stack | PASS | Sem libs novas |
| Layer boundaries | PASS | Clerk admin API só no backend; web usa `apiFetch` |
| API sequence | PASS | `admin-users` routes → `admin-user-service` → `clerk-service` + `user-repository` |
| Validation & auth | PASS | Zod + `assertAdmin` em todas as rotas `/api/admin/users*` |
| Secrets & CORS | PASS | `CLERK_SECRET_KEY` apenas em API |
| DRY | PASS | Metadata builders únicos em `clerk-metadata.ts`; tipos em `@prudens/shared` |
| Mobile-first | PASS | Aba Usuários responsiva (tabela scrollável em mobile) |
| Operator language (pt-BR) | PASS | `strings.ts` + mensagens API em português |
| Actionable errors | PASS | Erros de convite (e-mail duplicado, empresa inválida) com mensagem clara |

Nenhuma violação exige Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/005-clerk-restricted-invites/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── contracts/
    └── api.openapi.yaml
```

### Source Code (repository root)

```text
apps/api/src/
├── lib/clerk-client.ts              # createClerkClient singleton
├── lib/clerk-metadata.ts            # buildPublicMetadata(role, companyId?)
├── services/clerk-user-service.ts   # invite, list, update (Clerk SDK)
├── services/user-sync-service.ts    # upsert users from Clerk metadata
├── services/admin-user-service.ts   # orquestra validação empresa + sync
├── routes/admin-users.ts            # GET/POST /api/admin/users, PATCH :id
└── plugins/auth.ts                  # + lazy sync se user ausente no DB

apps/web/src/
├── app/(admin)/admin/usuarios/page.tsx
├── app/(auth)/sign-up/[[...sign-up]]/page.tsx
├── features/admin/components/UsersPage.tsx      # lista + criar + editar
├── features/admin/components/InviteUserForm.tsx
├── features/admin/components/EditUserPanel.tsx
├── middleware.ts                    # + /sign-up público
└── lib/clerkRoles.ts                # (existente)

packages/shared/src/types/
└── index.ts                         # AdminUserListItemDto, InviteUserRequest, …
```

**Structure Decision**: Implementar explicitamente a **divisão dual-source** documentada acima; nenhum novo caminho de autorização que leia só JWT na API de negócio nem só `users` no middleware web.

---

## Implementation Phases (sequência obrigatória)

### Fase 1 — Backend & Integração SDK

**Objetivo**: Rotas admin autenticadas; convites com `publicMetadata`; listagem e edição; sync Postgres.

#### 1.1 Cliente Clerk na API

`apps/api/src/lib/clerk-client.ts`:

```typescript
import { createClerkClient } from '@clerk/backend';

export const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY!,
});
```

#### 1.2 Metadata builder

`apps/api/src/lib/clerk-metadata.ts`:

```typescript
export function buildPublicMetadata(input: {
  role: 'admin' | 'client';
  companyId?: string | null;
}): Record<string, unknown> {
  if (input.role === 'admin') return { role: 'admin' };
  return { role: 'client', companyId: input.companyId };
}
```

#### 1.3 Convite — `createInvitation`

**Variável de ambiente** (convenção única): `CLERK_INVITE_REDIRECT_URL` MUST ser a URL **completa** da rota de aceite, incluindo o path `/sign-up` (ex.: `http://localhost:3000/sign-up`). Não concatenar `/sign-up` no código. Ler via `getClerkInviteRedirectUrl()` em `apps/api/src/lib/env.ts`.

`clerk-user-service.inviteUser()`:

```typescript
await clerkClient.invitations.createInvitation({
  emailAddress: email,
  redirectUrl: getClerkInviteRedirectUrl(),
  publicMetadata: buildPublicMetadata({ role, companyId }),
});
```

- Validar empresa existe (`company-repository.findById`) se `role === 'client'`.
- Mapear erro Clerk duplicado → `409` com mensagem pt-BR.

#### 1.4 Listagem

`GET /api/admin/users`:

- `clerkClient.users.getUserList({ limit, offset })` → `kind: user`, `status: active`.
- `clerkClient.invitations.getInvitationList({ status: 'pending' })` → `kind: invitation`, `status: pending`.
- Enriquecer `companyName` via `companies`.
- Ordenar: pendentes primeiro, depois por e-mail.
- **Escopo v1 / SC-002**: até ~100 usuários sem paginação na UI; API usa `limit` padrão Clerk (ex.: 100) e documenta necessidade de paginação se o tenant crescer além disso.

#### 1.5 Edição

`PATCH /api/admin/users/:id`:

- Se `id` é usuário Clerk (`user_*`): `users.updateUser(id, { publicMetadata })` + `user-sync-service.upsert`.
- Se `id` é convite pendente: `invitations.updateInvitation` (metadata) quando suportado; se a API Clerk não permitir, retornar `409` com mensagem pt-BR orientando **revogar e reenviar convite** (ver `quickstart.md` § Troubleshooting).
- Regras: client exige `companyId`; admin remove `companyId`; bloquear auto-rebaixamento do admin atual.

#### 1.6 Rotas Fastify

`apps/api/src/routes/admin-users.ts` — registrar em `server.ts`:

| Método | Rota | Ação |
|--------|------|------|
| GET | `/api/admin/users` | list |
| POST | `/api/admin/users` | invite |
| PATCH | `/api/admin/users/:id` | update |

Todas com `assertAdmin(request.auth)`.

#### 1.7 Sync Clerk → `users` (implementação da divisão técnica)

**Serviço** `apps/api/src/services/user-sync-service.ts`:

```typescript
// upsertFromMetadata({ clerkUserId, email, role, companyId }) — grava no Postgres
// syncFromClerk(clerkUserId) — getUser no Clerk → parsePublicMetadata → upsertFromMetadata
// - admin → companyId = null
// - client → companyId obrigatório, FK validada
```

**Gatilhos** (ver tabela S1–S4 na seção *Divisão técnica*):

1. **`plugins/auth.ts`** (S3 — lazy sync): após `verifyToken`, se `findByClerkId` retorna null → `syncFromClerk(clerkUserId)`.
2. **`admin-user-service.update`** (S2): após `users.updateUser` no Clerk → `upsertFromMetadata` na mesma operação.
3. Convite (S1): metadata no invitation; `users` criado em S3 no primeiro login.

**Não fazer**: duplicar lógica de parse de role/companyId fora de `clerk-metadata.ts` + `user-sync-service`.

**Checkpoint Fase 1**: curl/API convida, lista e edita; `SELECT * FROM users` coerente com Clerk Dashboard; primeira chamada `apiFetch` pós-convite retorna 200 (não 401).

---

### Fase 2 — Frontend & Interfaces

**Objetivo**: Aba Usuários; formulário condicional; rota `/sign-up` para convite.

#### 2.1 Página `/admin/usuarios`

- Server ou client page com `apiFetch` + token Clerk.
- Layout admin existente: adicionar link **Usuários** no header (`admin/layout.tsx`).
- Seções na mesma página:
  1. **Formulário de convite** (`InviteUserForm`)
  2. **Tabela de usuários** (`UsersTable`)

#### 2.2 Lógica condicional empresa

```text
role === 'client' → exibir <select> empresas (GET /api/admin/companies)
role === 'admin'  → ocultar select; companyId não enviado
```

Validação Zod client-side antes de `POST` (mesmo padrão `CreateCompanyForm`).

#### 2.3 Edição na mesma página

- Botão "Editar" por linha → `EditUserPanel` (painel expansível abaixo da tabela ou bloco lateral na mesma página — não modal).
- E-mail somente leitura.
- `PATCH /api/admin/users/:id` ao salvar.
- Lista vazia: empty state pt-BR com formulário de convite visível.
- Erro ao carregar listagem: mensagem pt-BR + botão **Tentar novamente**.

#### 2.4 Rota de aceite do convite

`apps/web/src/app/(auth)/sign-up/[[...sign-up]]/page.tsx`:

```tsx
import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" />
    </main>
  );
}
```

`middleware.ts`:

```typescript
const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/acesso-pendente',
]);
```

#### 2.5 Clerk Dashboard (obrigatório antes de US3 — ver `quickstart.md` § Configuração Clerk)

Checklist bloqueante (Setup / T004a em `tasks.md`):

- Desabilitar sign-up público e OAuth.
- Habilitar **Invitations** e confirmar envio de e-mail transacional de convite (FR-011).
- Custom session claim: `publicMetadata` (ou `metadata`) no session token.

#### 2.6 Ajustes Sign-In / Sign-Up (consolidado em T026)

- `<SignIn />` e `<SignUp />`: sem link de cadastro público, sem OAuth (`signUpUrl` omitido; props Clerk para ocultar provedores sociais).
- US2 cobre apenas `signInUrl` / rotas; US3 consolida props de bloqueio em ambas as páginas auth.

**Checkpoint Fase 2**: fluxo visual completo admin → convite → e-mail → sign-up → dashboard.

---

### Fase 3 — Testes e Validação

Checklist manual (obrigatório antes de merge):

| # | Cenário | Critério de sucesso |
|---|---------|---------------------|
| T1 | `/sign-up` sem ticket | Não cria conta pública |
| T2 | Convite Cliente aceito | `publicMetadata` com `role` + `companyId` no Clerk |
| T3 | Convite Admin aceito | `publicMetadata` só `{ role: "admin" }` |
| T4 | Edição Cliente (empresa) | Metadata + isolamento de dados após re-login |
| T5 | Listagem admin | Mostra ativos e pendentes com empresa/regra corretas |
| T6 | OAuth / autocadastro | Ausente na UI e bloqueado no Clerk |

Executar `quickstart.md` e registrar evidências (screenshots opcionais).

---

## Phase 0 / Phase 1 Deliverables (this command)

| Artifact | Path | Status |
|----------|------|--------|
| Research | `specs/005-clerk-restricted-invites/research.md` | Done |
| Data model | `specs/005-clerk-restricted-invites/data-model.md` | Done |
| API contract | `specs/005-clerk-restricted-invites/contracts/api.openapi.yaml` | Done |
| Quickstart | `specs/005-clerk-restricted-invites/quickstart.md` | Done |
| Plan | `specs/005-clerk-restricted-invites/plan.md` | Done |

## Constitution Check (post-design)

| Gate | Status |
|------|--------|
| Stack | PASS |
| Layer boundaries | PASS |
| API sequence | PASS |
| Auth & pt-BR | PASS |
| Sync strategy | PASS (lazy sync documentado) |

## Complexity Tracking

| Topic | Decision | Simpler alternative rejected |
|-------|----------|------------------------------|
| Dual-source auth | Clerk metadata (web) + `users` (API) com sync explícito | JWT-only na API (quebra `userId` UUID); DB-only no middleware (impossível sem round-trip) |
| User sync | Lazy sync (S3) + upsert on admin edit (S2) | Webhook-only na v1; sync manual via seed |
| Metadata builder | Único módulo `clerk-metadata.ts` | Metadata inline em cada rota |
| List source | Clerk API aggregation | Tabela local de convites (duplicação) |
| Invite UI | Página dedicada `/admin/usuarios` | Modal (spec atualizada) |
