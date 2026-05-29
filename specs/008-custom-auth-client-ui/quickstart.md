# Quickstart — 008 Custom Auth & Client UI

## Pré-requisitos

- Monorepo: `pnpm install` na raiz.
- API (`pnpm --filter @prudens/api dev`), worker, web (`pnpm --filter @prudens/web dev`).
- PostgreSQL, Redis, R2 configurados conforme README do projeto.
## Configuração Clerk Dashboard (obrigatória — bloqueante para auth E2E)

Executar **antes** de validar login, verify e accept-invite (tarefa T004a):

| Item | Configuração |
|------|----------------|
| Hosted sign-in / sign-up | **Desabilitados** (somente páginas custom `/login`, `/accept-invite`) |
| OAuth / social | **Desabilitados** |
| Métodos de login | Apenas **E-mail + senha** |
| Invitations | **Habilitadas** |
| Redirect de convite | URL completa com `/accept-invite` (ver API abaixo) |
| Session token | Custom claim com `publicMetadata` (role, companyId) para middleware |

## Variáveis de ambiente (web)

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/accept-invite
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
```

Ajustar `AFTER_SIGN_IN` conforme fluxo (middleware redireciona por role após login customizado).

## Variáveis de ambiente (API)

```env
CLERK_SECRET_KEY=sk_...
CLERK_INVITE_REDIRECT_URL=http://localhost:3000/accept-invite
R2_ENDPOINT=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET=prudens-uploads
```

## 1) Fase 0 — Truncagem demanda média

```bash
pnpm --filter @prudens/domain-metrics test
```

Casos obrigatórios (unit_price=10, stock=100):

| average_demand | flooredDemand | projected | tied | lost |
|----------------|---------------|-----------|------|------|
| 0.9 | 0 | 0 | 1000 | 0 |
| 1.9 | 1 | 10 | 990 | 0 |
| 0.0 | 0 | 0 | 1000 | 0 |

Após deploy, **reimportar** planilha se precisar alinhar métricas já persistidas.

## 2) Autenticação customizada

1. Abrir `http://localhost:3000/login` (não deve aparecer UI Clerk embutida).
2. Alternar perfil Cliente/Admin — cores âmbar `#d4a020` / verde `#1a4731` com transição ~300ms.
3. Login admin válido → `/admin`; cliente → `/dashboard`.
4. Credencial válida com perfil errado → mensagem pt-BR, sem redirect.
5. Fluxo que exige código → `/verify`.
6. Link de convite → `/accept-invite` → definir senha → redirect por `role`.

## 3) CustomSelect

Auditar: login (perfil), `InviteUserForm`, `EditUserPanel`, `ImportUploadForm`, filtros com select.

Confirmar: sem `<select>` nativo visível; borda `#e2e2de`, radius 8px, Inter 13px.

## 4) Sidebar

1. Desktop ≥1280px: logotipo centralizado expandido e colapsado (`PI` com `I` âmbar).
2. Alternar colapso — sem texto cortado.

## 5) Filtros e ranges

1. Dashboard cliente com importação ativa.
2. Abrir filtros — uma linha horizontal (desktop), gap 16px.
3. Sliders IDD / dias / capital com min/max vindos de `GET /api/client/products/ranges`.
4. Labels descritivos abaixo (%, dias, R$) via `formatters.ts`.

## 6) Tooltips

Passar mouse no ícone “i” de cada coluna — texto conforme spec. Clicar no **nome** da coluna — ordenação funciona.

## 7) Exportar planilha

1. Com job ativo: botão **Exportar planilha** → download `.xlsx` com nome original.
2. Sem job ativo: botão desabilitado + tooltip pt-BR (`overview.activeImportJobId == null`).
3. Confirmar ausência de **Exportar PDF**.
4. **SC-006**: após clicar, o download deve **iniciar em até 5 segundos** em ambiente local com API e R2 saudáveis (cronometrar até aparecer arquivo ou redirect).

```bash
curl -i -H "Authorization: Bearer <token>" http://localhost:3001/api/client/export/active-file
# Esperado: 302 Location: https://... ou 200 { url, filename }
```

Frontend: se `302`, usar `window.location.href = apiBase + path` com token ou seguir redirect; se `200` JSON, atribuir `url` a `window.location.href` ou `<a download>` com `filename`.

## Rotas legadas

- `/sign-in` → redirect `/login`
- `/sign-up` (convite) → `/accept-invite`
