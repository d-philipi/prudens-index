# Feature Specification: Alinhamento de Estoque, Status por IDD e Painéis Admin/Cliente

**Feature Branch**: `002-align-stock-dashboards`  
**Created**: 2026-05-22  
**Status**: Draft  
**Input**: User description: "Corrigir o mapeamento de colunas da tabela stock_products para que correspondam exatamente à planilha de origem em nome e tipagem, recalcular server-side o campo item_status com base no IDD, e implementar as telas de admin e de cliente conforme o layout e as informações definidas."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Dados de produto fiéis à planilha (Priority: P1)

Como administrador da plataforma, preciso que cada importação de planilha de estoque grave os
produtos com os mesmos significados, nomes lógicos e tipos que a planilha de origem define, para
que relatórios e painéis reflitam fielmente o arquivo enviado pelo cliente.

**Why this priority**: Sem mapeamento e tipagem corretos, métricas e classificações derivadas
(incluindo status por IDD) ficam incorretas para todo o restante do produto.

**Independent Test**: Importar uma planilha válida com linhas conhecidas e verificar, no registro
persistido de cada produto, que todos os campos listados na seção de mapeamento correspondem
valor a valor à planilha (incluindo contagens inteiras e percentuais decimais).

**Acceptance Scenarios**:

1. **Given** uma planilha válida com cabeçalhos canônicos,
   **When** o processamento do job conclui com sucesso,
   **Then** cada linha de produto é armazenada com os campos `product_name`, `ean`,
   `stores_with_stock`, `distribution`, `branches_with_demand`, `demand_vs_distribution`,
   `idd`, `stock`, `average_demand` e `stock_days` preenchidos conforme a linha da planilha.

2. **Given** uma coluna de contagem de lojas na planilha com valor inteiro,
   **When** o produto é persistido,
   **Then** o valor armazenado é numérico inteiro (não lista textual de filiais).

3. **Given** colunas percentuais ou médias na planilha,
   **When** o produto é persistido,
   **Then** os valores correspondentes são armazenados como números decimais compatíveis com
   percentuais e médias (não como texto).

4. **Given** uma planilha com cabeçalho ou tipo inválido,
   **When** o admin tenta importar,
   **Then** o job falha antes de publicar dados para o dashboard do cliente, com mensagem
   clara sobre a inconsistência.

---

### User Story 2 - Status do item calculado apenas no servidor por IDD (Priority: P1)

Como responsável por operações de estoque, preciso que cada produto receba automaticamente um
status operacional derivado exclusivamente do IDD no momento do processamento, para que todos
os usuários vejam a mesma classificação estável e confiável.

**Why this priority**: O IDD é o índice principal do negócio; o status orienta ações de
redistribuição, manutenção ou impulsionamento.

**Independent Test**: Processar planilhas de teste com IDD negativo, entre 0 e 20, e acima de 20;
confirmar o status persistido sem alterar a classificação na interface do cliente.

**Acceptance Scenarios**:

1. **Given** um produto com IDD negativo na planilha,
   **When** o job de importação conclui,
   **Then** o `item_status` persistido é `distribution` (produto precisa de redistribuição entre
   filiais).

2. **Given** um produto com IDD entre 0 e 20 inclusive,
   **When** o job de importação conclui,
   **Then** o `item_status` persistido é `adequate` (situação adequada).

3. **Given** um produto com IDD maior que 20,
   **When** o job de importação conclui,
   **Then** o `item_status` persistido é `boost` (produto precisa de impulsionamento por
   marketing ou promoção).

4. **Given** um usuário cliente autenticado,
   **When** ele consulta produtos no dashboard,
   **Then** o status exibido é sempre o valor já persistido no processamento (nunca recalculado
   na sessão do cliente).

5. **Given** IDD ausente ou inválido em uma linha,
   **When** a linha é processada,
   **Then** o sistema aplica regra documentada em Assumptions para classificação e registra
   o resultado de forma auditável no job.

---

### User Story 3 - Admin monitora empresas e importações (Priority: P2)

Como administrador da plataforma, preciso de uma visão consolidada de todas as empresas e de
cada empresa em detalhe — incluindo histórico de planilhas e qual arquivo alimenta o dashboard
do cliente — para operar importações e suporte sem ambiguidade.

**Why this priority**: Permite governança dos dados por cliente e rastreio da fonte ativa.

**Independent Test**: Com duas empresas e jobs em estados distintos, o admin localiza uma empresa
pela busca, abre o detalhe e identifica o arquivo ativo e o status de cada importação.

**Acceptance Scenarios**:

1. **Given** um admin autenticado na área administrativa,
   **When** ele abre a tela principal de admin,
   **Then** vê total de empresas, total de produtos (todas as empresas) e uma lista com IDD
   médio de cada empresa (nome da empresa + valor médio dos produtos da importação ativa
   daquela empresa).

2. **Given** várias empresas cadastradas,
   **When** o admin digita parte do nome na busca,
   **Then** a lista de cards exibe apenas empresas cujo nome corresponde ao texto buscado.

3. **Given** um card de empresa na lista,
   **When** o admin o seleciona,
   **Then** navega para a página de detalhe com dados cadastrais, lista de arquivos importados
   com status de cada job e indicação explícita de qual importação está ativa como fonte do
   dashboard do cliente.

4. **Given** um usuário sem perfil de administrador,
   **When** tenta acessar as telas de admin,
   **Then** o acesso é negado.

---

### User Story 4 - Cliente analisa saúde do estoque com filtros unificados (Priority: P2)

Como usuário cliente, preciso visualizar o IDD médio da minha empresa, comparar o IDD de cada
produto em um gráfico e explorar a tabela completa com busca, filtros e exportação PDF, para
priorizar ações de estoque e marketing com base nos mesmos dados filtrados.

**Why this priority**: Entrega o valor operacional do produto após importação correta.

**Independent Test**: Com dados processados para a empresa do cliente, abrir o dashboard,
aplicar busca e filtros, confirmar que gráfico, tabela e PDF refletem o mesmo subconjunto.

**Acceptance Scenarios**:

1. **Given** importação ativa concluída para a empresa do cliente,
   **When** o cliente abre o dashboard,
   **Then** vê na barra superior o IDD médio da empresa em destaque, nome da empresa e data da
   última atualização dos dados.

2. **Given** o dashboard carregado,
   **When** o cliente observa a região central,
   **Then** vê um gráfico de barras com o IDD de cada produto (eixo ou rótulos permitem
   identificar produtos em situação crítica, adequada ou de impulsionamento conforme faixas de
   IDD).

3. **Given** a lista de produtos abaixo do gráfico,
   **When** o cliente visualiza a tabela,
   **Then** todas as colunas de produto da fonte ativa são exibidas mais `item_status`, com
   ordenação por coluna e paginação.

4. **Given** texto de busca por nome ou EAN na barra lateral,
   **When** o cliente pesquisa,
   **Then** gráfico de barras e tabela mostram apenas produtos correspondentes.

5. **Given** filtro por `item_status` na barra lateral,
   **When** o cliente seleciona um ou mais status,
   **Then** gráfico e tabela atualizam para o mesmo conjunto filtrado.

6. **Given** o dashboard do cliente,
   **When** o cliente utiliza a barra lateral,
   **Then** não há filtro por filial (a planilha fonte expõe apenas contagens agregadas de
   lojas); os únicos filtros disponíveis são busca por nome ou EAN e filtro por `item_status`.

7. **Given** filtros e busca aplicados,
   **When** o cliente aciona exportação em PDF na barra lateral,
   **Then** recebe um relatório contendo os dados atualmente filtrados (não o conjunto completo
   sem filtros).

8. **Given** nenhuma importação ativa concluída,
   **When** o cliente abre o dashboard,
   **Then** vê estado vazio explicando que os dados ainda não estão disponíveis.

9. **Given** dados de duas empresas no sistema,
   **When** um usuário cliente da Empresa A acessa o dashboard,
   **Then** vê somente produtos e métricas da Empresa A.

---

### Edge Cases

- Planilha com IDD exatamente 0, 20 ou valores negativos próximos de zero: classificação deve
  seguir limites inclusivos/exclusivos definidos (0–20 inclusive para `adequate`).
- Linha sem EAN ou com EAN duplicado na mesma importação: produto ainda importável; busca por
  EAN retorna todas as correspondências ou política única documentada em Assumptions.
- Empresa sem produtos importados: IDD médio da empresa e indicadores globais tratam ausência
  sem erro (ex.: exibir zero produtos e IDD médio indisponível ou zero, de forma consistente).
- Job de importação falhou: não altera fonte ativa do dashboard; detalhe da empresa mostra
  status de falha e mensagem compreensível.
- Nova importação concluída: substitui conjunto ativo; data de última atualização no dashboard
  reflete a conclusão do job ativo.
- Volume alto (milhares de produtos): paginação na tabela e gráfico permanecem utilizáveis sem
  travar a navegação principal.
- Valores numéricos fora de faixa esperada na planilha (percentual > 100, contagens negativas):
  rejeitar linha ou job conforme validação de importação, com feedback ao admin.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE mapear a coluna de planilha "PRODUTO" para o campo `product_name`
  (texto, obrigatório por linha válida).

- **FR-002**: O sistema DEVE mapear "EAN" para `ean` (texto, código interno do fabricante).

- **FR-003**: O sistema DEVE mapear "Lojas com estoque" para `stores_with_stock` (inteiro:
  quantidade de lojas com estoque daquele produto).

- **FR-004**: O sistema DEVE mapear "distribuição" para `distribution` (decimal: percentual de
  lojas com o produto em relação ao total de lojas da empresa).

- **FR-005**: O sistema DEVE mapear "Lojas com demanda nos últ 3 meses" para
  `branches_with_demand` (inteiro: quantidade de lojas com estoque que registraram demanda nos
  últimos três meses).

- **FR-006**: O sistema DEVE mapear "Demanda x Distribuição" para `demand_vs_distribution`
  (decimal, tratado como percentual/razão).

- **FR-007**: O sistema DEVE mapear "IDD" para `idd` (decimal, percentual; índice principal de
  distribuição e demanda).

- **FR-008**: O sistema DEVE mapear "estoque" para `stock` (inteiro: soma de quantidade entre
  filiais).

- **FR-009**: O sistema DEVE mapear "demanda media" para `average_demand` (decimal: média
  racional da demanda com base no estoque).

- **FR-010**: O sistema DEVE mapear "dias estoque" para `stock_days` (decimal: projeção de dias
  de duração do estoque atual).

- **FR-011**: O sistema NÃO DEVE derivar `item_status` de colunas da planilha; DEVE calculá-lo
  somente durante o processamento server-side e persisti-lo com o produto.

- **FR-012**: Se IDD < 0, `item_status` DEVE ser `distribution`.

- **FR-013**: Se IDD ≥ 0 e IDD ≤ 20, `item_status` DEVE ser `adequate`.

- **FR-014**: Se IDD > 20, `item_status` DEVE ser `boost`.

- **FR-015**: Usuários cliente NÃO DEVEM recalcular nem sobrescrever `item_status` no navegador;
  a interface DEVE exibir e filtrar apenas o valor persistido no processamento da planilha.

- **FR-016**: A tela principal do admin DEVE exibir painel com: (1) total de empresas
  cadastradas, (2) total de produtos em todas as empresas (importação ativa) e (3) lista
  `avgIddByCompany` retornada pela API — cada item com nome da empresa e IDD médio daquela
  empresa (média de IDD dos produtos da importação ativa). O terceiro indicador NÃO é um único
  número global; é a visão por empresa alimentada por `GET /api/admin/metrics`.

- **FR-017**: A tela principal do admin DEVE listar empresas em cards com busca textual por
  nome, mostrando por card: nome, IDD médio da empresa, quantidade de produtos e informações
  básicas de cadastro (ex.: data de cadastro).

- **FR-018**: Cada card de empresa DEVE levar à página de detalhe com cadastro, histórico de
  arquivos importados, status de cada job e indicação do arquivo/fonte ativa para o dashboard
  do cliente.

- **FR-019**: O dashboard do cliente DEVE apresentar três regiões: barra superior (IDD médio,
  nome da empresa, última atualização), barra lateral fixa (busca por nome ou EAN, filtro por
  `item_status`, exportação PDF — sem filtro por filial) e área central (gráfico de barras por
  produto/IDD e tabela paginada e ordenável).

- **FR-020**: Busca por nome ou EAN e filtros de `item_status` DEVEM aplicar o mesmo subconjunto
  de produtos ao gráfico de barras e à tabela simultaneamente.

- **FR-021**: A exportação PDF DEVE refletir exclusivamente os produtos visíveis após busca e
  filtros atuais.

- **FR-022**: A tabela do cliente DEVE exibir todas as colunas de produto persistidas da importação
  ativa mais `item_status`, nesta ordem: `product_name`, `ean`, `stores_with_stock`,
  `distribution`, `branches_with_demand`, `demand_vs_distribution`, `idd`, `stock`,
  `average_demand`, `stock_days`, `item_status`.

- **FR-023**: Apenas administradores autenticados DEVEM acessar telas e ações de admin; clientes
  DEVEM acessar somente o dashboard da própria empresa.

- **FR-024**: Dados exibidos ao cliente DEVEM sempre corresponder à importação marcada como
  fonte ativa para aquela empresa.

### Key Entities *(include if feature involves data)*

- **Empresa (Company)**: Organização cliente com nome, dados cadastrais, conjunto de produtos e
  importações; possui IDD médio derivado da média de IDD dos produtos ativos.

- **Job de importação (Import Job)**: Envio de planilha com ciclo de vida (enfileirado,
  processando, concluído, falhou), metadados de arquivo e flag de fonte ativa para dashboard.

- **Produto de estoque (Stock Product)**: Registro por linha de planilha com os campos mapeados
  em FR-001–FR-010, vínculo à empresa e ao job, mais `item_status` calculado.

- **Status do item (Item Status)**: Classificação operacional (`distribution`, `adequate`,
  `boost`) determinada apenas pelo IDD no processamento.

- **Métricas globais de admin**: Agregados cross-empresa para painel superior (contagens e array
  `avgIddByCompany` com IDD médio calculado no banco por empresa).

- **Relatório PDF do cliente**: Instantâneo exportável do conjunto filtrado atual de produtos e
  colunas visíveis.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em testes com planilha de referência, 100% das linhas válidas persistem todos os
  campos mapeados com tipos corretos (inteiro vs decimal vs texto) em auditoria amostral.

- **SC-002**: Em suite de casos de IDD (negativo, 0, 20, 21+), 100% dos produtos recebem o
  `item_status` esperado no processamento, sem divergência na visualização do cliente.

- **SC-003**: Administradores localizam uma empresa pelo nome em menos de 10 segundos com busca,
  em catálogo de até 100 empresas.

- **SC-004**: Na página de detalhe da empresa, o admin identifica qual importação está ativa em
  uma única visualização, sem consultar suporte técnico.

- **SC-005**: Clientes com importação ativa abrem o dashboard e veem barra de IDD médio, gráfico
  e tabela coerentes entre si em menos de 5 segundos para até 2.000 produtos.

- **SC-006**: Após aplicar busca e filtros, 100% das exportações PDF em teste contêm somente
  produtos do subconjunto filtrado (mesma contagem que tabela/gráfico).

- **SC-007**: Nenhum usuário cliente em testes de isolamento visualiza produtos ou métricas de
  outra empresa (0 vazamentos em cenários de duas empresas).

## Assumptions

- Cabeçalhos da planilha seguem os rótulos canônicos descritos (incluindo grafia de "demanda
  media" e "Lojas com demanda nos últ 3 meses"); variações exigem nova versão de template.

- Renomeação de colunas no armazenamento (ex.: `stores_with_stock`, `average_demand`) aplica-se
  a novos processamentos; dados históricos podem exigir reimportação para alinhar tipos e nomes.

- Valores de IDD ausentes ou não numéricos em uma linha: preferência de rejeitar a linha com erro
  explícito no job; se a linha for aceita, IDD ausente é tratado como 0 para classificação
  (`adequate`).

- Filtro por filial no dashboard do cliente está **fora do escopo** nesta entrega (decisão
  Q1:A): a planilha canônica fornece contagens agregadas (`stores_with_stock`,
  `branches_with_demand`), não identificadores de filial por produto.

- O gráfico de barras usa IDD por produto no eixo de valores; identificação do produto no eixo
  de categorias usa nome ou EAN conforme espaço disponível.

- "Informações básicas de cadastro" nos cards de empresa incluem pelo menos nome e data de
  criação; campos adicionais seguem o cadastro já existente da plataforma.

- Autenticação e papéis (admin vs cliente) reutilizam o modelo de acesso já existente do produto.

- Filtros e busca no cliente operam **via API** (`GET /api/client/products` com paginação cursor
  server-side); o frontend envia `term`, `item_status`, `sort`, `order` e `cursor` como query
  params. Gráfico (`chart_data`), tabela (`items`) e PDF DEVEM compartilhar os mesmos filtros
  e a mesma importação ativa — sem filtragem principal em memória no navegador.

- Colunas legadas não listadas pelo usuário (ex.: categoria genérica) não são exibidas no
  dashboard do cliente nesta entrega, salvo se ainda necessárias para compatibilidade interna.

- Desempenho: SC-005 exige primeira carga coerente (overview + primeira página + `chart_data`)
  em até 5 segundos com até 2.000 produtos; `chart_data` limitado a 500 pontos no servidor.

- Importação com erros parciais de linha: cabeçalho inválido falha o job inteiro antes de
  ativar dados; linhas inválidas são ignoradas com registro por número de linha — job conclui
  com `completed` se ao menos uma linha for persistida, ou `failed` se nenhuma linha válida.
