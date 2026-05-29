# Feature Specification: Matriz Bidimensional de Status de Estoque

**Feature Branch**: `009-stock-status-matrix`  
**Created**: 2026-05-29  
**Status**: Draft  
**Input**: User description: "Substituir a regra de status baseada exclusivamente no IDD por uma Matriz de Decisão Bidimensional que cruza Dias de Estoque com IDD%. Implementar os 7 novos status com suas cores, ações práticas e tooltips contextuais. Atualizar filtros, banco de dados e interface."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Classificação automática na importação (Priority: P1)

Como responsável por operações de estoque, preciso que cada produto receba automaticamente
um dos sete status operacionais com base em dias de estoque e IDD, seguindo uma cascata de
decisão fixa no momento do processamento da planilha, para que todos os usuários vejam a mesma
classificação estável e uma explicação textual do motivo.

**Why this priority**: A classificação correta no processamento é a fonte de verdade para
filtros, gráficos, exportações e ações recomendadas em toda a plataforma.

**Independent Test**: Processar planilhas de teste cobrindo cada faixa de `stock_days` e IDD;
confirmar `item_status` e `action_insight` persistidos conforme a cascata, sem recálculo na
interface do cliente.

**Acceptance Scenarios**:

1. **Given** um produto com `stock_days` igual a 0,
   **When** o job de importação conclui,
   **Then** `item_status` é `critical_rupture` e `action_insight` descreve ruptura crítica com
   os valores reais de dias de estoque e demanda média, independentemente do IDD.

2. **Given** um produto com `stock_days` maior que 0 e menor que 15,
   **When** o job conclui,
   **Then** `item_status` é `low_stock` e `action_insight` reflete estoque baixo, independentemente
   do IDD.

3. **Given** um produto com `stock_days` maior que 90,
   **When** o job conclui,
   **Then** `item_status` é `stuck_stock` e `action_insight` inclui dias de estoque, demanda
   média e capital parado estimado, independentemente do IDD.

4. **Given** um produto com `stock_days` entre 45 e 90 inclusive e não enquadrado nos passos
   anteriores da cascata,
   **When** o job conclui,
   **Then** `item_status` é `slight_excess` e `action_insight` orienta suspender novas compras.

5. **Given** um produto com `stock_days` entre 15 e 44 inclusive e IDD menor que 0%,
   **When** o job conclui,
   **Then** `item_status` é `unbalanced` e `action_insight` cita IDD e dias de estoque.

6. **Given** um produto com `stock_days` entre 15 e 44 inclusive e IDD entre 0% e 20% inclusive,
   **When** o job conclui,
   **Then** `item_status` é `healthy` e `action_insight` indica que nenhuma ação é necessária.

7. **Given** um produto com `stock_days` entre 15 e 44 inclusive e IDD maior que 20%,
   **When** o job conclui,
   **Then** `item_status` é `concentrated` e `action_insight` recomenda avaliar demanda local.

8. **Given** a avaliação em cascata,
   **When** uma condição de passo anterior é satisfeita,
   **Then** nenhum passo posterior é avaliado para aquele produto.

9. **Given** um usuário cliente autenticado,
   **When** consulta produtos no dashboard,
   **Then** status e texto de insight exibidos são sempre os valores persistidos no
   processamento (nunca recalculados na sessão do cliente).

---

### User Story 2 - Leitura rápida na tabela com badge e tooltip (Priority: P1)

Como usuário cliente, preciso ver na tabela um badge colorido com o nome do status e, ao
passar o mouse sobre ele, entender o motivo da classificação e a ação sugerida, sem poluir a
linha com ícones extras.

**Why this priority**: Converte a classificação em decisão operacional imediata na rotina de
análise de estoque.

**Independent Test**: Abrir o dashboard com produtos em status distintos; verificar label,
`actionLabel` visível no badge, cor, animação de pulso em ruptura crítica e conteúdo do
tooltip ao hover no badge.

**Acceptance Scenarios**:

1. **Given** um produto com status `critical_rupture`,
   **When** o cliente visualiza a coluna de status na tabela,
   **Then** vê o badge "Ruptura Crítica" na cor vermelha (#dc2626) com animação de pulso e
   ação prática resumida "Reabastecer Urgente".

2. **Given** produtos nos demais seis status,
   **When** o cliente visualiza os badges,
   **Then** cada um exibe label, cor e ação prática resumida (`actionLabel`) visível no badge conforme o mapeamento definido em
   Requisitos (Estoque Baixo, Desbalanceado, Estoque Encalhado, Excesso Leve, Saudável,
   Concentrado).

3. **Given** um produto com `action_insight` persistido,
   **When** o cliente passa o mouse sobre o badge de status (somente sobre o badge),
   **Then** aparece um tooltip com o texto completo de `action_insight`, largura máxima de
   320px, texto corrido em português.

4. **Given** a coluna de status ordenável,
   **When** o cliente clica no cabeçalho para ordenar,
   **Then** a ordenação funciona normalmente e não abre nem interfere no tooltip.

5. **Given** a célula de status,
   **When** o cliente observa a linha,
   **Then** não há ícone de informação separado ao lado do badge para exibir o insight.

---

### User Story 3 - Filtros e visões alinhados aos novos status (Priority: P2)

Como usuário cliente, preciso filtrar a lista e o gráfico pelos sete novos status, com as
mesmas cores e rótulos da tabela, mantendo os demais filtros já existentes (busca, dias de
estoque, capital parado, etc.).

**Why this priority**: Permite priorizar ações por tipo de situação sem perder capacidades de
análise já adotadas.

**Independent Test**: Aplicar cada valor do filtro de status e confirmar que gráfico, tabela e
exportação PDF refletem o mesmo subconjunto; confirmar que filtros não relacionados a status
permanecem disponíveis.

**Acceptance Scenarios**:

1. **Given** o dashboard com produtos em múltiplos status,
   **When** o cliente seleciona um ou mais dos sete status no filtro lateral,
   **Then** gráfico de barras e tabela exibem apenas produtos com esses status.

2. **Given** o filtro de status atualizado,
   **When** o cliente abre as opções,
   **Then** vê os sete valores com labels e cores correspondentes ao badge da tabela; os valores
   antigos (`distribution`, `adequate`, `boost`) não aparecem.

3. **Given** filtros de dias de estoque, capital parado ou busca por nome/EAN já existentes,
   **When** o cliente os utiliza em conjunto com o filtro de status,
   **Then** todos os filtros se combinam no mesmo subconjunto em gráfico, tabela e PDF.

4. **Given** exportação PDF com filtros ativos,
   **When** o cliente exporta,
   **Then** o relatório contém apenas produtos do subconjunto filtrado, com status e insights
   coerentes com a importação ativa.

---

### User Story 4 - Transição sem vestígios do modelo anterior (Priority: P2)

Como administrador da plataforma, preciso que após a atualização não existam produtos nem
telas referenciando os três status antigos baseados só em IDD, para evitar decisões
contraditórias.

**Why this priority**: Garante consistência de dados e confiança na nova matriz de decisão.

**Independent Test**: Após migração e reprocessamento (ou migração de dados), buscar em toda a
experiência do cliente e admin por rótulos ou valores legados; confirmar ausência.

**Acceptance Scenarios**:

1. **Given** a atualização implantada em produção,
   **When** um novo processamento de planilha conclui,
   **Then** nenhum produto recebe status `distribution`, `adequate` ou `boost`.

2. **Given** dados históricos na base,
   **When** a migração é aplicada,
   **Then** todos os produtos passam a usar exclusivamente os sete valores de
   `item_status` (via reprocessamento ou conversão documentada em Assumptions).

3. **Given** a API e filtros de produtos,
   **When** um cliente solicita filtro por status,
   **Then** apenas os sete identificadores válidos são aceitos.

---

### Edge Cases

- `stock_days` exatamente 0: sempre `critical_rupture` (passo 1), mesmo com IDD alto ou baixo.
- `stock_days` exatamente 14: `low_stock` (passo 2); `stock_days` exatamente 15: não entra no
  passo 2; se não cair nos passos 3 ou 4, avalia IDD no passo 5 (`unbalanced`, `healthy` ou
  `concentrated`).
- `stock_days` exatamente 45 ou 90: `slight_excess` (passo 4), desde que passos 1–3 não se
  apliquem.
- `stock_days` exatamente 91 ou mais: `stuck_stock` (passo 3), antes de considerar excesso leve.
- IDD exatamente 0% ou 20% na faixa 15–44 dias: limites inclusivos para `healthy`; IDD
  ligeiramente abaixo de 0% classifica como `unbalanced`.
- Produto na faixa 15–44 dias com IDD ausente ou inválido **na planilha**: linha rejeitada no
  parser (Assumptions). IDD null/NaN apenas no cálculo defensivo → `unbalanced`.
- `stock_days` ausente ou inválido **na planilha**: linha rejeitada no parser; no cálculo
  defensivo, null/negativo normaliza para 0 → `critical_rupture`.
- `tied_up_capital` ausente ou zero em `stuck_stock`: texto de insight ainda gerado, com valor
  monetário formatado conforme política de Assumptions.
- Reimportação de planilha: `item_status` e `action_insight` recalculados e substituídos para
  todas as linhas do job.
- Grande volume de produtos: filtros e tooltips permanecem responsivos com paginação existente.

## Requirements *(mandatory)*

### Functional Requirements

#### Cascata de classificação (precedência obrigatória)

- **FR-001**: O sistema DEVE calcular `item_status` exclusivamente durante o processamento
  server-side da planilha, nunca a partir de colunas da planilha nem na sessão do cliente.

- **FR-002**: O sistema DEVE avaliar as regras abaixo nesta ordem; o primeiro passo satisfeito
  define o status e encerra a avaliação:

  | Passo | Condição | Status resultante |
  | ----- | -------- | ----------------- |
  | 1 | `stock_days` igual a 0 | `critical_rupture` |
  | 2 | `stock_days` maior que 0 e menor que 15 | `low_stock` |
  | 3 | `stock_days` maior que 90 | `stuck_stock` |
  | 4 | `stock_days` maior ou igual a 45 e menor ou igual a 90 | `slight_excess` |
  | 5 | `stock_days` entre 15 e 44 inclusive: IDD &lt; 0% → `unbalanced`; IDD ≥ 0% e ≤ 20% → `healthy`; IDD &gt; 20% → `concentrated` |

- **FR-003**: Nos passos 1 a 4, o IDD NÃO DEVE influenciar o status.

- **FR-004**: No passo 5, apenas produtos com `stock_days` entre 15 e 44 inclusive são
  classificados por faixas de IDD conforme a tabela do passo 5.

#### Persistência de insight textual

- **FR-005**: Cada registro de produto em estoque DEVE persistir o campo `action_insight`
  (texto em português) calculado no mesmo momento que `item_status`.

- **FR-006**: O conteúdo de `action_insight` DEVE interpolar os valores reais do produto
  (`stock_days`, `average_demand`, `idd`, `tied_up_capital` quando aplicável) nos modelos abaixo:

  - `critical_rupture`: "Ruptura Crítica: este produto tem {stock_days} dias de estoque — sem unidades disponíveis na rede. A demanda média é de {average_demand} unidades/mês. Ação necessária: reabastecimento urgente."

  - `low_stock`: "Estoque Baixo: este produto tem apenas {stock_days} dias de estoque restante com demanda média de {average_demand} unidades/mês. O estoque da rede não dura duas semanas. Ação: acionar compras antes de avaliar distribuição."

  - `unbalanced`: "Desbalanceado: volume total adequado ({stock_days} dias de estoque), mas distribuição ineficiente — IDD de {idd}%. O produto está concentrado nas filiais erradas em relação à demanda. Ação: transferir unidades para as lojas com maior demanda."

  - `stuck_stock`: "Estoque Encalhado: {stock_days} dias de estoque parado na rede com demanda média de {average_demand} unidades/mês. Mais de 3 meses de estoque imobilizado. Capital parado estimado em {tied_up_capital}. Ação: promoções ou queima de estoque." (`{tied_up_capital}` já formatado em BRL, sem prefixo literal adicional)

  - `slight_excess`: "Excesso Leve: {stock_days} dias de estoque, acima do ideal de 45 dias. A demanda média é de {average_demand} unidades/mês. O volume atende o mês atual e avança para o próximo ciclo. Ação: suspender novas compras deste item até o volume baixar."

  - `healthy`: "Saudável: volume ideal de {stock_days} dias de estoque com IDD de {idd}% — distribuição equilibrada entre as filiais com demanda. Demanda média de {average_demand} unidades/mês. Nenhuma ação necessária."

  - `concentrated`: "Concentrado: {stock_days} dias de estoque com IDD de {idd}% — início de acúmulo desproporcional em poucas praças. Volume total ainda dentro do período seguro. Demanda média de {average_demand} unidades/mês. Ação: avaliar distribuição regional antes do próximo ciclo de compra."

- **FR-007**: Valores numéricos em `action_insight` DEVEM ser apresentados de forma legível ao
  usuário brasileiro, com regras fixas: `stock_days` com uma casa decimal (locale pt-BR);
  `average_demand` como inteiro (mesmo valor truncado usado no processamento);
  `idd` como percentual com zero casas decimais e sufixo `%`; `tied_up_capital` em reais via
  formatação monetária BRL sem casas decimais, sem duplicar o prefixo `R$` no texto do template.

#### Apresentação na interface do cliente

- **FR-008**: A coluna de status na tabela DEVE exibir um badge com label, cor e texto resumido
  da ação prática (`actionLabel`) visível no próprio badge (tipografia secundária menor que o
  label), conforme:

  | Status | Label | Cor | Ação prática (resumo visível no badge) |
  | ------ | ----- | --- | ------------------------------ |
  | `critical_rupture` | Ruptura Crítica | #dc2626 | Reabastecer Urgente |
  | `low_stock` | Estoque Baixo | #ea580c | Reabastecer |
  | `unbalanced` | Desbalanceado | #2563eb | Distribuir para lojas com demanda |
  | `stuck_stock` | Estoque Encalhado | #7c3aed | Impulsionar Vendas |
  | `slight_excess` | Excesso Leve | #6b7280 | Não Reabastecer |
  | `healthy` | Saudável | #16a34a | Manter como está |
  | `concentrated` | Concentrado | #d97706 | Avaliar Demanda Local |

- **FR-009**: O badge de `critical_rupture` DEVE incluir indicador visual com animação de pulso.

- **FR-010**: O tooltip com o texto de `action_insight` DEVE aparecer somente ao hover sobre o
  badge de status, com largura máxima de 320px e texto corrido em português.

- **FR-011**: O gráfico de barras e demais elementos que codificam cor por status DEVEM usar o
  mesmo mapeamento de cores dos badges.

#### Filtros e API

- **FR-012**: O filtro de status no dashboard DEVE listar os sete valores de `item_status` com
  labels e cores alinhados à tabela; nenhum filtro existente fora do status DEVE ser removido.

- **FR-013**: Busca, filtros numéricos (ex.: dias de estoque, capital parado) e filtro de status
  DEVEM continuar aplicando o mesmo subconjunto simultaneamente em gráfico, tabela e exportação
  PDF.

- **FR-014**: A API de listagem de produtos do cliente DEVE aceitar e retornar apenas os sete
  valores de `item_status` e o campo `action_insight` para cada produto.

#### Descontinuação do modelo anterior

- **FR-015**: Os valores `distribution`, `adequate` e `boost` DEIXAM de existir como
  `item_status` válidos após a migração.

- **FR-016**: Nenhuma superfície voltada ao usuário ou contrato de dados DEVE referenciar os
  três status antigos após a conclusão desta feature.

### Key Entities

- **Produto de estoque (`stock_products`)**: Representa um item da importação ativa; atributos
  relevantes incluem `stock_days`, `idd`, `average_demand`, `tied_up_capital`, `item_status`
  (enum de sete valores) e `action_insight` (texto explicativo gerado no processamento).

- **Status do item (`item_status`)**: Classificação operacional com valores `critical_rupture`,
  `low_stock`, `unbalanced`, `stuck_stock`, `slight_excess`, `healthy`, `concentrated`.

- **Insight de ação (`action_insight`)**: Texto em português, derivado do status e das métricas
  do produto, exibido integralmente no tooltip do badge.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em testes com planilhas de amostra cobrindo todas as faixas da cascata, 100% dos
  produtos recebem o status esperado e `action_insight` com variáveis interpoladas corretamente.

- **SC-002**: Usuários cliente identificam a ação recomendada para um produto em menos de 5
  segundos (badge + hover no tooltip) em teste moderado com 5 participantes representativos.

- **SC-003**: Após implantação, zero ocorrências dos status legados em produtos da importação
  ativa em auditoria de amostra de 100% das empresas com dados processados na primeira semana.

- **SC-004**: Filtro por status reduz o conjunto exibido no gráfico e na tabela de forma
  idêntica em 100% dos casos de teste de combinação status + busca + filtro numérico.

- **SC-005**: Tempo percebido para aplicar ou limpar filtro de status permanece imperceptível
  (atualização visível em menos de 2 segundos) com até 5.000 produtos na importação ativa.

## Assumptions

- `stock_days`, `idd` e `average_demand` já são persistidos a partir da planilha conforme
  feature de alinhamento de estoque; esta feature apenas altera como derivam status e insight.

- `tied_up_capital` já é calculado e persistido por produto antes ou durante o processamento;
  o texto de `stuck_stock` reutiliza esse valor.

- **Validação na planilha (parser)**: O parser continua exigindo IDD numérico válido por linha;
  linhas com IDD ou `stock_days` ausentes/inválidos na planilha são rejeitadas com mensagem
  pt-BR acionável (linha e coluna). Isso ocorre antes de `calculateItemStatus`.
- **Defesa no cálculo (`calculateItemStatus`)**: Se `stock_days` chegar null, negativo ou NaN
  ao cálculo (após parse), normalizar para 0 → `critical_rupture`. Se `idd` chegar null ou NaN
  na faixa 15–44 dias, classificar como `unbalanced`. Essas regras não dispensam a validação
  do parser para dados vindos da planilha.

- Produtos existentes passam a refletir os novos status na primeira importação bem-sucedida após
  a implantação; alternativamente, uma migração única recalcula status e insight para a
  importação ativa de cada empresa.

- Formatação de números em `action_insight` segue convenção brasileira (vírgula decimal onde
  aplicável; valores monetários com separador de milhar).

- A animação de pulso em ruptura crítica é um reforço visual de urgência, sem alterar a
  acessibilidade de leitura do label (contraste mínimo mantido).

- Escopo limitado à classificação, persistência, filtros, tabela, gráfico e PDF do dashboard do
  cliente; telas de autenticação ou mensagens de erro genéricas fora do domínio de estoque não
  são redesenhadas salvo remoção de referências aos status antigos onde apareçam por engano.
