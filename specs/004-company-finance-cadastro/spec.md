# Feature Specification: Cadastro de Empresas, Valor Unitário e Métricas Financeiras

**Feature Branch**: `004-company-finance-cadastro`  
**Created**: 2026-05-28  
**Status**: Draft  
**Input**: User description: "Adicionar campos de cadastro completo de empresas, fluxo de criação de empresa no admin, novo campo de Valor Unitário na planilha e três colunas financeiras calculadas server-side, além de corrigir o layout da tabela do cliente para eliminar scroll horizontal."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Cadastrar nova empresa no admin (Priority: P1)

Como administrador, quero criar uma empresa com dados cadastrais básicos a partir da listagem principal e ser levado diretamente à tela de importações dessa empresa, para iniciar o onboarding com upload da primeira planilha sem passos extras.

**Why this priority**: Sem criação de empresa no produto, o fluxo operacional depende de cadastro manual externo e atrasa a primeira importação.

**Independent Test**: Pode ser testado criando uma empresa apenas com nome obrigatório e campos opcionais vazios, validando redirecionamento automático para imports e ausência de chamadas à API quando há erro de validação no formulário.

**Acceptance Scenarios**:

1. **Given** a listagem de empresas no admin, **When** a página carrega, **Then** existe botão visível "Nova empresa" no topo da listagem.
2. **Given** o formulário de nova empresa, **When** o admin preenche nome e submete com sucesso, **Then** a empresa é criada e o sistema navega automaticamente para a tela de importações dessa empresa.
3. **Given** o formulário com campos inválidos, **When** o admin tenta submeter, **Then** erros aparecem inline em cada campo afetado e nenhuma requisição de criação é enviada.
4. **Given** campos cadastrais opcionais vazios, **When** a empresa é criada, **Then** o cadastro é aceito sem bloqueio por dados incompletos.

---

### User Story 2 - Importar planilha com Valor Unitário e métricas financeiras (Priority: P2)

Como administrador, quero que a planilha aceite a coluna "Valor Unitário" e que o sistema calcule e persista automaticamente Faturamento Projetado, Capital Imobilizado e Faturamento Perdido por produto durante o processamento, para que o cliente veja indicadores financeiros confiáveis sem cálculo manual.

**Why this priority**: É o núcleo de valor analítico desta feature; depende de empresa existente, mas entrega o diferencial financeiro do produto.

**Independent Test**: Pode ser testado importando planilha com coluna "Valor Unitário" preenchida e verificando no resultado do job que cada linha válida possui os três valores financeiros persistidos conforme as fórmulas definidas.

**Acceptance Scenarios**:

1. **Given** planilha com coluna "Valor Unitário" válida, **When** o processamento conclui, **Then** cada linha válida persiste `unit_price` junto aos demais campos do produto.
2. **Given** valores de estoque, demanda média e valor unitário de uma linha, **When** o processamento calcula métricas financeiras, **Then** os resultados seguem exatamente as fórmulas:
   - Faturamento Projetado = arredondar(min(estoque, demanda_media) × valor_unitario)
   - Capital Imobilizado = arredondar(max(0, estoque - demanda_media) × valor_unitario)
   - Faturamento Perdido = arredondar(max(0, demanda_media - estoque) × valor_unitario)
3. **Given** linha com erro em "Valor Unitário" ou campos usados nas fórmulas, **When** a validação falha, **Then** a linha é reportada com erro acionável (linha/coluna/motivo) e as demais linhas válidas continuam sendo processadas.
4. **Given** processamento concluído, **When** os dados são consultados posteriormente, **Then** os três valores financeiros permanecem disponíveis como inteiros arredondados por linha de produto.

---

### User Story 3 - Visualizar produtos com colunas financeiras e layout sem scroll horizontal (Priority: P3)

Como usuário cliente, quero ver na tabela de produtos a coluna Valor Unitário e as três métricas financeiras calculadas (Faturamento Projetado, Capital Imobilizado e Faturamento Perdido), todas formatadas em reais, em uma área central que caiba na tela sem barra de rolagem horizontal, para analisar o portfólio com conforto em desktop.

**Why this priority**: Entrega visibilidade do valor gerado pela feature anterior, mas depende dos dados calculados no processamento.

**Independent Test**: Pode ser testado na dashboard do cliente com dataset importado, verificando presença das quatro colunas monetárias após as colunas operacionais existentes, formatação em BRL e ausência de scroll horizontal em resoluções desktop padrão.

**Acceptance Scenarios**:

1. **Given** produtos com `unit_price` e métricas financeiras persistidas, **When** a tabela do cliente é exibida, **Then** aparecem as colunas Valor Unitário, Faturamento Projetado, Capital Imobilizado e Faturamento Perdido após as colunas já existentes.
2. **Given** valor de métrica financeira inteira persistida, **When** a célula é renderizada, **Then** o valor é exibido formatado como moeda em reais (BRL) sem casas decimais.
3. **Given** valor unitário persistido, **When** a célula é renderizada, **Then** o valor é exibido formatado como moeda em reais (BRL) com duas casas decimais.
4. **Given** viewport desktop padrão (largura mínima 1280px), **When** o usuário navega pela dashboard do cliente, **Then** não há scroll horizontal na página nem na área central da tabela.
5. **Given** ajustes de layout aplicados, **When** a tabela é exibida, **Then** o espaçamento lateral esquerdo é reduzido e as colunas utilizam melhor a largura disponível sem padding excessivo nas bordas.

---

### Edge Cases

- Empresa criada com nome inválido (vazio ou muito curto) ou com slug/nome que gere conflito de unicidade deve exibir erro compreensível no formulário em pt-BR, sem redirecionamento.
- CNPJ informado com máscara ou apenas dígitos deve ser normalizado/validado de forma consistente quando preenchido.
- UF informada com mais ou menos de 2 caracteres deve falhar validação inline no formulário.
- Planilha sem coluna "Valor Unitário" deve falhar de forma clara no processamento (cabeçalho ausente ou inválido).
- Linha com `unit_price` vazio, texto ou negativo deve gerar erro de validação da linha com motivo em português.
- Linha com estoque ou demanda média ausentes/inválidos deve impedir cálculo financeiro daquela linha e reportar erro específico.
- Valores financeiros muito grandes após arredondamento devem persistir sem overflow inesperado no armazenamento inteiro.
- Tabela do cliente com muitas colunas deve manter legibilidade sem scroll horizontal, priorizando ajuste proporcional de largura e compactação visual.
- Paginação, filtros e ordenação existentes devem continuar funcionando incluindo as novas colunas financeiras.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST armazenar na entidade empresa os campos opcionais: CNPJ, endereço (logradouro e número), bairro, cidade e UF (2 caracteres).
- **FR-002**: O sistema MUST permitir criação de empresa sem exigir preenchimento de CNPJ, endereço, bairro, cidade ou UF.
- **FR-003**: A listagem principal de empresas no admin MUST exibir botão "Nova empresa" no topo.
- **FR-004**: O formulário de nova empresa MUST conter os campos: nome da empresa, CNPJ, endereço, bairro, cidade e UF.
- **FR-005**: O formulário MUST validar campos no cliente e exibir erros inline por campo antes de enviar requisição quando houver inconsistências.
- **FR-006**: Após criação bem-sucedida de empresa, o sistema MUST redirecionar automaticamente para a tela de importações da empresa recém-criada.
- **FR-007**: A planilha MUST aceitar a coluna "Valor Unitário" (tipo numérico decimal) mapeada para persistência como preço unitário do produto.
- **FR-008**: O processamento de importação MUST calcular e persistir server-side, por linha válida, os campos Faturamento Projetado, Capital Imobilizado e Faturamento Perdido usando exclusivamente estoque, demanda média e valor unitário da própria linha.
- **FR-009**: Os três campos financeiros MUST ser arredondados para inteiro antes da persistência.
- **FR-010**: O cliente MUST NOT calcular nem alterar os valores financeiros; exibição é somente leitura dos dados persistidos.
- **FR-011**: A tabela de produtos do cliente MUST exibir, após as colunas já existentes, as colunas Valor Unitário, Faturamento Projetado, Capital Imobilizado e Faturamento Perdido.
- **FR-012**: Os valores monetários na interface do cliente MUST ser exibidos formatados como moeda em reais (BRL); as três métricas financeiras calculadas sem casas decimais e o Valor Unitário com duas casas decimais.
- **FR-013**: A área central da dashboard do cliente (incluindo tabela de produtos) MUST evitar scroll horizontal em resoluções desktop padrão.
- **FR-014**: O layout da dashboard do cliente MUST reduzir espaçamento lateral esquerdo e otimizar uso de largura para acomodar colunas adicionais sem overflow horizontal.
- **FR-015**: Mensagens de validação e interface desta feature MUST estar em português brasileiro para o usuário final.

### Key Entities

- **Empresa**: Representa o cliente cadastrado; inclui identificação (nome), identificador operacional (slug), dados cadastrais opcionais (CNPJ, endereço, bairro, cidade, UF) e metadados de criação/atualização.
- **Produto de estoque (linha importada)**: Representa um item da planilha ativa da empresa; inclui dados operacionais existentes mais `unit_price` e os três indicadores financeiros inteiros calculados no processamento.
- **Job de importação**: Representa execução de processamento da planilha; mantém status, erros por linha e vínculo com os produtos persistidos da importação ativa.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em teste de usabilidade com admin, 100% dos participantes conseguem criar uma empresa e chegar à tela de importações em até 2 minutos sem orientação externa.
- **SC-002**: Em planilha de teste com 100 linhas válidas contendo "Valor Unitário", pelo menos 99% das linhas válidas exibem os três indicadores financeiros corretos conforme fórmulas de referência.
- **SC-003**: Em resoluções desktop de 1280px, 1440px e 1920px de largura, 100% das verificações manuais da dashboard do cliente não apresentam barra de rolagem horizontal.
- **SC-004**: Usuários cliente identificam corretamente, em teste com 10 linhas amostrais, os valores de Valor Unitário e das três métricas financeiras formatados em reais em pelo menos 95% dos casos.
- **SC-005**: Tentativas de submissão com erro de validação no formulário de nova empresa resultam em feedback inline imediato em 100% dos campos inválidos, sem criação parcial de registro.

## Assumptions

- O nome da empresa é obrigatório no cadastro; demais campos cadastrais permanecem opcionais.
- O identificador interno de URL (slug) é gerado automaticamente a partir do nome quando não informado pelo usuário, mantendo unicidade.
- CNPJ, quando informado, é validado como identificador brasileiro de 14 dígitos (com ou sem máscara de pontuação).
- UF, quando informada, deve conter exatamente 2 letras (preferencialmente maiúsculas).
- A planilha padrão passa de 11 para **12 colunas** com "Valor Unitário" como última coluna do cabeçalho; planilhas no formato antigo falham na validação estrutural com mensagem clara em pt-BR (breaking change operacional documentado).
- "Valor Unitário" é obrigatório no cabeçalho; por linha, célula vazia, texto ou valor ≤ 0 gera erro de linha com mensagem acionável em português (não é opcional para linhas válidas).
- `demanda_media` nas fórmulas corresponde ao campo já existente de demanda média da planilha por linha; estoque ou demanda média ausentes/inválidos na linha impedem processamento daquela linha com erro por coluna em pt-BR.
- Métricas financeiras calculadas (Faturamento Projetado, Capital Imobilizado, Faturamento Perdido) são exibidas em BRL sem casas decimais; Valor Unitário é exibido em BRL com duas casas decimais.
- Fluxos de paginação, filtros e ordenação da tabela do cliente permanecem compatíveis com as novas colunas.
- Dependências funcionais: fluxo de importação e dashboard do cliente já existentes nas specs anteriores permanecem a base desta evolução.

## Out of Scope

- Edição completa de empresa após criação (alteração cadastral em massa ou histórico de alterações).
- Suporte mobile/tablet dedicado para layout da tabela (foco desta entrega: desktop padrão).
- Exportação PDF/Excel com layout financeiro customizado além do comportamento atual de exportação.
- Reprocessamento retroativo automático de importações antigas sem nova importação manual.
