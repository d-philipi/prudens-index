# Implementation Plan: Sistema de Design Workspace — Prudens Index

**Branch**: `007-workspace-design-system` | **Date**: 2026-05-28 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `specs/007-workspace-design-system/spec.md`

## Summary

Substituir a UI atual do Prudens Index por um sistema de design flat e denso inspirado no Google Workspace, aplicado a **todas as telas web existentes**. Entrega em camadas:

1. **Tokens + tipografia** (CSS/Tailwind v4, fontes via `next/font`).
2. **App shell** (sidebar 220/64px colapsável + nav mobile + `PageHeader` + logo tipográfico).
3. **Dashboard cliente** (card IDD, gráfico, filtros horizontais colapsáveis, tabela densa).
4. **Tela de entrada** `/sign-in` com seletor Admin/Cliente (sem sign-up público) + **admin + auth + landing** alinhados ao mesmo shell/tokens.
5. **API** — estender filtros de produtos para sliders (IDD, dias de estoque, capital imobilizado) com mesmo `where` em tabela e `chart_data`.

Sem modo escuro. Sem novas bibliotecas de UI além das já aprovadas (Recharts, lucide-react, Tailwind v4).

## Technical Context

**Language/Version**: TypeScript strict — Next.js 15 App Router, Node.js 20 LTS  
**Primary Dependencies**: Tailwind v4, Recharts, Zustand, Clerk, lucide-react, Fastify, Drizzle, Zod  
**Storage**: PostgreSQL 16 (sem migration nesta feature); `localStorage` para colapso da sidebar  
**Testing**: Validação manual `quickstart.md`; opcional unit tests em helpers de cor/query  
**Target Platform**: Vercel (web), Coolify (API)  
**Project Type**: monorepo (`apps/web`, `apps/api`, packages existentes)  
**Performance Goals**: Refetch de produtos com debounce 300ms; busca admin de empresas fluida até ~500 cards; sem scroll horizontal ≥1280px  
**Constraints**: Route→Service→Repository para mudanças de API; pt-BR; mobile-first; zero shadow/gradiente decorativo  
**Scale/Scope**: ~12 rotas web + extensão de 1 endpoint GET

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Reference: `.specify/memory/constitution.md` (v1.1.0)

| Gate | Status | Notes |
|------|--------|-------|
| Stack | PASS | Next 15, Tailwind v4, Recharts, Zustand, Fastify, Drizzle, Zod — sem libs proibidas |
| Layer boundaries | PASS | UI em `apps/web`; filtros novos na API via repository |
| API sequence | PASS | `client-products` route → `client-products-service` → `stock-product-repository` |
| Validation & auth | PASS | Zod nos novos query params; auth cliente existente |
| Secrets & CORS | PASS | Sem alteração |
| DRY | PASS | Tokens únicos em `design-tokens.css`; `Logo`, `AppShell`, helpers `iddColor` |
| Mobile-first | PASS | Bottom nav <768px; shell responsivo |
| Operator language (pt-BR) | PASS | Labels nav e filtros em `strings.ts` |
| Actionable errors | PASS | Fora de escopo (sem mudança em import errors) |

**Post-Phase 1 re-check**: PASS — extensão de API documentada em `contracts/api.openapi.yaml`; sem violações.

Nenhuma entrada em **Complexity Tracking**.

## Project Structure

### Documentation (this feature)

```text
specs/007-workspace-design-system/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── design-tokens.yaml
│   └── api.openapi.yaml
└── tasks.md             # (/speckit.tasks — não criado por este comando)
```

### Source Code (repository root)

```text
apps/web/src/
├── app/
│   ├── layout.tsx                    # fontes + tokens globais no body
│   ├── globals.css                   # import design-tokens
│   ├── page.tsx                      # landing alinhada
│   ├── (auth)/
│   │   ├── layout.tsx                # AuthLayout
│   │   ├── sign-in/[[...sign-in]]/page.tsx  # SignInEntry + perfil Admin|Cliente
│   │   ├── sign-up/...               # SOMENTE convite (sem link na entrada)
│   │   └── acesso-pendente/...
│   ├── components/auth/
│   │   ├── SignInEntry.tsx           # seletor + SignIn Clerk
│   │   └── EntryProfileSelector.tsx  # tiles Admin/Cliente
│   ├── (client)/dashboard/
│   │   └── layout.tsx                # usa AppShell (client nav)
│   └── (admin)/admin/
│       └── layout.tsx                # usa AppShell (admin nav)
├── styles/
│   └── design-tokens.css             # @theme + CSS variables
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx
│   │   ├── Sidebar.tsx
│   │   ├── MobileBottomNav.tsx
│   │   ├── PageHeader.tsx
│   │   └── Logo.tsx
│   ├── client/
│   │   ├── DashboardView.tsx         # layout vertical; FilterBar
│   │   ├── IndexHeader.tsx           # hero IDD card
│   │   ├── IddBarChart.tsx           # cores token; sem Legend
│   │   ├── ProductTable.tsx          # sticky header, badges, mono
│   │   └── FilterBar.tsx             # NEW (substitui FilterSidebar)
│   ├── admin/                        # restyle MetricsPanel, CompanyCard, ...
│   └── shared/
│       ├── Pagination.tsx
│       ├── StatusBadge.tsx           # NEW
│       └── Breadcrumb.tsx
├── hooks/
│   └── useSidebarCollapsed.ts
├── lib/
│   ├── strings.ts
│   ├── formatters.ts
│   ├── page-meta.ts                  # PageHeader + resolvePageMeta(pathname)
│   └── idd-display.ts                # NEW cores condicionais
└── store/
    └── dashboardStore.ts             # + filtros numéricos, panel open

apps/api/src/
├── routes/client-products.ts         # + Zod range params
├── services/client-products-service.ts
└── repositories/stock-product-repository.ts  # gte/lte em buildWhere
```

**Structure Decision**: monorepo existente; mudanças concentradas em `apps/web` com extensão mínima e coerente em `apps/api` para filtros server-side.

---

## Phase 0 — Research

Concluída → [research.md](./research.md)

Decisões-chave: `next/font`, tokens CSS, `AppShell` compartilhado, API range filters, sem migração Shadcn completa.

---

## Phase 1 — Design & Contracts

Concluída:

- [data-model.md](./data-model.md) — estado UI + extensão de query
- [contracts/design-tokens.yaml](./contracts/design-tokens.yaml) — contrato visual
- [contracts/api.openapi.yaml](./contracts/api.openapi.yaml) — query params novos
- [quickstart.md](./quickstart.md) — roteiro de validação

---

## Phase 2 — Implementation Outline (for `/speckit.tasks`)

### Wave 1 — Fundação (P1)

| # | Task | Arquivos principais |
|---|------|---------------------|
| 1 | Tokens + fontes + reset sem shadow | `design-tokens.css`, `layout.tsx`, `globals.css` |
| 2 | `Logo`, `PageHeader`, `useSidebarCollapsed` | `components/layout/*`, `hooks/*` |
| 3 | `AppShell`, `Sidebar`, `MobileBottomNav` | `components/layout/*` |
| 4 | Integrar shell em layouts client/admin | `(client)/dashboard/layout.tsx`, `(admin)/admin/layout.tsx` |
| 5 | `AuthLayout` + `SignInEntry` (Admin/Cliente, sem sign-up) | `(auth)/sign-in/*`, `components/auth/*` |
| 5b | Landing `/` → `/sign-in`; manter `/sign-up` só convite | `page.tsx`, `middleware.ts` (task **T015b**) |
| 5c | Auth secundárias: acesso-pendente, sign-up convite | `(auth)/acesso-pendente`, `sign-up` |

### Wave 2 — Dashboard cliente (P1)

| # | Task | Arquivos principais |
|---|------|---------------------|
| 6 | Restyle `IndexHeader` (hero card) | `IndexHeader.tsx` |
| 7 | Restyle `IddBarChart` + tooltip % | `IddBarChart.tsx` |
| 8 | API + repository: filtros numéricos | `client-products.ts`, `stock-product-repository.ts`, `dashboardStore.ts` |
| 9 | `FilterBar` colapsável horizontal | `FilterBar.tsx`, `DashboardView.tsx` |
| 10 | `ProductTable` + `StatusBadge` + `Pagination` | `ProductTable.tsx`, `shared/*` |
| 11 | `idd-display.ts` + formatters moeda/% | `lib/*` |

### Wave 3 — Admin e polish (P2)

| # | Task | Arquivos principais |
|---|------|---------------------|
| 12 | Admin overview: métricas + company grid | `admin/page.tsx`, `MetricsPanel`, `CompanyCard` |
| 13 | Company detail + imports history styling | `companies/[id]/*`, `ImportStatusPanel` |
| 14 | Usuários, imports globais, nova empresa | features/admin/*, forms |
| 15 | Clerk `appearance` + tooltips sidebar colapsada | `layout.tsx`, `Sidebar.tsx` |
| 16 | Auditoria: remover `slate-*`/`shadow-*` residuais | grep + fix across `apps/web` |

### Wave 4 — Verificação

| # | Task |
|---|------|
| 17 | Executar `quickstart.md` em desktop e mobile |
| 18 | `pnpm --filter @prudens/web typecheck` + lint |

---

## Risk & Mitigation

| Risk | Mitigation |
|------|------------|
| Filtros numéricos quebram paginação | Mesmo `buildWhere` em `countFiltered`, `findFiltered`, `chartData` |
| Scroll horizontal em tabela larga | `overflow-x-auto` contido; `max-w-[1280px]` no main |
| Clerk UI fora da paleta | Wrapper + `appearance`; documentar limitações |
| Conflito com spec 003 (gráfico/tabela) | Prevalece 007; manter comportamentos funcionais (tooltip, paginação) |

---

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Shadcn/UI não inicializado nesta feature (constituição II) | Escopo é tokens + layout + restyle; projeto já usa Tailwind + Radix Select + componentes custom | `npx shadcn init` adicionaria dezenas de arquivos fora do diff necessário; primitivos (slider, badge) serão custom com tokens até demanda explícita |
