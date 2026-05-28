# Data Model — 005 Clerk Restricted Invites

## 1) Clerk `publicMetadata` (fonte de perfil no JWT)

| Campo | Tipo | Obrigatório | Regras |
|-------|------|-------------|--------|
| `role` | `"admin"` \| `"client"` | sim | Define área do produto |
| `companyId` | uuid string | sim se `role === "client"` | Deve existir em `companies` |
| — | — | proibido se admin | `companyId` ausente ou removido para admin |

### Exemplos

```json
{ "role": "admin" }
```

```json
{ "role": "client", "companyId": "158a6f28-c7c4-4ae1-9bc0-47a1e577a4b9" }
```

## 2) Postgres `users` (autorização da API — espelho operacional)

| Campo | Tipo | Regras |
|-------|------|--------|
| `id` | uuid | PK |
| `clerk_user_id` | varchar(128) | único, NOT NULL |
| `email` | text | NOT NULL |
| `role` | enum `admin` \| `client` | NOT NULL |
| `company_id` | uuid FK → companies | NULL para admin; NOT NULL para client |
| `created_at` | timestamptz | default now |

**Sincronização** (espelho; canônico = Clerk `publicMetadata`):

| Gatilho | Atualiza `users` |
|---------|------------------|
| Admin `PATCH` usuário | Imediato (junto com Clerk) |
| Primeiro request API com JWT sem linha | Lazy sync (`auth` plugin) |
| Após aceite de convite | Lazy sync no primeiro `apiFetch` |

Ver `spec.md` § Divisão técnica e `plan.md` § Divisão técnica (S1–S4).

## 3) Convite Clerk (entidade externa, não tabela local)

| Atributo exposto na UI | Origem |
|------------------------|--------|
| `id` | invitation id |
| `email` | invitation email |
| `status` | `pending` \| `accepted` \| `revoked` |
| `role` / `companyId` | `publicMetadata` do convite |
| `createdAt` | Clerk |

Listagem admin = usuários ativos (Clerk User) ∪ convites `pending`.

## 4) DTOs da API (shared types)

### `AdminUserListItemDto`

| Campo | Tipo |
|-------|------|
| `id` | string (clerk user id ou invitation id prefixado) |
| `kind` | `"user"` \| `"invitation"` |
| `email` | string |
| `role` | `"admin"` \| `"client"` \| null se pendente sem metadata |
| `companyId` | string \| null |
| `companyName` | string \| null |
| `status` | `"active"` \| `"pending"` |

### `InviteUserRequest`

| Campo | Tipo | Validação |
|-------|------|-----------|
| `email` | string | email válido |
| `role` | `"admin"` \| `"client"` | obrigatório |
| `companyId` | string uuid | obrigatório se client |

### `UpdateUserRequest`

| Campo | Tipo | Validação |
|-------|------|-----------|
| `role` | `"admin"` \| `"client"` | obrigatório |
| `companyId` | string uuid \| null | obrigatório se client; null se admin |

## 5) State transitions

```text
[admin envia convite] → invitation pending
pending → (usuário aceita + define senha) → user active
active → (admin edita metadata) → user active (metadata atualizada)
pending → (admin edita invitation metadata) → pending (metadata atualizada)
```

## 6) Relacionamentos

- `Company` 1 — N `User` (clientes com `company_id`)
- Clerk `User` 1 — 1 `users` (por `clerk_user_id`)
- Admin users: sem `company_id`
