# Feature Specification: Correções de Usabilidade e Idioma da UI

**Feature Branch**: `[003-fix-ui-usability]`  
**Created**: 2026-05-27  
**Status**: Draft  
**Input**: User description: "Corrigir erros de usabilidade na interface do Prudens Index identificados após a implementação da spec 002. As correções abrangem o sistema de mensagens de erro, a internacionalização da UI para português, a navegação entre abas do admin e ajustes visuais e funcionais nas telas de admin e cliente."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Corrigir mensagens e idioma na UI (Priority: P1)

Como operador administrativo, quero que toda a interface e todas as mensagens visíveis estejam em português brasileiro e que erros de validação da planilha sejam detalhados e acionáveis, para corrigir rapidamente os dados sem ambiguidade.

**Why this priority**: Erros genéricos e textos em inglês impedem o uso operacional diário e aumentam retrabalho no fluxo crítico de importação.

**Independent Test**: Pode ser testado importando uma planilha com linhas válidas e inválidas e navegando pelas telas principais para verificar que toda string visível está em pt-BR e que cada erro exibe linha, coluna original e motivo claro.

**Acceptance Scenarios**:

1. **Given** que o usuário está na interface de admin ou cliente, **When** qualquer elemento textual é renderizado, **Then** o texto aparece em português brasileiro sem termos em inglês.
2. **Given** uma planilha com linhas inválidas e válidas, **When** o processamento termina, **Then** o sistema mantém as linhas válidas e exibe relatório de erros por linha com número da linha, nome original da coluna e motivo objetivo.
3. **Given** um erro de tipo em célula da planilha, **When** o relatório é exibido, **Then** o usuário vê o esperado, o recebido e orientação de correção sem mensagens genéricas.

---

### User Story 2 - Melhorar navegação e contexto no admin (Priority: P2)

Como admin, quero navegar entre empresas, detalhe da empresa e imports com breadcrumbs e ação de retorno explícita, mantendo visível o resumo geral da empresa, para não me perder no fluxo administrativo.

**Why this priority**: Navegação e contexto são essenciais para produtividade do admin, mas não bloqueiam totalmente o fluxo de processamento.

**Independent Test**: Pode ser testado acessando listagem de empresas, abrindo detalhe e imports e validando breadcrumb clicável, botão "Voltar para empresas" e seção fixa de informações gerais no topo.

**Acceptance Scenarios**:

1. **Given** a página de imports de uma empresa, **When** o usuário deseja retornar, **Then** existe um botão visível com label "Voltar para empresas" que leva à listagem principal.
2. **Given** qualquer nível de navegação no admin (lista, detalhe, imports), **When** a página é carregada, **Then** o breadcrumb mostra o caminho hierárquico atual com níveis clicáveis.
3. **Given** o detalhe de uma empresa com troca de abas, **When** o usuário alterna entre abas, **Then** a seção inicial de informações gerais da empresa permanece visível.

---

### User Story 3 - Ajustar visualização de dados no cliente (Priority: P3)

Como usuário cliente, quero visualizações de gráfico e tabela mais legíveis para analisar produtos com rapidez em listas grandes.

**Why this priority**: Melhora a experiência analítica e reduz confusão visual, mas depende da base de dados e navegação já funcionando.

**Independent Test**: Pode ser testado na dashboard do cliente com alto volume de produtos, verificando ausência de legenda no gráfico, tooltip com identificação correta, cores por status e paginação completa com cabeçalho fixo e percentuais visíveis.

**Acceptance Scenarios**:

1. **Given** o gráfico de barras de IDD com muitos produtos, **When** a tela é exibida, **Then** não há legenda inferior e a identificação ocorre via tooltip com nome do produto e valor de IDD.
2. **Given** produtos com diferentes status, **When** o gráfico é renderizado, **Then** as barras usam as cores de status já definidas no sistema.
3. **Given** a tabela de produtos com múltiplas páginas, **When** o usuário navega, **Then** pode ir para primeira, anterior, próxima e última página, além de selecionar páginas disponíveis e ver página atual e total.
4. **Given** rolagem vertical na tabela, **When** o usuário percorre muitas linhas, **Then** o cabeçalho permanece fixo e as colunas "Distribuição", "Demanda x Dist." e "IDD" exibem símbolo de porcentagem no cabeçalho e nas células.

---

### Edge Cases

- Planilha com múltiplos erros na mesma linha deve gerar uma entrada por coluna/erro ou uma entrada consolidada que ainda preserve todas as colunas afetadas de forma legível.
- Relatório de erros com alto volume de linhas inválidas deve continuar consultável na aba de imports sem bloquear o uso da página.
- Breadcrumb deve se manter consistente mesmo quando a página é acessada diretamente por URL profunda.
- Se dados cadastrais da empresa estiverem parcialmente ausentes, a seção geral deve manter estrutura estável com indicação clara de ausência de informação.
- Em tabelas com poucas linhas (sem necessidade de scroll), cabeçalho fixo não deve causar sobreposição visual.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST exibir todos os textos visíveis ao usuário final em português brasileiro (pt-BR), incluindo labels, títulos, placeholders, botões, estados vazios, mensagens de sucesso e erro, tooltips e textos de apoio.
- **FR-002**: O sistema MUST impedir a exibição de strings em inglês nas telas de admin e cliente para fluxos cobertos por esta feature.
- **FR-003**: O sistema MUST gerar relatório de erros de processamento de planilha com detalhamento por ocorrência contendo, no mínimo, número da linha da planilha, nome original da coluna em português e motivo do erro em linguagem clara.
- **FR-004**: O sistema MUST informar motivo acionável para cada erro de planilha, incluindo o que era esperado e o que foi recebido sempre que aplicável.
- **FR-005**: O sistema MUST evitar mensagens genéricas para erro de planilha em superfícies de operador; códigos internos podem existir, mas não podem ser a única informação exibida.
- **FR-006**: O sistema MUST continuar processando linhas válidas quando houver linhas inválidas na planilha e sinalizar individualmente as linhas com erro.
- **FR-007**: O sistema MUST manter o relatório de erros acessível na aba de imports da empresa após o processamento.
- **FR-008**: A tela de imports da empresa MUST exibir botão explícito "Voltar para empresas" com navegação para a página principal de admin.
- **FR-009**: As páginas de listagem de empresas, detalhe da empresa e imports MUST exibir breadcrumb visível com hierarquia atual e níveis clicáveis para retorno ao nível correspondente.
- **FR-010**: O detalhe da empresa MUST exibir seção inicial de informações gerais antes das abas com, no mínimo, nome da empresa, informações cadastrais disponíveis, total de produtos, IDD médio atual e data da última atualização.
- **FR-011**: A seção inicial de informações gerais da empresa MUST permanecer visível independentemente da aba ativa abaixo dela.
- **FR-012**: O gráfico de barras de IDD na tela do cliente MUST remover legenda inferior e usar tooltip para identificação do produto e valor do IDD ao passar o mouse.
- **FR-013**: As barras do gráfico de IDD MUST seguir a paleta de cores já definida no sistema para cada `item_status`.
- **FR-014**: A tabela de produtos do cliente MUST oferecer paginação completa com ações para primeira, anterior, próxima, última e seleção de páginas disponíveis.
- **FR-015**: A tabela de produtos MUST exibir de forma clara a página atual e o total de páginas.
- **FR-016**: O cabeçalho da tabela de produtos MUST permanecer fixo durante scroll vertical.
- **FR-017**: As colunas "Distribuição", "Demanda x Dist." e "IDD" MUST exibir símbolo de porcentagem no cabeçalho e em todas as células de valor.

### Key Entities *(include if feature involves data)*

- **Ocorrência de Erro de Importação**: Registro de falha por linha/coluna durante processamento da planilha, com atributos de localização (linha e coluna original), descrição acionável e contexto de correção para operador.
- **Contexto de Navegação Admin**: Representa o caminho hierárquico atual (lista de empresas, detalhe de empresa, imports) e seus níveis navegáveis para retorno.
- **Resumo de Empresa**: Conjunto de informações permanentes exibidas no topo do detalhe da empresa, incluindo indicadores operacionais e dados cadastrais disponíveis.
- **Estado de Paginação da Tabela de Produtos**: Estado de navegação da lista com página atual, total de páginas e comandos de deslocamento.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% das strings visíveis nas telas cobertas pela feature são apresentadas em português brasileiro em validação de aceite.
- **SC-002**: Em importações com falhas parciais, 100% dos erros exibidos ao operador incluem linha e coluna da planilha, e pelo menos 95% incluem motivo objetivo acionável sem texto genérico.
- **SC-003**: Pelo menos 95% dos operadores conseguem identificar e corrigir uma linha inválida da planilha em até 2 minutos usando apenas o relatório exibido na interface.
- **SC-004**: Em teste de usabilidade com navegação admin, 100% dos usuários conseguem retornar à listagem de empresas a partir da aba de imports sem usar botão voltar do navegador.
- **SC-005**: Em cenários com tabela extensa, 95% dos usuários conseguem navegar para primeira/última página e localizar a página atual sem ajuda externa.
- **SC-006**: Em revisão visual do dashboard cliente, o gráfico de IDD é considerado legível para análise com alto volume por pelo menos 90% dos avaliadores internos.

## Assumptions

- As cores por `item_status` já existentes permanecem válidas e são reutilizadas sem redefinição de semântica.
- Existe fonte de dados disponível para compor total de produtos, IDD médio e última atualização no resumo da empresa.
- O relatório de erros pode ser armazenado e recuperado sem alterar o comportamento de processamento parcial já aceito no sistema.
- O escopo desta feature cobre as telas e fluxos explicitamente mencionados (imports admin, detalhe de empresa, dashboard cliente com gráfico e tabela).
