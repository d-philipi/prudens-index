# Quickstart — 005 Clerk Restricted Invites

## Pré-requisitos

- API e web em execução.
- Variáveis de ambiente (API):
  - `CLERK_SECRET_KEY` — obrigatório.
  - `CLERK_INVITE_REDIRECT_URL` — **URL completa** da rota de aceite do convite, **incluindo** `/sign-up` (ex.: `http://localhost:3000/sign-up`). O código **não** concatena `/sign-up` de novo. Implementação: `getClerkInviteRedirectUrl()` em `apps/api/src/lib/env.ts`.
  - `APP_URL` — opcional; fallback para montar `{APP_URL}/sign-up` quando `CLERK_INVITE_REDIRECT_URL` não estiver definida (padrão local: `http://localhost:3000`).
- Variáveis (web): `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`.

## Configuração Clerk Dashboard (obrigatória — antes de US3 / testes E2E)

Executar **antes** de validar bloqueios OAuth e autocadastro (tarefa T004a):

| Item | Configuração |
|------|----------------|
| Sign-up público | **Desabilitado** (somente via convite) |
| OAuth / social | **Desabilitados** (Google, etc.) |
| Métodos de login | Apenas **Email + Password** |
| Invitations | **Habilitadas** |
| E-mail de convite (FR-011) | Confirmar que o Clerk envia o e-mail transacional ao criar convite (ver caixa de entrada / spam em dev) |
| Session token | Custom claim com `publicMetadata` (ou `metadata`) para o middleware web |

## 1) Aba Usuários (admin)

1. Login como admin (`publicMetadata`: `{ "role": "admin" }`).
2. Acesse `/admin/usuarios`.
3. Confirme listagem (ativos + pendentes), formulário de convite e edição via `EditUserPanel` na mesma página.
4. **Lista vazia**: mensagem amigável em pt-BR e formulário de convite visível.
5. **Falha ao carregar**: mensagem de erro + botão **Tentar novamente**.

### Convidar Cliente

1. Tipo **Cliente**, e-mail válido, empresa obrigatória.
2. Submeter → mensagem de sucesso em pt-BR.
3. Na listagem, entrada **pendente** com e-mail e empresa.

### Convidar Admin

1. Tipo **Admin**, e-mail válido (sem empresa).
2. Submeter → convite pendente na lista.

## 2) Aceitar convite

1. Abrir e-mail de convite (Clerk).
2. Link deve abrir `/sign-up` com fluxo Clerk (definir senha).
3. Após concluir, redirecionar para `/admin/imports` (admin) ou `/dashboard` (client).

### Validar metadata e divisão dual-source (Fase 3)

**Clerk (canônico)** — Dashboard → Users → Public metadata:

- Admin: `{ "role": "admin" }`
- Client: `{ "role": "client", "companyId": "<uuid>" }`

**Postgres (espelho API)** — após primeiro `apiFetch` ou edição admin:

```sql
SELECT id, clerk_user_id, email, role, company_id FROM users WHERE email = '...';
```

- `role` e `company_id` MUST coincidir com o `publicMetadata` do Clerk.
- Primeira chamada à API de negócio após convite MUST retornar 200 (lazy sync), não 401 por ausência de linha.

## 3) Editar usuário

1. Na aba Usuários, editar Cliente existente → trocar empresa.
2. Salvar → sucesso na UI.
3. Usuário afetado faz logout/login.
4. Cliente deve ver dados da **nova** empresa apenas.

### Editar convite pendente

- Preferir `updateInvitation` com novo `publicMetadata`.
- Se o Clerk retornar erro de operação não suportada: revogar o convite no Dashboard ou via API e **reenviar** convite com os metadados corretos.

## 4) Bloqueios de segurança (Fase 3)

| Teste | Esperado |
|-------|----------|
| Acessar `/sign-up` sem ticket de convite | Não cria conta pública / Clerk bloqueia |
| Acessar cadastro OAuth na UI | Botões ausentes |
| Login sem metadata | Redireciona `/acesso-pendente` |
| Cliente acessa `/admin/*` | Redireciona para dashboard |

## 5) API (curl opcional)

```bash
# Listar (token admin)
curl -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/admin/users

# Convidar cliente
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"email":"cliente@exemplo.com","role":"client","companyId":"<uuid>"}' \
  http://localhost:3001/api/admin/users
```

## Troubleshooting

- **401 na API após convite**: verificar sync `users` (lazy sync / `syncFromClerk` no auth plugin).
- **Metadata não no JWT**: revisar custom session claims no Clerk; forçar logout/login.
- **Convite não redireciona**: `CLERK_INVITE_REDIRECT_URL` deve ser URL completa até `/sign-up` (ex.: `http://localhost:3000/sign-up`); conferir rota `/sign-up` pública no middleware.
- **Edição de convite pendente falha**: usar reenvio de convite (ver § Editar convite pendente).
- **E-mail de convite não chega**: revisar Invitations no Clerk Dashboard e remetente; em dev, verificar limites da instância Clerk.
