# Research: Autenticação Restrita e Convites via Clerk

**Feature**: `005-clerk-restricted-invites` | **Date**: 2026-05-28

## R1 — Provedor e modos de autenticação

**Decision**: Manter Clerk com **somente e-mail + senha**; desabilitar sign-up público e OAuth no **Clerk Dashboard** (não apenas na UI).

**Rationale**: A spec exige bloqueio de autocadastro e redes sociais. Configuração no Dashboard é a fonte de verdade; a UI (`<SignIn />` / `<SignUp />`) reflete essa política.

**Alternatives considered**:
- Bloquear só no middleware Next.js — insuficiente (usuário ainda poderia criar conta via API Clerk).
- Substituir Clerk — fora de escopo; produto já integrado.

## R2 — Criação de usuários via convite (backend)

**Decision**: Rotas admin protegidas com `assertAdmin` chamando `createClerkClient()` do `@clerk/backend` e `clerkClient.invitations.createInvitation()` com `publicMetadata` no payload.

**Rationale**: Alinha ao plano do usuário; secret key permanece na API (constituição). Metadados no convite garantem que, ao aceitar, o usuário já nasce com `role` e `companyId`.

**Payload canônico**:

```typescript
// Admin
{ role: 'admin' }

// Client
{ role: 'client', companyId: '<uuid>' }
```

**Alternatives considered**:
- Convite só com metadata pós-aceite — rejeitado (janela sem perfil, risco de acesso pendente prolongado).
- Frontend chamar Clerk diretamente — rejeitado (expõe secret ou exige JWT de backend Clerk no browser).

## R3 — Listagem e edição de usuários

**Decision**:
- **Listar**: `users.getUserList()` (ativos) + `invitations.getInvitationList({ status: 'pending' })` (pendentes); API agrega e enriquece `companyId` com nome da empresa via `company-repository`.
- **Editar usuário ativo**: `users.updateUser(userId, { publicMetadata })` + atualizar linha em `users` (Postgres) na mesma operação de serviço.
- **Editar convite pendente**: `invitations.updateInvitation(invitationId, { publicMetadata })` quando aplicável; senão orientar reenvio (v1 documentado no quickstart).

**Rationale**: Spec exige aba com todos os usuários, regras e empresas; Clerk é fonte de identidade, Postgres é fonte para autorização da API atual.

**Alternatives considered**:
- Só Clerk Dashboard manual — rejeitado pela spec.
- Duplicar usuários só em Postgres sem Clerk — inconsistente com identidade real.

## R4 — Sincronização Clerk ↔ Postgres (`users`) — divisão dual-source

**Decision**: Arquitetura **dual-source** formalizada em `spec.md` (*Divisão técnica de autorização*) e `plan.md` (*Divisão técnica: Clerk vs Postgres*):

| Camada | Fonte | Uso |
|--------|-------|-----|
| Clerk `publicMetadata` | Canônica de perfil | Middleware web (JWT), convites, edição admin via SDK |
| Postgres `users` | Espelho operacional | `resolveAuthContext`, `assertAdmin`, `assertClient`, FKs de negócio |

**Gatilhos de sync (S1–S4 no plan)**:

- **S2** — `PATCH /api/admin/users`: Clerk + `upsert` em `users` na mesma operação.
- **S3** — Lazy sync em `plugins/auth.ts` se JWT válido e sem linha local.
- **S1** — Convite: metadata no invitation; `users` na primeira requisição (S3).

**Rationale**: Middleware não acessa Postgres; API de negócio não deve autorizar só pelo JWT (precisa de `users.id` UUID). Convites quebrariam `apiFetch` sem sync.

**Alternatives considered**:
- Webhook Clerk obrigatório na v1 — adiado; lazy sync cobre MVP.
- JWT-only na API — rejeitado (quebra modelo `AuthContext.userId`).
- DB-only no middleware — rejeitado (web sem round-trip à API em cada navegação).

## R5 — Rota de aceite do convite (frontend)

**Decision**: Nova rota pública `app/(auth)/sign-up/[[...sign-up]]/page.tsx` com `<SignUp />` do Clerk; `redirectUrl` do convite usa `getClerkInviteRedirectUrl()` — env `CLERK_INVITE_REDIRECT_URL` MUST ser a URL **completa** com path `/sign-up` (ex.: `http://localhost:3000/sign-up`), sem concatenação extra no código.

Middleware: incluir `/sign-up(.*)` em rotas públicas (como `/sign-in`).

**Rationale**: Plano do usuário; fluxo padrão Clerk para ticket de convite.

**Alternatives considered**:
- Reusar `/sign-in` para convite — confunde UX e não é o fluxo recomendado para primeiro acesso.

## R6 — Sessão JWT e claims de metadata

**Decision**: Configurar no Clerk Dashboard (Session token → Custom claims) inclusão de `publicMetadata` (ou claim `metadata` já lida por `getMetadataFromSessionClaims` em `clerkRoles.ts`).

**Rationale**: Middleware e página inicial já usam `parseRoleFromSessionClaims`; edição de perfil deve refletir após novo login ou refresh de sessão.

## R7 — Regras de negócio na edição

**Decision**:
- Cliente → Admin: remover `companyId` dos metadados e `users.company_id = null`.
- Admin → Cliente: exigir `companyId` válido (empresa existe).
- Auto-rebaixamento: impedir admin remover próprio `role: admin` se for o único admin (contagem via Clerk list filtrada — v1 simples: bloquear edição do próprio usuário para perfil não-admin).

**Rationale**: Edge cases da spec; evita lockout operacional.

## R8 — Testes (Fase 3 do plano)

**Decision**: Validação manual via `quickstart.md` + checklist; sem nova lib E2E na v1.

**Cenários obrigatórios**:
1. URL `/sign-up` sem ticket → bloqueado / sem criar conta pública.
2. Convite Cliente → metadata com `role` + `companyId` após aceite (Clerk Dashboard + API).
3. Convite Admin → metadata só com `role: admin`.
4. Edição Cliente (troca de empresa) → metadata e API client isolada por empresa após re-login.

**Alternatives considered**:
- Playwright na v1 — adiado (constituição não exige; custo de setup).
