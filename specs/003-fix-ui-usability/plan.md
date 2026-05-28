# Implementation Plan: Correções de Usabilidade da Spec 003

**Branch**: `003-fix-ui-usability` | **Date**: 2026-05-27 | **Spec**: `specs/003-fix-ui-usability/spec.md`  
**Input**: Feature specification from `specs/003-fix-ui-usability/spec.md`

## Summary

Planejar e implementar correções de usabilidade pós-spec 002 em admin e cliente, com foco em:
1) padronização de textos visíveis em pt-BR via fonte única de strings,  
2) erros estruturados e acionáveis no fluxo de importação,  
3) navegação admin com breadcrumb e retorno explícito,  
4) melhorias de leitura em gráfico/tabela cliente,  
5) paginação completa com cabeçalho fixo e formatação percentual unificada.

O plano segue obrigatoriamente a constituição v1.1.0 e não adiciona novas bibliotecas.

## Technical Context

**Language/Version**: TypeScript strict — Next.js 15 App Router (Turbopack), Node.js 20 LTS  
**Primary Dependencies**: Fastify, Drizzle, Zod, BullMQ, Clerk, Shadcn/UI, Tailwind v4, Recharts  
**Storage**: PostgreSQL 16 (Drizzle), Redis 7 (BullMQ), Cloudflare R2  
**Testing**: validação manual guiada + testes unitários existentes onde aplicável (sem nova stack)  
**Target Platform**: Web (Vercel frontend; API/worker em Coolify)  
**Project Type**: monorepo web-service (`apps/web`, `apps/api`, `apps/worker`, `packages/shared`)  
**Performance Goals**:
- Import com falha parcial continua processando linhas válidas
- Renderização de tabela com cabeçalho sticky sem regressão visual em listas longas  
**Constraints**:
- Sem novas dependências sem justificativa explícita
- Todas as strings visíveis ao usuário em pt-BR
- Erros de operador devem ser acionáveis (linha/coluna, esperado/recebido, orientação)
- DRY obrigatório para mapeamento de colunas, cores de status e formatadores  
**Scale/Scope**:
- Fluxos admin: listagem, detalhe da empresa, imports da empresa
- Fluxos cliente: gráfico de IDD e tabela de produtos com filtros/paginação

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Reference: `.specify/memory/constitution.md` (Prudens Index v1.1.0+)

| Gate | Status | Notes |
|------|--------|-------|
| Stack | PASS | Mantém Next 15, Fastify, Drizzle, Zod, Clerk, Recharts; sem libs novas |
| Layer boundaries | PASS | Frontend consome API; persistência no worker/API |
| API sequence | PASS | Endpoint novo seguirá Route → Service → Repository |
| Validation & auth | PASS | Zod mantém validação; rotas admin com `assertAdmin` |
| Secrets & CORS | PASS | Sem alteração de segredos/CORS |
| DRY & naming | PASS | Fonte única para strings, status colors, percent formatter, sheet mapping |
| Mobile-first | PASS | Componentes novos/responsivos sem quebrar viewport móvel |
| Operator language (pt-BR) | PASS | Strings e mensagens de erro em português |
| Actionable errors | PASS | Erro estruturado com linha, coluna, motivo, esperado/recebido |

Nenhuma violação exige Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/003-fix-ui-usability/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── contracts/
    └── api.openapi.yaml
```

### Source Code (repository root)

```text
apps/web/src/
├── app/(admin)/admin/page.tsx
├── app/(admin)/admin/companies/[id]/page.tsx
├── app/(admin)/admin/imports/page.tsx
├── components/ImportStatusPanel.tsx
├── components/client/IddBarChart.tsx
├── components/client/ProductTable.tsx
├── components/shared/Breadcrumb.tsx                # novo
├── components/shared/Pagination.tsx                # novo
├── features/admin/components/CompanyOverview.tsx   # novo
├── lib/strings.ts                                  # novo (fonte única)
├── lib/status-colors.ts                            # novo (fonte única)
├── lib/formatters.ts                               # novo (fonte única)
└── store/dashboardStore.ts

apps/api/src/
├── lib/sheet-mapping.ts
├── routes/admin-companies.ts
├── routes/admin-imports.ts
├── services/import-errors-service.ts               # novo
└── repositories/import-job-repository.ts

apps/api/drizzle/
├── schema/import-jobs.ts
└── migrations/* (nova migration para relatório estruturado)

apps/worker/src/
├── services/spreadsheet-parser-service.ts
└── jobs/process-import.ts

packages/shared/src/
└── types/index.ts
```

**Structure Decision**: manter organização existente por app; adicionar componentes compartilhados e utilitários de fonte única para garantir DRY e aderência à constitution.

## Implementation Phases (sequência obrigatória)

### Fase 0 — Internacionalização dos textos da UI

**Objetivo**: eliminar hardcoded de strings visíveis e centralizar copy em pt-BR.

**Plano**:
- Criar `apps/web/src/lib/strings.ts` com grupos por domínio:
  - `common` (ações, estados padrão, labels reutilizáveis)
  - `admin` (listagem empresas, detalhe, imports, breadcrumbs, botões)
  - `client` (dashboard, gráfico, tabela, paginação)
  - `errors` (mensagens de validação/feedback ao operador)
  - `status` (rótulos amigáveis de estados quando exibidos na UI)
- Substituir, componente a componente, textos hardcoded nas telas cobertas:
  - `app/(admin)/admin/page.tsx`
  - `app/(admin)/admin/companies/[id]/page.tsx`
  - `app/(admin)/admin/imports/page.tsx`
  - `components/ImportStatusPanel.tsx`
  - `components/client/IddBarChart.tsx`
  - `components/client/ProductTable.tsx`
  - componentes administrativos/clientes relacionados
- Manter lógica e fluxo dos componentes; alteração exclusivamente de fonte de texto.

### Fase 1 — Sistema de erros detalhados de validação da planilha

**Objetivo**: tornar erro de import estruturado, persistente e acionável.

**Plano**:
- No worker (`spreadsheet-parser-service.ts`), converter falhas Zod em estrutura:
  - `row_number: int`
  - `column_name: string` (nome original em português do cabeçalho)
  - `error_message: string` (português claro)
  - `expected_value: string | null` (formato esperado quando aplicável)
  - `received_value: string | null` (valor recebido quando aplicável)
  - incluir no texto de erro esperado/recebido quando aplicável
- Em `apps/api/src/lib/sheet-mapping.ts`, consolidar mapeamento canônico de campo interno ↔ coluna original pt-BR (re-export do pacote compartilhado, sem duplicação).
- Persistência dos erros estruturados vinculados ao import job:
  - adicionar coluna estruturada em `import_jobs` (ex.: `validation_errors` em JSON)
  - manter `error_message` como resumo curto para visão rápida
- Expor endpoint:
  - `GET /api/admin/companies/:id/jobs/:jobId/errors`
  - valida `id`/`jobId`, aplica `assertAdmin`, garante vínculo do job à empresa
  - resposta: lista de erros estruturados do job
- Frontend:
  - criar `ValidationErrorList` (na área de imports) para renderizar: linha, coluna e motivo
  - foco em legibilidade escaneável para localizar erro na planilha original.

### Fase 2 — Navegação e breadcrumb no admin

**Objetivo**: melhorar orientação e retorno em telas admin.

**Plano**:
- Criar `apps/web/src/components/shared/Breadcrumb.tsx`:
  - recebe `items: { label: string; href?: string }[]`
  - último item sem link (página atual)
- Aplicar breadcrumb como primeiro elemento abaixo do header em:
  - listagem: `Empresas`
  - detalhe: `Empresas` → `<Nome da Empresa>`
  - imports: `Empresas` → `<Nome da Empresa>` → `Importações`
- A rota primária de imports da empresa passa a ser `app/(admin)/admin/companies/[id]/imports/page.tsx`; `app/(admin)/admin/imports/page.tsx` permanece como entrada global de suporte.
- Na tela primária de imports da empresa, adicionar botão `Voltar para empresas` com navegação Next.

### Fase 3 — Seção de informações gerais da empresa no admin

**Objetivo**: manter contexto da empresa sempre visível no detalhe.

**Plano**:
- Criar `apps/web/src/features/admin/components/CompanyOverview.tsx` com:
  - nome da empresa
  - informações cadastrais disponíveis
  - total de produtos
  - IDD médio
  - última atualização
- Posicionar o componente no topo da página de detalhe, antes das abas.
- Verificar resposta atual de `GET /api/admin/companies/:id`:
  - hoje retorna `company`, `imports`, `activeImportJobId`
  - adicionar campos faltantes no DTO/service/repository para suportar overview completo (especialmente total produtos, IDD médio, última atualização e informações cadastrais disponíveis em `company.metadata`).

### Fase 4 — Correção do gráfico de barras do IDD na tela do cliente

**Objetivo**: reduzir ruído visual e unificar cor por status.

**Plano**:
- Em `IddBarChart`:
  - remover legenda inferior do `BarChart`
  - configurar `Tooltip` para exibir produto + IDD formatado com `%`
- Criar `apps/web/src/lib/status-colors.ts` com função pura:
  - `getStatusColor(itemStatus) => color`
  - única fonte de verdade para cor por status
- Migrar usos de cores por status (gráfico e tabela, quando houver badge/colorização) para essa função.
- Definir aplicação explícita na tabela: coluna de status com indicador visual (badge/ponto) cuja cor vem exclusivamente de `getStatusColor`.

### Fase 5 — Paginação completa e cabeçalho fixo na tabela de produtos

**Objetivo**: navegação robusta em listas grandes.

**Plano**:
- Criar `apps/web/src/components/shared/Pagination.tsx` com props:
  - `total_pages`, `current_page`, `onPageChange`
  - botões primeira/anterior/próxima/última
  - números ao redor da atual e reticências para páginas distantes
- Ajustar estado no Zustand (`dashboardStore.ts`):
  - armazenar página atual de forma explícita
  - troca de filtro reseta página para 1
  - paginação respeita filtros/sort ativos
- Aplicar cabeçalho sticky na tabela:
  - `sticky top-0` + `z-index` compatível com layout
  - preservar alinhamento exato entre `<thead>` e `<tbody>` em diferentes larguras.

### Fase 6 — Formatação de colunas percentuais na tabela

**Objetivo**: consistência visual e semântica de métricas percentuais.

**Plano**:
- Criar `apps/web/src/lib/formatters.ts` com função pura:
  - `formatPercent(value: number | null): string`
  - saída com `%` e duas casas decimais
- Usar `formatPercent` em:
  - células de `Distribuição`, `Demanda x Dist.` e `IDD`
  - demais pontos da UI que exibem esses percentuais
- Atualizar cabeçalhos para explicitar `%`.

## Phase 0 Research Output

Research document: `specs/003-fix-ui-usability/research.md`  
Todos os pontos de clarificação foram resolvidos sem necessidade de novas bibliotecas.

## Phase 1 Design Output

- Data model: `specs/003-fix-ui-usability/data-model.md`
- Contracts: `specs/003-fix-ui-usability/contracts/api.openapi.yaml`
- Quickstart: `specs/003-fix-ui-usability/quickstart.md`

## Post-Design Constitution Re-check

| Gate | Status | Notes |
|------|--------|-------|
| Stack | PASS | Design final mantém stack explícita solicitada |
| Layer boundaries | PASS | Erro estruturado persistido via API/worker, sem lógica no frontend |
| API sequence | PASS | Endpoint de erros desenhado com rota→serviço→repositório |
| Validation & auth | PASS | Zod + `assertAdmin` no contrato novo |
| DRY & naming | PASS | strings/status/formatters/sheet mapping como fontes únicas |
| Operator language (pt-BR) | PASS | textos e erros operador em português |
| Actionable errors | PASS | contrato prevê linha, coluna, motivo e orientação |

Sem bloqueios para `/speckit.tasks`.
