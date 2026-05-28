# Research — 007 Workspace Design System

**Date**: 2026-05-28  
**Feature**: `specs/007-workspace-design-system/spec.md`

## R1 — Font loading (Plus Jakarta Sans, Inter, JetBrains Mono)

**Decision**: Carregar as três famílias via `next/font/google` no `apps/web/src/app/layout.tsx`, expondo variáveis CSS (`--font-display`, `--font-sans`, `--font-mono`) aplicadas em `body` e utilitários Tailwind.

**Rationale**: Integração nativa com Next.js 15, subsetting automático, sem FOUT adicional além do padrão do framework; alinha à constituição (sem libs de fonte extras).

**Alternatives considered**:
- Link tags no `<head>` — rejeitado: pior LCP e sem otimização de subset.
- `@fontsource` packages — rejeitado: dependências extras desnecessárias.

## R2 — Design tokens e Tailwind v4

**Decision**: Centralizar tokens em `apps/web/src/styles/design-tokens.css` importado por `globals.css`, mapeando cores e espessuras no bloco `@theme` do Tailwind v4 (`--color-brand`, `--color-surface-page`, etc.). Proibir `shadow-*` e `bg-gradient-*` decorativos via convenção de code review; reset global `box-shadow: none` em componentes de superfície quando necessário para conformidade estrita.

**Rationale**: Single source of truth para FR-002/FR-004; facilita auditoria visual e reuso em todos os componentes.

**Alternatives considered**:
- Apenas classes Tailwind hardcoded — rejeitado: drift de hex entre arquivos.
- Theme provider React — rejeitado: dark mode fora de escopo; CSS variables suficientes.

## R3 — Shell de layout (sidebar + mobile nav)

**Decision**: Criar `AppShell` em `apps/web/src/components/layout/` com `Sidebar`, `SidebarNavItem`, `MobileBottomNav`, `PageHeader` e `Logo`. `PageHeader` alimentado por `resolvePageMeta(pathname)` em `page-meta.ts` (rotas estáticas + padrões `/admin/companies/:id` e `.../imports`). Substituir headers duplicados nos route groups `(client)` e `(admin)` com shell compartilhado.

**Rationale**: FR-005–FR-009 exigem comportamento idêntico em admin e cliente; DRY na constituição.

**Alternatives considered**:
- Dois layouts independentes — rejeitado: duplica largura 220/64, cores ativas e persistência.
- Migrar para Shadcn Sidebar pronto — rejeitado: projeto ainda não tem `components/ui`; adicionar pacote inteiro aumenta escopo; shell custom com tokens é suficiente.

## R4 — Persistência do colapso da sidebar

**Decision**: Chave `prudens.sidebar.collapsed` em `localStorage`, lida/gravada por hook `useSidebarCollapsed` consumido pelo `AppShell` (client component). Estado inicial `false` (expandido) se chave ausente.

**Rationale**: Atende FR-006 sem backend; escopo local ao dispositivo conforme spec.

**Alternatives considered**:
- Zustand global — aceitável mas desnecessário para um booleano; hook + localStorage é mais simples.
- Cookie server-side — rejeitado: complexidade SSR sem benefício.

## R5 — Filtros numéricos (IDD, dias de estoque, capital imobilizado)

**Decision**: Estender `GET /api/client/products` (e export se aplicável) com query params opcionais `idd_min`, `idd_max`, `stock_days_min`, `stock_days_max`, `tied_up_capital_min`, `tied_up_capital_max`; aplicar `gte`/`lte` no `stock-product-repository.buildWhere`. Route Zod com `.refine(min ≤ max)` por par e 400 pt-BR se inválido. UI: sliders no painel horizontal colapsável; debounce 300ms no refetch existente.

**Rationale**: Filtros MUST afetar gráfico e tabela com paginação server-side (FR-012); filtrar só no cliente quebraria total/páginas.

**Alternatives considered**:
- Filtro client-side na página carregada — rejeitado: inconsistente com paginação e chart_data do servidor.
- Endpoint separado para chart — rejeitado: duplicação; chart já usa mesmo `buildWhere`.

## R6 — Faixa do slider de capital imobilizado

**Decision**: Ao carregar overview/produtos, calcular `tiedUpCapitalMax` como `max(tiedUpCapital)` dos itens do job ativo (ou 0); slider 0..max com step 1. Se max = 0, ocultar slider ou exibir desabilitado com label explicativa.

**Rationale**: Alinha à assumption da spec; evita teto arbitrário.

## R7 — Navegação por perfil

**Decision**:

| Item | Cliente | Admin |
|------|---------|-------|
| Dashboard | `/dashboard` | `/admin` |
| Produtos | `/dashboard` (âncora/seção produtos) | oculto |
| Empresas | oculto | `/admin` |
| Usuários | oculto | `/admin/usuarios` |
| Importações | oculto | `/admin/imports` |

Detecção via metadados Clerk (`role`) no shell, mesma fonte já usada no middleware.

**Rationale**: FR-007/FR-008 sem expor rotas admin ao cliente.

## R8 — Shadcn/UI nesta feature

**Decision**: Não introduzir árvore completa Shadcn nesta entrega. Reutilizar padrões atuais (HTML + Tailwind + `lucide-react` + Radix Select já presente). Componentes novos (`StatusBadge`, `MetricCard`, sliders nativos estilizados) seguem tokens.

**Rationale**: Constituição permite Shadcn como base, não obriga migração total; escopo é visual + layout; evita churn de 30+ componentes.

**Alternatives considered**:
- `npx shadcn@latest init` — adiado; pode ser follow-up se sliders/badges exigirem primitivos Radix padronizados.

## R9 — Tela de entrada (`/sign-in`) vs `/sign-up` de convite

**Decision**:

- **`/sign-in`** = única porta de entrada pública: `AuthLayout` + `SignInEntry` com seletor **Admin** | **Cliente** (admin ativo `#1a4731`, cliente ativo `#d4a020`) + `<SignIn />` sem `signUpUrl`, OAuth e link de cadastro ocultos.
- **`/sign-up`** = mantida somente para ticket de convite (spec 005); não linkada em `/sign-in`.
- Pós-login: validar perfil selecionado vs `role` nos metadados; mismatch → mensagem pt-BR; match → `homePathForRole` (`admin` → `/admin/imports`, `client` → `/dashboard`, sem role → `/acesso-pendente`).

**Rationale**: FR-020–FR-025; escolha visual admin/cliente; invite-only preservado.

**Alternatives considered**:
- Rotas separadas `/sign-in/admin` e `/sign-in/client` — rejeitado: duplicação desnecessária.

## R10 — Clerk appearance (formulário embutido)

**Decision**: `AuthLayout` em todas as páginas `(auth)`; `appearance` do Clerk com social/sign-up links ocultos; botão primário `#1a4731`.

**Rationale**: Complementa FR-022 nos limites do componente hospedado.

## R11 — Breakpoints

**Decision**: Desktop shell com sidebar: `min-width: 1280px`. Mobile bottom nav: `< 768px` (md). Entre 768–1279px: sidebar visível compacta ou colapsada por padrão, sem scroll horizontal (FR-005).

**Rationale**: Spec cita 1280px para desktop e edge case tablet na spec.

## R12 — Testes

**Decision**: Validação manual via `quickstart.md` (checklist por rota + viewport). Opcional: testes unitários em `formatIddColor`, `buildProductsQuery` com novos params — somente se já houver padrão Vitest no web (hoje foco em domain-metrics).

**Rationale**: Feature predominantemente visual; ROI de E2E Playwright baixo nesta fase.
