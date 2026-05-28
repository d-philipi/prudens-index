# Research — 003 Fix UI Usability

## Decision 1: Centralizar textos visíveis em `apps/web/src/lib/strings.ts`

**Decision**: Criar um objeto único de strings em pt-BR, segmentado por domínio (`common`, `admin`, `client`, `errors`, `status`) e consumir em todos os componentes de UI cobertos pela spec.

**Rationale**:
- Atende diretamente a constitution v1.1.0 (idioma pt-BR em superfícies de operador).
- Evita divergência de copy e reduz regressão para inglês em telas futuras.
- Permite substituição incremental componente a componente sem alterar lógica.

**Alternatives considered**:
- I18n framework completo (rejeitado: adicionaria complexidade e dependências fora do escopo).
- Constantes locais por componente (rejeitado: quebra fonte única e dificulta revisão).

## Decision 2: Persistir erros estruturados no `import_jobs`

**Decision**: Persistir erros estruturados por job (linha/coluna/mensagem) em campo estruturado no próprio `import_jobs`, mantendo `error_message` como resumo textual.

**Rationale**:
- Mantém vínculo natural com o job e simplifica consulta da aba de imports.
- Suporta falha parcial sem perder rastreabilidade.
- Evita criação de tabela adicional para escopo inicial de usabilidade.

**Alternatives considered**:
- Nova tabela `import_job_errors` (rejeitado nesta fase: maior custo de migração/manutenção para requisito atual).
- Apenas texto concatenado em `error_message` (rejeitado: não atende análise robusta e UI detalhada).

## Decision 3: Mapeamento canônico de colunas via `sheet-mapping`

**Decision**: Usar `apps/api/src/lib/sheet-mapping.ts` como ponto de acesso único (re-export do mapping compartilhado) para nome original das colunas da planilha em português.

**Rationale**:
- Preserva DRY e evita duplicar nomes de coluna entre worker/API/web.
- Mensagens de erro ficam consistentes com cabeçalho real da planilha.

**Alternatives considered**:
- Hardcode em parser do worker (rejeitado: acoplamento e duplicação).
- Hardcode no frontend (`ValidationErrorList`) (rejeitado: risco de inconsistência).

## Decision 4: Endpoint dedicado de erros por job no admin

**Decision**: Introduzir `GET /api/admin/companies/:id/jobs/:jobId/errors`.

**Rationale**:
- Isola leitura do relatório detalhado sem sobrecarregar payload do endpoint de job.
- Facilita paginação/filtros futuros sem quebrar contrato atual.

**Alternatives considered**:
- Embutir sempre erros completos em `GET /api/admin/imports/:importJobId` (rejeitado: payload potencialmente grande).

## Decision 5: Breadcrumb e navegação admin com componente compartilhado

**Decision**: Criar `Breadcrumb` compartilhado e aplicá-lo como primeiro bloco visual abaixo do header em listagem, detalhe e imports.

**Rationale**:
- Uniformiza navegação hierárquica e melhora orientação do admin.
- Reduz duplicação de markup de links e estados ativos.

**Alternatives considered**:
- Breadcrumb por página sem componente (rejeitado: repetição e inconsistência visual).

## Decision 6: Cor de status e percentual como funções puras reutilizáveis

**Decision**:
- Criar `getStatusColor(itemStatus)` em `apps/web/src/lib/status-colors.ts`.
- Criar `formatPercent(value)` em `apps/web/src/lib/formatters.ts`.

**Rationale**:
- Garante fonte única para semântica visual e formato numérico.
- Atende requisito de reaproveitamento no gráfico e tabela.

**Alternatives considered**:
- Manter objeto/formatter local em cada componente (rejeitado: quebra DRY e abre espaço para divergência).

## Decision 7: Paginação de produtos com estado explícito no Zustand

**Decision**: Evoluir store de dashboard para estado de paginação orientado a página atual/total, mantendo filtros e sort como parte do mesmo estado.

**Rationale**:
- Permite navegar para primeira/última e páginas específicas.
- Reseta corretamente para página 1 quando filtros mudam.

**Alternatives considered**:
- Cursor-only sem noção de total de páginas (rejeitado: não atende UX requerida na spec).
