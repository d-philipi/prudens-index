# Feature Specification: Abas do Dashboard Cliente e Ajustes de Status

**Feature Branch**: `010-client-dashboard-tabs`  
**Created**: 2026-05-29  
**Status**: Draft  
**Input**: User description: "Dividir o dashboard do cliente em três abas (Dashboard, Produtos e Exportação) e ajustar duas regras da matriz de status de estoque, mantendo o padrão visual do design system Prudens Index (spec 007) e o cálculo de status server-side já existente (spec 009). Todo texto em pt-BR."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Classificação corrigida no processamento (Priority: P1)

Como responsável por operações de estoque, preciso que a matriz de status aplique duas regras
refinadas durante o processamento da planilha — exigência de folga de volume para "Saudável" e
tratamento correto de dias de estoque indefinidos por demanda zero — para que produtos recebam
status e insights coerentes com a realidade operacional, sem recálculo no navegador.

**Why this priority**: Status e insights são a fonte de verdade para filtros, resumo executivo,
relatório PDF e decisões de ação; regras incorretas distorcem toda a experiência do cliente.

**Independent Test**: Processar planilhas de teste cobrindo as novas faixas; confirmar
`item_status` e `action_insight` persistidos conforme a cascata atualizada, incluindo variantes
de texto para Estoque Baixo e Estoque Encalhado por demanda zero.

**Acceptance Scenarios**:

1. **Given** um produto com dias de estoque entre 15 e 44 inclusive, IDD entre 0% e 20%
   inclusive e dias de estoque maiores que 30,
   **When** o processamento conclui,
   **Then** `item_status` é `healthy` e o insight descreve volume ideal com distribuição
   equilibrada.

2. **Given** um produto com dias de estoque entre 15 e 30 inclusive, IDD entre 0% e 20%
   inclusive,
   **When** o processamento conclui,
   **Then** `item_status` é `low_stock` (não `healthy`) e `action_insight` orienta
   reabastecimento por perda de oportunidade de venda, citando os dias de estoque reais do
   produto (sem afirmar prazos incorretos, ex.: "não dura duas semanas" para um produto com
   25 dias).

3. **Given** um produto com dias de estoque entre 15 e 44 inclusive e IDD negativo,
   **When** o processamento conclui,
   **Then** `item_status` permanece `unbalanced`, sem alteração em relação à spec 009.

4. **Given** um produto com dias de estoque entre 15 e 44 inclusive e IDD acima de 20%,
   **When** o processamento conclui,
   **Then** `item_status` permanece `concentrated`, sem alteração em relação à spec 009.

5. **Given** um produto com estoque disponível na rede, demanda média igual a zero e dias de
   estoque calculados como nulos, não numéricos ou infinitos por impossibilidade matemática
   (estoque nunca zera),
   **When** o processamento conclui,
   **Then** `item_status` é `stuck_stock` (não `critical_rupture`) e `action_insight` explica
   que a demanda média é zero, que o estoque não tem giro e recomenda impulsionar vendas.

6. **Given** um produto com dias de estoque igual a zero real (sem unidades na rede),
   **When** o processamento conclui,
   **Then** `item_status` é `critical_rupture`, independentemente do IDD.

7. **Given** um produto com dias de estoque negativos por erro de cálculo,
   **When** o processamento conclui,
   **Then** dias de estoque são normalizados para zero e `item_status` é `critical_rupture`.

8. **Given** um produto com dias de estoque menores que 15,
   **When** o processamento conclui,
   **Then** `item_status` é `low_stock` e `action_insight` reflete estoque baixo por volume
   insuficiente, citando os dias reais.

9. **Given** um usuário cliente autenticado,
   **When** consulta qualquer aba ou relatório,
   **Then** status, insights e métricas exibidos são sempre os valores persistidos no
   processamento (nunca recalculados na sessão do cliente).

---

### User Story 2 - Navegação em três abas e visão executiva (Priority: P1)

Como usuário cliente, preciso acessar três destinos distintos — Dashboard, Produtos e
Exportação — pela navegação principal, e na aba Dashboard ver o gráfico de IDD por produto
junto a um resumo executivo da importação ativa, para obter uma leitura rápida da saúde do
estoque sem perder a visão gráfica já existente.

**Why this priority**: Reorganiza a principal superfície de valor do produto e entrega síntese
executiva antes da análise detalhada por produto.

**Independent Test**: Autenticar como cliente com importação ativa; navegar pelas três abas;
validar resumo executivo, gráfico e filtro simples por status na aba Dashboard.

**Acceptance Scenarios**:

1. **Given** um cliente autenticado em desktop ou mobile,
   **When** visualiza a navegação principal,
   **Then** vê três destinos: Dashboard, Produtos e Exportação, com item ativo destacado
   conforme o design system Prudens Index (spec 007).

2. **Given** a aba Dashboard com importação ativa,
   **When** a página carrega,
   **Then** o gráfico de barras de IDD por produto permanece visível abaixo do cabeçalho de
   índice da empresa.

3. **Given** a aba Dashboard,
   **When** o resumo executivo é exibido,
   **Then** apresenta cards/indicadores calculados sobre a importação ativa contendo:
   faturamento projetado total, capital imobilizado total, faturamento perdido total,
   quantidade de itens por cada um dos sete status, Top 3 itens mais preocupantes pelo grau
   de dinheiro em risco, produto com menor e maior dias de estoque, produto com menor e maior
   IDD, produto com maior e menor faturamento projetado, produto com maior capital
   imobilizado e produto com maior faturamento perdido.

4. **Given** o critério de "Top 3 itens mais preocupantes",
   **When** o resumo é calculado,
   **Then** a ordenação considera o grau de dinheiro em risco como a soma de faturamento
   perdido (por falta de estoque) e capital imobilizado (por falta de impulsionamento de
   vendas) de cada produto, listando os três maiores valores.

5. **Given** a aba Dashboard,
   **When** o cliente aplica filtro simples por um ou mais status,
   **Then** o gráfico de barras e o resumo executivo (quando aplicável ao indicador) refletem
   apenas produtos do subconjunto filtrado; filtros avançados (busca, faixas numéricas) não
   aparecem nesta aba.

6. **Given** a aba Dashboard sem importação ativa,
   **When** o cliente acessa,
   **Then** vê mensagem em pt-BR informando ausência de dados de estoque, consistente com o
   comportamento atual.

---

### User Story 3 - Análise detalhada na aba Produtos (Priority: P1)

Como usuário cliente, preciso consultar a tabela completa de produtos com todas as colunas
atuais mais Status, com ordenação, paginação e filtros completos, em uma aba dedicada, para
investigar itens específicos sem poluir a visão executiva.

**Why this priority**: Preserva e concentra a capacidade analítica detalhada que hoje existe
no dashboard monolítico.

**Independent Test**: Abrir aba Produtos; aplicar busca, filtros de status e faixas numéricas;
confirmar que tabela, ordenação e paginação refletem o mesmo subconjunto.

**Acceptance Scenarios**:

1. **Given** a aba Produtos com importação ativa,
   **When** a página carrega,
   **Then** exibe tabela com todas as colunas atuais (produto, EAN, lojas, distribuição,
   demanda, IDD, estoque, demanda média, dias de estoque, preço unitário, faturamento
   projetado, capital imobilizado, faturamento perdido) mais coluna Status com badge e
   tooltip conforme spec 009.

2. **Given** a aba Produtos,
   **When** o cliente abre a seção de filtros completos,
   **Then** encontra busca por nome/EAN, filtro por status (sete valores), faixas de IDD,
   dias de estoque e capital imobilizado — os mesmos filtros avançados hoje existentes,
   aplicados exclusivamente à tabela desta aba.

3. **Given** filtros ativos na aba Produtos,
   **When** o cliente consulta a tabela,
   **Then** apenas produtos do subconjunto filtrado são exibidos; gráfico e resumo da aba
   Dashboard não são alterados.

4. **Given** a tabela de produtos,
   **When** o cliente ordena por coluna ou navega páginas,
   **Then** ordenação e paginação funcionam normalmente dentro do subconjunto filtrado.

---

### User Story 4 - Exportação de planilhas e relatório PDF (Priority: P2)

Como usuário cliente, preciso baixar planilhas da importação atual ou de importações
anteriores concluídas e gerar um relatório PDF da situação de estoque, em uma aba dedicada,
para compartilhar dados e insights fora da plataforma.

**Why this priority**: Centraliza entregáveis exportáveis e adiciona relatório executivo
imprimível, complementando as abas de análise.

**Independent Test**: Abrir aba Exportação; baixar planilha ativa e de importação anterior;
gerar PDF; confirmar conteúdo, identidade visual e isolamento por empresa.

**Acceptance Scenarios**:

1. **Given** a aba Exportação,
   **When** o cliente acessa,
   **Then** vê opções para exportar a planilha da importação ativa e planilhas de importações
   concluídas anteriores da própria empresa, com indicação clara de qual versão está sendo
   baixada.

2. **Given** importação ativa disponível,
   **When** o cliente solicita exportação da versão atual,
   **Then** recebe o arquivo correspondente à planilha processada da importação ativa.

3. **Given** importações concluídas anteriores,
   **When** o cliente seleciona uma versão anterior e solicita download,
   **Then** recebe o arquivo da importação escolhida.

4. **Given** a aba Exportação,
   **When** o cliente solicita relatório PDF,
   **Then** a aplicação gera e entrega um PDF com identidade visual Prudens Index (logotipo,
   paleta verde primário/âmbar, tipografia, layout flat sem sombras).

5. **Given** o relatório PDF gerado,
   **When** o cliente o abre,
   **Then** encontra: introdução orientativa; situação geral da empresa com produtos
   agrupados por status; seção de resumo equivalente à aba Dashboard (totais financeiros,
   contagem por status e destaques); gráfico de variação de IDD ordenado do menor ao maior
   ao longo de todos os produtos; textos padronizados explicando como interpretar cada
   status, cada indicador e como agir.

6. **Given** um cliente autenticado,
   **When** tenta exportar planilha ou PDF,
   **Then** só acessa arquivos e dados da própria empresa; importações e relatórios de
   outras empresas não são visíveis nem baixáveis.

---

### Edge Cases

- Importação ativa sem produtos: abas exibem estados vazios coerentes em pt-BR; exportação de
  planilha ativa indisponível; PDF pode informar ausência de dados ou ficar indisponível.
- Empresa sem importações ancluídas: aba Exportação mostra apenas opções disponíveis (sem
  lista vazia enganosa de versões anteriores).
- Produto empatado no Top 3 de dinheiro em risco: desempate por ordem alfabética de nome do
  produto.
- Filtro por status na aba Dashboard com resumo: totais financeiros e contagens por status
  refletem o subconjunto filtrado; destaques de extremos (menor/maior dias, IDD, etc.)
  calculados sobre o subconjunto filtrado.
- Produto com demanda zero e dias indefinidos que também se enquadraria em faixa > 90 dias se
  calculável: regra de demanda zero com estoque disponível prevalece sobre ruptura.
- Produto com dias exatamente 30 na faixa 15–44 e IDD 0–20%: permanece `low_stock` (limite
  superior inclusivo para Estoque Baixo; Saudável exige dias > 30).
- Produto com dias exatamente 31 e IDD 0–20%: classifica como `healthy`.
- Reimportação de planilha: status, insights e métricas de resumo recalculados na nova
  importação; abas e PDF refletem dados da importação ativa.
- Cliente mobile: três destinos acessíveis pela barra inferior; resumo executivo empilhado de
  forma legível; tabela na aba Produtos com rolagem horizontal quando necessário.

## Requirements *(mandatory)*

### Functional Requirements

#### Ajustes na cascata de classificação (processamento server-side)

- **FR-001**: O sistema DEVE calcular `item_status` e `action_insight` exclusivamente durante
  o processamento da planilha, nunca no navegador do cliente.

- **FR-002**: O sistema DEVE avaliar as regras nesta ordem de precedência; o primeiro passo
  satisfeito define o status e encerra a avaliação:

  | Passo | Condição | Status resultante |
  | ----- | -------- | ----------------- |
  | 0 | Estoque disponível na rede, demanda média igual a zero, e dias de estoque nulos, não numéricos ou infinitos por impossibilidade de cálculo (estoque nunca zera) | `stuck_stock` |
  | 1 | Dias de estoque igual a 0 (incluindo normalização de valores negativos para 0) | `critical_rupture` |
  | 2 | Dias de estoque maior que 0 e menor que 15 | `low_stock` |
  | 3 | Dias de estoque maior que 90 | `stuck_stock` |
  | 4 | Dias de estoque maior ou igual a 45 e menor ou igual a 90 | `slight_excess` |
  | 5 | Dias de estoque entre 15 e 44 inclusive: IDD &lt; 0% → `unbalanced`; IDD &gt; 20% → `concentrated`; IDD entre 0% e 20% inclusive e dias &gt; 30 → `healthy`; IDD entre 0% e 20% inclusive e dias entre 15 e 30 inclusive → `low_stock` |

- **FR-003**: Nos passos 1 a 4 (exceto passo 0), o IDD NÃO DEVE influenciar o status.

- **FR-004**: As faixas de IDD negativo (`unbalanced`) e IDD acima de 20% (`concentrated`)
  dentro de 15–44 dias permanecem inalteradas em relação à spec 009.

#### Textos de insight atualizados

- **FR-005**: O `action_insight` de `low_stock` DEVE cobrir coerentemente as duas origens
  possíveis — dias abaixo de 15 e dias entre 15 e 30 com IDD na faixa saudável (0–20%) —
  interpolando os valores reais do produto e sem afirmar prazos incorretos (ex.: não usar
  "não dura duas semanas" quando o produto tem 25 dias de estoque).

- **FR-006**: O `action_insight` de `stuck_stock` originado pelo passo 0 (demanda zero com
  dias indefinidos) DEVE explicar que a demanda média é zero, que por isso o estoque não tem
  giro e recomendar impulsionar vendas; DEVE diferenciar-se do texto de encalhamento por
  excesso de dias (&gt; 90) da spec 009.

- **FR-007**: Os demais textos de insight, labels, cores de badge e ações práticas resumidas
  permanecem conforme spec 009, salvo as alterações de FR-005 e FR-006.

#### Navegação e estrutura de abas

- **FR-008**: A navegação do perfil cliente DEVE oferecer três destinos: Dashboard, Produtos
  e Exportação, na sidebar (desktop) e barra inferior (mobile), seguindo o design system
  spec 007.

- **FR-009**: Todas as novas abas e o relatório PDF DEVEM seguir o padrão visual Prudens
  Index: cores, tipografia, ausência de sombras/gradientes, cards com borda 0,5px, layout
  responsivo mobile-first.

#### Aba Dashboard

- **FR-010**: A aba Dashboard DEVE manter o gráfico de barras de IDD por produto e o
  cabeçalho de índice da empresa (IDD médio, nome, data da última atualização).

- **FR-011**: A aba Dashboard DEVE exibir seção de resumo executivo sobre a importação
  ativa com: faturamento projetado total, capital imobilizado total, faturamento perdido
  total, contagem por cada um dos sete status, Top 3 itens por dinheiro em risco (soma de
  faturamento perdido e capital imobilizado), extremos de dias de estoque (menor/maior),
  extremos de IDD (menor/maior), extremos de faturamento projetado (maior/menor), produto
  com maior capital imobilizado e produto com maior faturamento perdido.

- **FR-012**: A aba Dashboard DEVE oferecer filtro simples por status que altera o gráfico
  e o resumo executivo (quando o indicador for sensível ao subconjunto); filtros avançados
  (busca, faixas de IDD, dias de estoque, capital imobilizado) NÃO DEVEM aparecer nesta aba.

#### Aba Produtos

- **FR-013**: A aba Produtos DEVE exibir a tabela completa de produtos com todas as colunas
  atuais mais Status, com ordenação por coluna e paginação.

- **FR-014**: A aba Produtos DEVE concentrar a seção de filtros completos: busca por
  nome/EAN, filtro por status, faixas de IDD, dias de estoque e capital imobilizado,
  aplicados exclusivamente à tabela desta aba.

#### Aba Exportação

- **FR-015**: A aba Exportação DEVE permitir baixar a planilha da importação ativa e
  planilhas de importações concluídas anteriores da empresa, com seleção explícita da versão.

- **FR-016**: A aba Exportação DEVE permitir gerar e baixar relatório PDF produzido pela
  aplicação, contendo: introdução; produtos agrupados por status; resumo equivalente ao da
  aba Dashboard; gráfico de IDD ordenado do menor ao maior; textos orientativos sobre
  interpretação de status, indicadores e ações recomendadas. O PDF DEVE refletir sempre a
  importação ativa completa da empresa — sem filtro de status ou subconjunto opcional.

- **FR-017**: O relatório PDF DEVE seguir identidade visual INDEX (logotipo, paleta verde
  primário/âmbar, tipografia, layout flat sem sombras).

#### Isolamento e fonte de dados

- **FR-018**: Status, insights e métricas exibidos em qualquer aba ou PDF DEVEM ser os
  valores persistidos no processamento da importação; o cliente NÃO DEVE recalcular status ou
  métricas financeiras na sessão.

- **FR-019**: O cliente DEVE acessar apenas dados, arquivos exportáveis e relatórios da
  própria empresa; isolamento multi-empresa DEVE ser preservado.

### Key Entities

- **Importação ativa**: Conjunto de produtos processados mais recentemente para a empresa;
  fonte de verdade para abas Dashboard, Produtos e exportação da versão atual.

- **Importação concluída anterior**: Job de importação finalizado com sucesso, com planilha
  original armazenada e disponível para download histórico.

- **Produto de estoque**: Item com métricas persistidas (dias de estoque, IDD, demanda
  média, faturamento projetado, capital imobilizado, faturamento perdido, status, insight).

- **Resumo executivo**: Agregação calculada sobre produtos da importação ativa (ou subconjunto
  filtrado na aba Dashboard), incluindo totais financeiros, contagens por status e destaques
  de extremos.

- **Relatório PDF**: Documento gerado pela aplicação com situação geral, resumo, gráfico de
  IDD e textos orientativos, baseado na importação ativa da empresa.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em testes com planilhas cobrindo todas as faixas da cascata atualizada (incluindo
  passo 0, faixa 15–30 com IDD saudável e limites 30/31 dias), 100% dos produtos recebem o
  status esperado e `action_insight` coerente com os valores reais interpolados.

- **SC-002**: Usuários cliente localizam qualquer uma das três abas (Dashboard, Produtos,
  Exportação) em menos de 3 segundos após login, em teste moderado com 5 participantes.

- **SC-003**: O resumo executivo na aba Dashboard apresenta todos os indicadores definidos em
  FR-011 para importações com pelo menos 1 produto, verificável em 100% dos casos de teste.

- **SC-004**: Filtros completos na aba Produtos reduzem a tabela de forma idêntica à combinação
  status + busca + faixas numéricas em 100% dos casos de teste, sem afetar gráfico ou resumo
  da aba Dashboard.

- **SC-005**: Cliente consegue baixar planilha ativa, planilha de importação anterior e
  relatório PDF em menos de 30 segundos cada (exceto geração de PDF muito grande), em ambiente
  de teste representativo.

- **SC-006**: Relatório PDF gerado contém todas as seções obrigatórias (FR-016) e segue
  identidade visual INDEX, validável por checklist visual em 100% dos casos de amostra.

- **SC-007**: Tentativas de acesso a exportações ou relatórios de outra empresa resultam em
  bloqueio em 100% dos casos de teste de isolamento.

## Assumptions

- A matriz de sete status, badges, cores e tooltips da spec 009 permanecem válidos, exceto
  pelos ajustes de cascata e textos de insight descritos nesta spec.

- Faturamento projetado, capital imobilizado e faturamento perdido já são calculados e
  persistidos por produto no processamento existente; o resumo executivo agrega esses valores
  da importação ativa.

- "Dinheiro em risco" para o Top 3 é a soma aritmética de faturamento perdido e capital
  imobilizado de cada produto; produtos com ambos zerados não entram no ranking.

- Planilhas de importações anteriores já estão armazenadas de forma recuperável (spec de
  importação); esta feature expõe o download na aba Exportação sem alterar o fluxo de upload
  admin.

- O relatório PDF é gerado sob demanda a partir dos dados persistidos da importação ativa, sem
  exigir filtros ativos do usuário (relatório completo da empresa).

- Textos padronizados do PDF (introdução, interpretação de status e orientações de ação) são
  fixos em pt-BR, com valores dinâmicos apenas nas seções de dados e gráfico.

- Reprocessamento ou nova importação recalcula status e insights conforme a cascata atualizada;
  produtos existentes refletem as novas regras na primeira importação bem-sucedida após
  implantação.

- Formatação numérica e monetária em insights e resumo segue convenção brasileira (pt-BR),
  conforme spec 009.

- Escopo limitado ao perfil cliente e às regras de status no processamento; telas admin não
  são reorganizadas em abas, salvo se referenciarem exportações já existentes.

- Dependência do design system (spec 007) para navegação, cards, tipografia e identidade visual;
  dependência da spec 009 para estrutura base de status, badges e gráfico de IDD.
