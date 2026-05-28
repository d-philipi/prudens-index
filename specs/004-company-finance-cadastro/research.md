# Research — 004 Company Finance Cadastro

## R1 — Onde colocar o cálculo financeiro (única fonte de verdade)

**Decision**: Implementar `calculateFinancialMetrics` em `packages/domain-metrics/src/financial-metrics.ts` e expor no API via `apps/api/src/services/financial.service.ts` como re-export sem lógica duplicada.

**Rationale**: O worker roda em container separado e já depende de `@prudens/domain-metrics` para `computeItemStatusFromIdd`. Colocar fórmulas apenas em `apps/api` obrigaria o worker a depender do pacote API ou duplicar código — violando a constituição (DRY). O arquivo `financial.service.ts` permanece o ponto de entrada documentado da camada de serviço da API.

**Alternatives considered**:
- Fórmulas somente em `apps/api/src/services/financial.service.ts` com worker importando `@prudens/api`: rejeitado por acoplamento indevido worker→API.
- Duplicar fórmulas no worker: rejeitado por DRY.

## R2 — Formulário "Nova empresa": página dedicada vs modal

**Decision**: Página dedicada em `/admin/companies/new`.

**Rationale**: Formulário com 6 campos + validação inline beneficia de layout vertical completo; evita problemas de foco/scroll em modal; permite deep link e alinhamento com App Router existente (`page.tsx` server + client form). Mobile-first da constituição favorece página em vez de modal estreito.

**Alternatives considered**:
- Modal na listagem: rejeitado por densidade de campos e pior ergonomia em viewport estreita.

## R3 — `unit_price` opcional vs obrigatório na planilha

**Decision**: Coluna obrigatória no cabeçalho da planilha; por linha, valor numérico positivo obrigatório para linha válida (ausente/inválido → erro de linha em pt-BR).

**Rationale**: Spec exige cálculo financeiro por linha; linha sem preço unitário não produz métricas confiáveis. Registros legados permanecem com colunas financeiras `NULL` sem reprocessamento automático.

**Alternatives considered**:
- Opcional com zero nas métricas: rejeitado por mascarar dados faltantes na importação nova.

## R4 — Layout sem scroll horizontal com muitas colunas

**Decision**: Compactar tabela (padding/fonte menores), `table-fixed` + `w-full`, `overflow-x-hidden` no container central, reduzir padding do layout (`max-w-7xl` → `max-w-[100%]` ou `max-w-screen-2xl` com `px-3`), gap menor entre sidebar e conteúdo; **não** ocultar colunas por toggle nesta entrega (fora do escopo da spec).

**Rationale**: Spec pede eliminar scroll em desktop 1280px+ sem nova biblioteca. Compactação + contenção de overflow atende SC-003; toggle de colunas seria escopo adicional.

**Alternatives considered**:
- Colunas ocultáveis pelo usuário: adiado (Out of Scope implícito).

## R5 — CNPJ único e normalização

**Decision**: Normalizar CNPJ para 14 dígitos antes de persistir; índice único parcial `WHERE cnpj IS NOT NULL`; API retorna `409` com mensagem pt-BR "CNPJ já cadastrado" exibida inline no formulário.

**Rationale**: Evita duplicidade operacional mantendo campo opcional.

## R6 — Locale e formatação monetária na UI

**Decision**:

- `formatCurrency(value)` → `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 })` para **Faturamento Projetado**, **Capital Imobilizado** e **Faturamento Perdido** (inteiros persistidos).
- `formatUnitPrice(value)` → mesmo locale/moeda com `minimumFractionDigits: 2, maximumFractionDigits: 2` para a coluna **Valor Unitário**.

Ambas as funções ficam em `apps/web/src/lib/formatters.ts` (única fonte de verdade para moeda na UI).

**Rationale**: Nativo, sem biblioteca nova; distingue precisão do preço unitário (decimal na planilha) das métricas arredondadas para inteiro.

## R7 — Breaking change da planilha (11 → 12 colunas)

**Decision**: A partir desta spec, o cabeçalho padrão exige 12 colunas com "Valor Unitário" ao final. Imports com planilhas no formato anterior (11 colunas) falham na validação estrutural com mensagem em pt-BR indicando coluna esperada vs recebida.

**Rationale**: Garante dados financeiros completos em novas importações; registros já importados permanecem válidos no banco sem reprocessamento.

## R8 — Validação de nome da empresa na criação

**Decision**: Nome obrigatório (mín. 2 caracteres após trim) no cliente e na API. Conflito de slug derivado do nome resolve com sufixo incremental automático; se ainda assim houver falha de unicidade ou nome inválido, API retorna `400` com mensagem pt-BR exibida inline no formulário (sem redirect).

**Rationale**: Atende edge case de nome inválido; evita duplicidade operacional de slug sem exigir unicidade global de nome de exibição.
