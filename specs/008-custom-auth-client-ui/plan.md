# Implementation Plan: Autenticação Customizada, Dashboard do Cliente e Exportação de Planilha

**Branch**: `008-custom-auth-client-ui` | **Date**: 2026-05-28 | **Spec**: `specs/008-custom-auth-client-ui/spec.md`  
**Input**: Planejar implementação (nota: o pedido menciona “spec 006”; a feature ativa é **008** neste diretório).

## Summary

Entregar sete frentes alinhadas à spec 008 e à constituição do projeto:

1. **Truncagem** de `average_demand` com `Math.floor` na fonte única `packages/domain-metrics` (re-exportada por `financial.service.ts`).
2. **Auth customizada** Clerk headless em `/login`, `/verify`, `/accept-invite` com `AuthCard`, tema por perfil e redirects por `publicMetadata.role`.
3. **CustomSelect** em todos os selects (substituir `SelectField` nativo).
4. **Sidebar** — logotipo centralizado; colapsado `PI` com `I` âmbar.
5. **FilterBar** horizontal + `RangeFilter` + `GET /api/client/products/ranges`.
6. **ColumnHeader** + `COLUMN_TOOLTIPS` para tabela de produtos.
7. **Export** da planilha R2 ativa via `GET /api/client/export/active-file` (substitui PDF).

Stack: Next.js 15 App Router (Turbopack), Clerk SDK (sem UI), Tailwind v4, Shadcn/Radix, Zustand, Fastify, Drizzle, R2 presigned URLs. **Sem novas bibliotecas de domínio**; permitido `@radix-ui/react-tooltip` para tooltips (Shadcn).

## Technical Context

**Language/Version**: TypeScript strict — Next.js 15 App Router (Turbopack), Node.js 20 LTS  
**Primary Dependencies**: Clerk (`@clerk/nextjs`, `@clerk/backend`), Fastify, Drizzle, Zod, Zustand, `@radix-ui/react-select`, Tailwind v4, Recharts (inalterado)  
**Storage**: PostgreSQL 16, Redis 7, Cloudflare R2 (`import_jobs.r2_object_key`, `original_filename`)  
**Testing**: Vitest em `@prudens/domain-metrics` (casos 0.9 / 1.9 / 0.0); validação manual via `quickstart.md`  
**Target Platform**: Vercel (web), Coolify (API + worker)  
**Project Type**: monorepo — `apps/web`, `apps/api`, `apps/worker`, `packages/domain-metrics`, `packages/shared`  
**Performance Goals**: Ranges em uma query agregada; redirect 302 para export (sem buffer na API)  
**Constraints**: Route → Service → Repository; pt-BR; fetch nativo no frontend; auth em rotas protegidas  
**Scale/Scope**: 3 rotas auth públicas, 2 endpoints API client, ~15 arquivos web tocados, 1 pacote domain-metrics

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Reference: `.specify/memory/constitution.md` (v1.1.0)

| Gate | Status | Notes |
|------|--------|-------|
| Stack | PASS | Sem Express/Axios/Prisma; Clerk só como IdP |
| Layer boundaries | PASS | Export e ranges só na API; R2 via `r2StorageService` |
| API sequence | PASS | Novas rotas delegam a services dedicados |
| Validation & auth | PASS | Zod onde houver query/body; `assertClient` nos endpoints client |
| Secrets & CORS | PASS | Presigned URL TTL 60s; sem secrets em `NEXT_PUBLIC_*` |
| DRY | PASS | `calculateFinancialMetrics` único; `getProfileAccentColor` e `COLUMN_TOOLTIPS` únicos |
| Mobile-first | PASS | FilterBar com wrap em viewport estreita; tooltips com foco |
| Operator language (pt-BR) | PASS | Erros auth/export em `strings.ts` |
| Actionable errors | PASS | Token convite inválido com orientação clara |

Nenhuma violação exige Complexity Tracking (AuthCard usa apenas borda 0,5px #e2e2de, alinhado à spec 007 — sem sombra projetada).

**Pós-design**: research.md resolve NEEDS CLARIFICATION; contratos OpenAPI alinhados.

## Project Structure

### Documentation (this feature)

```text
specs/008-custom-auth-client-ui/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── contracts/
    └── api.openapi.yaml
```

### Source Code (mudanças planejadas)

```text
packages/domain-metrics/src/
├── financial-metrics.ts          # +flooredDemand = Math.floor(...)
└── financial-metrics.test.ts     # casos 0.9, 1.9, 0.0

apps/api/src/
├── services/financial.service.ts           # re-export (sem lógica duplicada)
├── services/client-products-ranges-service.ts   # NOVO
├── services/client-export-service.ts              # NOVO (substitui fluxo PDF)
├── services/r2-storage-service.ts                 # +getPresignedGetUrl(key, expiresIn)
├── repositories/stock-product-repository.ts       # +aggregateRanges(importJobId)
├── routes/client-products.ts                      # +GET .../ranges
├── routes/client-export.ts                        # GET active-file; remover POST pdf
└── lib/env.ts                                     # CLERK_INVITE → /accept-invite

apps/web/src/
├── app/(auth)/login/page.tsx
├── app/(auth)/verify/page.tsx
├── app/(auth)/accept-invite/page.tsx
├── app/(auth)/sign-in/...                         # redirect → /login
├── app/(auth)/sign-up/...                         # redirect → /accept-invite
├── features/auth/components/AuthCard.tsx
├── features/auth/components/AuthDecorations.tsx   # SVG inline 5–6 formas
├── features/dashboard/components/RangeFilter.tsx
├── features/dashboard/components/ColumnHeader.tsx
├── features/dashboard/components/ExportButton.tsx # mover de components/client/
├── lib/auth-theme.ts                              # getProfileAccentColor
├── lib/column-tooltips.ts                         # COLUMN_TOOLTIPS
├── components/shared/CustomSelect.tsx             # NOVO
├── components/layout/Logo.tsx                     # PI colapsado, centralização
├── components/layout/Sidebar.tsx                  # justify-center no header
├── components/client/FilterBar.tsx                # flex row + RangeFilter
├── components/client/ProductTable.tsx             # ColumnHeader
├── middleware.ts                                  # rotas públicas /login /verify /accept-invite
└── components/ui/tooltip.tsx                      # Shadcn/Radix (se ausente)
```

**Structure Decision**: manter `components/client/` para dashboard; novos peças em `features/auth` e `features/dashboard` conforme convenção já usada em `features/admin`. `ExportButton` e `RangeFilter` podem viver em `features/dashboard/components` com re-export temporário dos imports antigos se necessário.

---

## Implementation Phases (sequência obrigatória)

### Fase 0 — Correção do arredondamento (`financial.service` / domain-metrics)

**Objetivo**: `Math.floor` em `average_demand` antes de qualquer aritmética nas três métricas financeiras.

#### Arquivo canônico

`packages/domain-metrics/src/financial-metrics.ts`:

```typescript
const flooredDemand = Math.floor(average_demand ?? 0);
// usar flooredDemand em min(stock, demand), max(0, stock - demand), max(0, demand - stock)
```

- `apps/api/src/services/financial.service.ts` — manter `export { calculateFinancialMetrics } from '@prudens/domain-metrics'`.
- **Não** duplicar floor em worker: `process-import.ts` já chama `calculateFinancialMetrics`.

#### Auditoria de chamadas

| Local | Ação |
|-------|------|
| `packages/domain-metrics/src/financial-metrics.ts` | Implementar floor |
| `apps/worker/src/jobs/process-import.ts` | Nenhuma mudança se usar só `calculateFinancialMetrics` |
| Qualquer uso direto de `average_demand` em fórmulas financeiras | Grep `average_demand`, `averageDemand`, `projected_revenue` — deve passar pelo domínio |

#### Testes (`financial-metrics.test.ts`)

Adicionar `it.each` dedicado:

| stock | average_demand | unit_price | projected | tied | lost |
|------:|---------------:|-----------:|----------:|-----:|-----:|
| 100 | 0.9 | 10 | 0 | 1000 | 0 |
| 100 | 1.9 | 10 | 10 | 990 | 0 |
| 100 | 0.0 | 10 | 0 | 1000 | 0 |

Atualizar casos existentes que assumiam demanda fracionária sem floor (se houver).

**Dados legados**: métricas já gravadas em `stock_products` só mudam após re-import (documentado em `quickstart.md`).

---

### Fase 1 — Telas de autenticação customizadas

#### Clerk / ambiente

| Variável | Valor |
|----------|--------|
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/login` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/accept-invite` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | `/dashboard` (redirect fino via app) |

Clerk Dashboard: desabilitar hosted sign-in/up pages.

#### Rotas

| Rota | Arquivo | Responsabilidade |
|------|---------|------------------|
| `/login` | `app/(auth)/login/page.tsx` | Email, senha, `CustomSelect` perfil `client` \| `admin`, `useSignIn` |
| `/verify` | `app/(auth)/verify/page.tsx` | Código OTP/email, `useSignIn` second factor |
| `/accept-invite` | `app/(auth)/accept-invite/page.tsx` | Ver Fase 2 |

Redirects: `app/(auth)/sign-in/[[...sign-in]]/page.tsx` → `redirect('/login')`; sign-up legado → `/accept-invite`.

#### `AuthCard` (`features/auth/components/AuthCard.tsx`)

- Wrapper: fundo página `#f5f5f3` (via `AuthLayout` existente), card branco `rounded-xl` (12px), borda `0.5px #e2e2de` — sem sombra projetada (spec 007).
- Slot children: formulário.
- Logotipo tipográfico **Prudens/INDEX** centralizado no topo (reutilizar estilos de `Logo` onLight).

#### Tema de perfil — `lib/auth-theme.ts`

```typescript
export type LoginProfile = 'client' | 'admin';
export function getProfileAccentColor(profile: LoginProfile): '#1a4731' | '#d4a020';
```

Única fonte de verdade para cores do login (botão, decorações, acentos).

#### Login page

- `useState<LoginProfile>('client')` para perfil.
- `useSignIn()` do Clerk: `create({ identifier, password })` → `attemptFirstFactor` — **sem** `<SignIn />`.
- Após sucesso: ler `sessionClaims` / `user.publicMetadata.role`; comparar com perfil selecionado; redirect `admin` → `/admin`, `client` → `/dashboard` (`homePathForRole`).
- Erro de mismatch: strings existentes em `strings.auth.*`.
- `AuthDecorations.tsx`: 5–6 SVG inline (barras, caixas, linha tendência); `fill` e `opacity` com `transition: 300ms` ligados a `getProfileAccentColor(profile)`.

#### Verify page

- Card + botão confirmar `#1a4731`.
- `useSignIn`: `attemptEmailAddressVerification` / equivalente para código.

#### Middleware

Atualizar `isPublicRoute`: `/login`, `/verify`, `/accept-invite` (+ redirects legados).
Redirecionamentos de não autenticado: `/login` em vez de `/sign-in`.

---

### Fase 2 — Aceite de convite e criação de senha

**Rota**: `app/(auth)/accept-invite/page.tsx`

1. `useSearchParams()` — extrair token Clerk (`__clerk_ticket` ou parâmetro documentado na versão do SDK).
2. `useSignUp({})` — `isLoaded` → `signUp.create({})` se necessário → `signUp.ticket = token` / `attemptEmailAddressVerification` conforme API Clerk v6 para invitations.
3. Exibir `AuthCard` com campos senha + confirmação quando status permitir.
4. `signUp.update({ password })` → `setActive({ session })`.
5. Redirect: `publicMetadata.role` → `/admin` ou `/dashboard`.
6. Erros: token expirado/inválido — mensagem inline pt-BR no card (“Solicite um novo convite ao administrador”).

**API**: `getClerkInviteRedirectUrl()` e `CLERK_INVITE_REDIRECT_URL` devem apontar para `.../accept-invite` (não `/sign-up`).

---

### Fase 3 — `CustomSelect` em toda a interface

#### Implementação (`components/shared/CustomSelect.tsx`)

- Base: `@radix-ui/react-select` (já instalado).
- Estilo: `border-[0.5px] border-[#e2e2de] rounded-lg text-[13px] font-sans` (Inter), chevron `lucide-react` com `transition-transform` ao abrir.
- API compatível com `SelectField`: `label`, `value`, `onChange`, `options`, `placeholder`, `error`, `disabled`.

#### Auditoria e substituição

| Local | Arquivo |
|-------|---------|
| Perfil login | `login/page.tsx` (substituir botões ou usar CustomSelect) |
| Empresa convite | `features/admin/components/InviteUserForm.tsx` |
| Empresa edição | `features/admin/components/EditUserPanel.tsx` |
| Empresa import | `components/ImportUploadForm.tsx` |
| Status filtros | `FilterBar.tsx` se migrar status para select |
| Outros | `rg "<select"` e `SelectField` no `apps/web` |

Deprecar `SelectField` ou implementar como thin wrapper de `CustomSelect` sem `<select>` nativo.

---

### Fase 4 — Logotipo centralizado na sidebar

**`Sidebar.tsx`**: header `flex justify-center items-center` em ambos os modos; remover padding assimétrico que desloca o logo.

**`Logo.tsx`**:

- Expandido: `Prudens/INDEX` centralizado (`justify-center w-full text-center`).
- Colapsado: exibir **PI** — `P` branco, `I` em `#d4a020` (não “INDEX/DEX” truncado).
- `aria-label="Prudens Index"` mantido.

Sem alteração de `useSidebarCollapsed` ou itens de nav.

---

### Fase 5 — Barra de filtros horizontal + ranges API

#### API — `GET /api/client/products/ranges`

**Route** `client-products.ts` → **Service** `client-products-ranges-service.ts` → **Repository** `stockProductRepository.aggregateRanges({ companyId, importJobId })`:

```sql
SELECT
  MIN(idd::float), MAX(idd::float),
  MIN(stock_days::float), MAX(stock_days::float),
  MIN(tied_up_capital), MAX(tied_up_capital)
FROM stock_products WHERE import_job_id = $1
```

- Sem job ativo: `{ hasActiveJob: false, idd: null, ... }`.

#### `RangeFilter.tsx` (`features/dashboard/components/RangeFilter.tsx`)

Props: `min`, `max`, `value: [number, number]`, `onChange`, `label`, `formatLabel: (min, max) => string`.

Layout: label acima → dual range (dois `<input type="range">` ou slider Shadcn se existir) → texto descritivo abaixo.

#### `FilterBar.tsx`

- Container expandido: `flex flex-nowrap gap-4` (desktop); `flex-wrap` em mobile.
- Cada filtro: `flex-1 min-w-0`.
- Integrar três `RangeFilter` + busca + status checkboxes.
- `formatLabel` exemplos:
  - IDD: `Produtos com IDD entre ${formatPercent(min)} e ${formatPercent(max)}`
  - Dias: `Estoque para até ${max} dias` (ajustar copy conforme spec)
  - Capital: `formatCurrency` nos extremos

#### Frontend data flow

1. `DashboardView` mount: `apiFetch('/api/client/products/ranges')`.
2. `dashboardStore.setRangeBounds(ranges)` — substituir `DEFAULT_IDD_MIN/MAX` etc.
3. `clearFilters` restaura para bounds dinâmicos, não constantes fixas.

---

### Fase 6 — Tooltips nas colunas

#### `lib/column-tooltips.ts`

```typescript
export const COLUMN_TOOLTIPS: Record<string, string> = {
  productName: '...',
  ean: '...',
  // todos os textos FR-019 da spec
};
```

#### `ColumnHeader.tsx`

- Props: `label`, `tooltip`, `sortKey`, `active`, `direction`, `onSort`.
- Label `<button type="button">` → `onSort` (alinha FR-018/FR-020 da spec: tooltip no ícone, ordenação no label).
- Ícone info 12px `text-gray-400` → único `Tooltip` trigger; suporte `focus` para teclado/touch.
- Adicionar `components/ui/tooltip.tsx` (padrão Shadcn) + `@radix-ui/react-tooltip` dependency.

#### `ProductTable.tsx`

- Substituir `<th>` por `ColumnHeader` mapeando `COLUMNS` → chave em `COLUMN_TOOLTIPS`.
- Remover `title` estático das colunas financeiras onde tooltip substituir.

---

### Fase 7 — Exportação Excel ativo

#### API — `GET /api/client/export/active-file`

**Route** `client-export.ts` → **Service** `client-export-service.ts`:

1. `assertClient(ctx)`.
2. `importJobRepository.findActiveByCompany(companyId)` — status `completed`, `is_active`, `r2_object_key` preenchido.
3. `r2StorageService.getPresignedGetUrl(key, 60)`.
4. Resposta preferida: `reply.redirect(302, url)` com header opcional sugerindo filename (limitação S3: nome pode vir do metadata R2 ou fallback JSON).
5. Fallback: `200 { url, filename: job.originalFilename }`.

Remover ou deprecar `POST /api/client/export-pdf` e `export-pdf-service` (sem usos no frontend).

Estender `r2-storage-service`:

```typescript
async getPresignedGetUrl(objectKey: string, expiresInSeconds = 900): Promise<string>
```

#### `ExportButton.tsx`

- Label: **Exportar planilha** + ícone `Download` (lucide).
- Estados: `idle` | `loading` (“Baixando…”) | `disabled` quando `overview.activeImportJobId == null` (tooltip pt-BR).
- `useState` loading + `setTimeout` 10s reset em `finally`.
- Fluxo: `fetch` autenticado → **302**: seguir `Location`; **200** JSON `{ url, filename }`: `window.location.href = url` ou `<a download={filename}>`.
- Validar **SC-006** (início do download ≤5s) no quickstart.

Props/context: `hasActiveJob` de overview ou endpoint ranges (`hasActiveJob`).

---

## Phase 2 Planning (out of scope for `/speckit.plan`)

Detalhamento de tarefas, estimativas e ordem de PRs ficam para `/speckit.tasks`.

**Ordem sugerida de implementação**: Fase 0 → 7 → 1 → 2 → 3 → 4 → 5 → 6 (0 primeiro por impacto de dados; auth em seguida; UI polish por último).

---

## Artefatos gerados

| Artefato | Caminho |
|----------|---------|
| Research | `specs/008-custom-auth-client-ui/research.md` |
| Data model | `specs/008-custom-auth-client-ui/data-model.md` |
| Contracts | `specs/008-custom-auth-client-ui/contracts/api.openapi.yaml` |
| Quickstart | `specs/008-custom-auth-client-ui/quickstart.md` |
| Agent context | `.cursor/rules/specify-rules.mdc` (atualizado via script) |

**Próximo comando**: `/speckit.tasks` para quebrar fases em tarefas executáveis.
