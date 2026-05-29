# Research — 008 Custom Auth & Client UI

**Date**: 2026-05-28  
**Spec**: `specs/008-custom-auth-client-ui/spec.md`

## R1 — Onde vive o cálculo financeiro canônico

**Decision**: Aplicar `Math.floor` em `packages/domain-metrics/src/financial-metrics.ts` na variável `flooredDemand` antes das três fórmulas; `apps/api/src/services/financial.service.ts` continua apenas re-exportando.

**Rationale**: Constituição (Princípio V) exige uma única fonte de verdade; o worker já importa `@prudens/domain-metrics` em `process-import.ts`. Alterar só a API duplicaria regra.

**Alternatives considered**:
- Truncar só na API ao ler do banco — rejeitado: valores persistidos no import ficariam inconsistentes com a regra.
- Truncar só na UI — rejeitado: viola FR-022 e SC-004.

## R2 — Clerk headless (sem UI embutida)

**Decision**: Usar hooks `@clerk/nextjs` (`useSignIn`, `useSignUp`) em páginas Next.js customizadas; configurar URLs customizadas via `NEXT_PUBLIC_CLERK_SIGN_IN_URL`, `NEXT_PUBLIC_CLERK_SIGN_UP_URL`, `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` e desabilitar hosted pages no Clerk Dashboard.

**Rationale**: Spec FR-004 e input do usuário; padrão já parcial em `SignInEntry.tsx` mas ainda renderiza `<SignIn />`.

**Alternatives considered**:
- Manter `<SignIn appearance={...}>` — rejeitado: não atende SC-001.
- `@clerk/elements` — rejeitado: adiciona camada de UI do ecossistema Clerk; hooks nativos são suficientes.

## R3 — Componente CustomSelect

**Decision**: Criar `CustomSelect` em `apps/web/src/components/shared/CustomSelect.tsx` com `@radix-ui/react-select` (já no `package.json`), estilos Index (borda 0,5px `#e2e2de`, radius 8px, Inter 13px, chevron animado). Migrar usos de `SelectField` (select nativo) e substituir `EntryProfileSelector` por botões ou `CustomSelect` conforme spec.

**Rationale**: Não existe `CustomSelect` no repositório hoje; `SelectField` usa `<select>` nativo (viola FR-008). O input do plano nomeia `CustomSelect` explicitamente.

**Alternatives considered**:
- Renomear `SelectField` in-place — aceitável se a implementação deixar de usar `<select>`; preferir novo nome para evitar regressão semântica.

## R4 — Limites dinâmicos dos filtros

**Decision**: Novo endpoint `GET /api/client/products/ranges` com agregação SQL `MIN`/`MAX` em `stock_products` para o `import_job_id` ativo (`idd`, `stock_days`, `tied_up_capital`). Frontend inicializa `RangeFilter` com esses valores; estado de filtro continua no Zustand (`dashboardStore`).

**Rationale**: FR-016 exige limites derivados dos dados, não constantes `-100..100` / `0..365` do `dashboardStore` atual.

**Alternatives considered**:
- Calcular min/max no cliente a partir da primeira página — rejeitado: paginação não cobre todos os produtos.
- Incluir ranges em `GET /api/client/products` — rejeitado: acoplamento e payload maior; endpoint dedicado é mais claro.

## R5 — Exportação da planilha ativa

**Decision**: `GET /api/client/export/active-file` → Route → `client-export-service` → `importJobRepository.findActiveByCompany` + `r2StorageService.getPresignedGetUrl(key, { expiresIn: 60 })` → resposta `302` para URL assinada; fallback JSON `{ url, filename }` se redirect não for viável no cliente.

**Rationale**: Arquivo já está em R2 (`import_jobs.r2_object_key`, `original_filename`); não gerar blob na API economiza memória. URL temporária atende requisito de não exposição permanente.

**Alternatives considered**:
- Stream do R2 pela API — válido mas mais carga na API; presigned redirect é padrão S3/R2.
- Manter POST export-pdf — rejeitado: spec FR-024/FR-027.

## R6 — Tooltips de coluna sem bloquear ordenação

**Decision**: Componente `ColumnHeader` com label clicável para sort; ícone “i” separado como trigger do Tooltip Shadcn/Radix (`@radix-ui/react-tooltip` a adicionar).

**Rationale**: FR-020; `title` nativo no `<th>` não permite ícone dedicado e piora UX mobile.

## R7 — Rotas de autenticação

**Decision**: Novas rotas `(auth)/login`, `(auth)/verify`, `(auth)/accept-invite`; redirects permanentes de `/sign-in` → `/login` e convite de `/sign-up` → `/accept-invite`; atualizar `middleware.ts` matcher público e `getClerkInviteRedirectUrl()` para `/accept-invite`.

**Rationale**: Alinhamento com input do plano e separação semântica dos fluxos.

## R8 — AuthCard sem sombra

**Decision**: Card de autenticação usa apenas borda `0.5px #e2e2de` e fundo branco — **sem** `box-shadow`, alinhado à spec 007 e à constituição de identidade flat.

**Rationale**: Análise de consistência (2026-05-28) removeu exceção de sombra; contraste suficiente com borda estrutural sobre `#f5f5f3`.

## R9 — Dados financeiros já importados

**Decision**: Truncagem aplica-se em novos imports após deploy; **fora de escopo** reprocessar jobs históricos automaticamente. Quickstart documenta re-import opcional para alinhar métricas legadas.

**Rationale**: Métricas financeiras são persistidas no worker; corrigir linhas antigas exigiria job de backfill não solicitado na spec.
