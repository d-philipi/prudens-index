# Feature Specification: Autenticação Customizada, Dashboard do Cliente e Exportação de Planilha

**Feature Branch**: `008-custom-auth-client-ui`  
**Created**: 2026-05-28  
**Status**: Draft  
**Input**: Implementar telas de autenticação customizadas no padrão visual do Prudens Index, corrigir componentes de seleção, melhorar a barra de filtros e a tabela da tela do cliente, corrigir o cálculo de arredondamento da demanda média, ajustar posicionamento do logotipo na sidebar e substituir exportação PDF por exportação do arquivo Excel ativo.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Login customizado com escolha de perfil (Priority: P1)

Como visitante, quero fazer login em uma tela totalmente alinhada à identidade Prudens Index, escolhendo se entro como Cliente ou Administrador antes de informar e-mail e senha, para reconhecer o produto e evitar confusão entre perfis.

**Why this priority**: É o ponto de entrada de toda a aplicação; substitui qualquer interface padrão do provedor de identidade visível ao usuário.

**Independent Test**: Acessar a rota pública de login sem sessão; verificar card centralizado, logotipo, campos de e-mail e senha, seletor de perfil, cores dinâmicas por perfil e ausência de componentes visuais do provedor de identidade.

**Acceptance Scenarios**:

1. **Given** visitante não autenticado, **When** acessa a tela de login, **Then** vê card centralizado vertical e horizontalmente com logotipo tipográfico "Prudens/INDEX" no topo, campo de e-mail, campo de senha e seletor de perfil com opções "Cliente" e "Administrador".
2. **Given** perfil "Administrador" selecionado, **When** a tela é exibida, **Then** o botão de login, elementos decorativos abaixo do botão (formas geométricas flat relacionadas a dados, gráficos e estoque) e o acento visual da tela usam a cor verde #1a4731.
3. **Given** perfil "Cliente" selecionado, **When** a tela é exibida, **Then** os mesmos elementos (botão, decorativos, acento) usam a cor âmbar #d4a020.
4. **Given** troca de perfil no seletor, **When** o usuário alterna entre Cliente e Administrador, **Then** a mudança de cor ocorre com transição suave de 300ms.
5. **Given** credenciais válidas coerentes com o perfil selecionado, **When** o login conclui, **Then** o usuário é redirecionado à área correspondente (dashboard do cliente ou painel administrativo).
6. **Given** credenciais válidas mas incompatíveis com o perfil selecionado, **When** o login é tentado, **Then** mensagem em português orienta a escolher o perfil correto, sem expor interface do provedor de identidade.
7. **Given** qualquer tela de autenticação desta entrega, **When** inspecionada, **Then** o provedor de identidade atua apenas como backend (autenticação e gestão de usuários); nenhum widget, modal ou página padrão do provedor é exibido ao usuário final.

---

### User Story 2 - Verificação por código e criação de senha após convite (Priority: P1)

Como usuário em fluxo de verificação ou convite, quero telas customizadas para informar código de confirmação ou definir minha senha inicial, com a mesma identidade visual do login, para concluir o acesso sem interfaces genéricas.

**Why this priority**: Completa os fluxos de segurança e onboarding iniciados pelo provedor de identidade, mantendo experiência única da marca.

**Independent Test**: Disparar fluxo que exige código (quando aplicável) ou abrir link de convite; validar layout do card, campos, botão verde e redirecionamento pós-sucesso.

**Acceptance Scenarios**:

1. **Given** fluxo de autenticação que exige verificação por código, **When** o usuário é direcionado à tela de confirmação, **Then** vê card no mesmo padrão do login (logotipo no topo), campo para o código e botão de confirmar em verde #1a4731.
2. **Given** link de convite válido recebido por e-mail, **When** o usuário acessa, **Then** é direcionado à tela de criação de senha com logotipo, campo de nova senha, campo de confirmação de senha e botão confirmar em verde #1a4731.
3. **Given** senhas preenchidas conforme política de segurança, **When** o usuário confirma, **Then** a conta é ativada e ele é redirecionado ao dashboard correspondente ao seu perfil (cliente ou administrador).
4. **Given** código inválido ou senhas que não atendem à política, **When** o usuário submete, **Then** recebe feedback em português sem abandonar o padrão visual do card.

---

### User Story 3 - Controles de seleção padronizados em toda a aplicação (Priority: P1)

Como usuário de qualquer área do produto, quero que todo campo de seleção tenha a mesma aparência e comportamento, para reconhecer controles rapidamente e evitar inconsistência visual.

**Why this priority**: Afeta login, convites, filtros e formulários futuros; elimina controles nativos ou genéricos fora da identidade Index.

**Independent Test**: Percorrer tela de login (perfil), formulário de convite de usuário (empresa), filtros de status na dashboard e demais telas com seleção; confirmar ausência de `<select>` nativo ou dropdown sem identidade visual.

**Acceptance Scenarios**:

1. **Given** qualquer campo de seleção na aplicação (existente ou novo), **When** renderizado, **Then** usa o componente de seleção customizado padronizado do Index — nunca elemento select nativo do navegador nem dropdown genérico sem customização.
2. **Given** o componente de seleção customizado, **When** exibido, **Then** apresenta borda 0,5px na cor #e2e2de, border-radius 8px, tipografia Inter 13px e ícone de chevron com animação ao abrir/fechar.
3. **Given** a tela de login, **When** o usuário escolhe perfil, **Then** o seletor segue este padrão.
4. **Given** o formulário de convite de usuário no admin, **When** o admin escolhe empresa, **Then** o seletor de empresa segue este padrão.
5. **Given** filtros da dashboard do cliente, **When** há filtro por status ou equivalente em formato de seleção, **Then** usa o mesmo componente padronizado.

---

### User Story 4 - Barra de filtros horizontal na dashboard do cliente (Priority: P1)

Como usuário cliente, quero filtros organizados em uma linha horizontal clara, com intervalos numéricos baseados nos meus dados reais e rótulos que explicam o que estou filtrando, para refinar produtos sem adivinhar limites fixos arbitrários.

**Why this priority**: Melhora a principal ferramenta de análise de estoque; sliders com min/max dinâmicos evitam filtros inúteis ou enganosos.

**Independent Test**: Carregar dashboard com produtos; expandir barra de filtros; validar layout flex em uma linha, labels, ranges de IDD, dias de estoque e capital imobilizado com valores inicializados pelos dados da empresa.

**Acceptance Scenarios**:

1. **Given** barra de filtros expandida em viewport adequado, **When** o usuário visualiza os controles, **Then** os itens distribuem-se de forma equilibrada em uma única linha horizontal com espaçamento uniforme (layout flex com gap consistente).
2. **Given** cada filtro na barra, **When** exibido, **Then** possui label claro acima do controle.
3. **Given** filtros de IDD, dias de estoque e capital imobilizado, **When** renderizados, **Then** são controles de intervalo com dois pontos (mínimo e máximo) e valores selecionados legíveis ao lado ou abaixo dos pontos.
4. **Given** produtos carregados para a empresa, **When** os filtros de intervalo são inicializados, **Then** o valor mínimo de cada slider é o menor valor daquele atributo entre todos os produtos carregados e o máximo é o maior — calculados a partir dos dados retornados, não valores fixos pré-definidos.
5. **Given** um filtro de intervalo ativo, **When** o usuário ajusta os limites, **Then** um label descritivo abaixo do controle resume o intervalo em português (ex.: "Produtos com IDD entre -45% e +88%", "Estoque para até 120 dias").
6. **Given** qualquer controle na barra de filtros, **When** inspecionado visualmente, **Then** segue o padrão visual do Prudens Index (bordas, tipografia, cores) coerente com o sistema de design existente.

---

### User Story 5 - Tooltips explicativos no cabeçalho da tabela de produtos (Priority: P2)

Como usuário cliente analisando a tabela, quero entender o significado de cada coluna por um ícone de ajuda ao lado do nome no cabeçalho, sem perder a capacidade de ordenar ao clicar no nome da coluna.

**Why this priority**: Reduz erros de interpretação de métricas complexas (IDD, demanda, capital imobilizado); complementa a tabela já existente.

**Independent Test**: Passar o ponteiro sobre o ícone de informação de cada coluna; verificar texto em português; clicar no **nome** da coluna para ordenar (com ou sem tooltip visível).

**Acceptance Scenarios**:

1. **Given** tabela de produtos na dashboard do cliente, **When** o usuário passa o ponteiro sobre o ícone de informação (i) ao lado do nome da coluna no cabeçalho, **Then** aparece tooltip em português com a explicação definida para aquela coluna (conforme tabela de textos na seção de requisitos).
2. **Given** tooltip visível no ícone de informação, **When** o usuário clica no **nome** da coluna para ordenar, **Then** a ordenação ocorre normalmente — o tooltip não bloqueia nem consome o clique de ordenação no label.
3. **Given** cada coluna listada nos requisitos de tooltip, **When** testada, **Then** exibe o texto correspondente (Produto, EAN, Lojas c/ estoque, Distribuição, Lojas c/ demanda, Demanda x Dist., IDD, Estoque, Demanda média, Dias estoque, V. unit., Fat. projetado, Cap. imobilizado, Fat. perdido, Status).

---

### User Story 6 - Demanda média truncada em métricas financeiras (Priority: P1)

Como usuário cliente ou administrador, quero que faturamento projetado, capital imobilizado e faturamento perdido usem demanda média sempre truncada para baixo (nunca arredondada para cima), para que os valores financeiros reflitam a regra de negócio acordada.

**Why this priority**: Corrige distorção em cálculos financeiros; impacto direto em decisões de estoque e projeções.

**Independent Test**: Com produtos cuja demanda média tenha parte decimal (ex.: 0,9 ou 1,9), comparar métricas financeiras exibidas com o resultado esperado usando parte inteira inferior (0 e 1 respectivamente).

**Acceptance Scenarios**:

1. **Given** demanda média de 0,9 unidades para um produto, **When** o sistema calcula faturamento projetado, capital imobilizado ou faturamento perdido, **Then** utiliza demanda efetiva 0 em todas as fórmulas.
2. **Given** demanda média de 1,9 unidades, **When** o sistema calcula qualquer das três métricas financeiras, **Then** utiliza demanda efetiva 1.
3. **Given** qualquer ponto do produto que derive métricas financeiras a partir de demanda média, **When** o cálculo é executado, **Then** a truncagem para o inteiro inferior ocorre antes de qualquer operação aritmética subsequente — nunca arredondamento para cima.
4. **Given** mesmos dados de entrada, **When** métricas são exibidas na dashboard e em exportações ou relatórios derivados dos mesmos cálculos, **Then** os valores permanecem consistentes com a mesma regra de truncagem.

---

### User Story 7 - Exportar planilha ativa em vez de PDF (Priority: P1)

Como usuário cliente, quero baixar o arquivo Excel original que está marcado como ativo para minha empresa, para trabalhar offline com a mesma fonte importada no sistema.

**Why this priority**: Substitui exportação PDF por necessidade operacional real; entrega o artefato que alimenta os dados.

**Independent Test**: Com empresa que possui importação ativa, acionar "Exportar planilha"; verificar download do arquivo original com nome preservado; sem geração de PDF.

**Acceptance Scenarios**:

1. **Given** dashboard do cliente com planilha ativa disponível, **When** o usuário aciona o botão "Exportar planilha" (com ícone de download), **Then** recebe o arquivo Excel original armazenado para aquela empresa — não um arquivo novo gerado e não um PDF.
2. **Given** download em andamento, **When** o arquivo está sendo transferido, **Then** o botão exibe estado de carregamento.
3. **Given** download concluído, **When** o usuário abre o arquivo, **Then** o nome do arquivo corresponde ao nome original da importação ativa.
4. **Given** empresa sem planilha ativa disponível, **When** a dashboard é exibida, **Then** o botão de exportação permanece desabilitado com tooltip em português explicando que não há planilha ativa para exportar.
5. **Given** a interface da dashboard, **When** inspecionada, **Then** não há opção de exportar PDF nesta entrega.

---

### User Story 8 - Logotipo centralizado na sidebar (Priority: P2)

Como usuário autenticado, quero ver o logotipo "Prudens/INDEX" centralizado na sidebar em qualquer estado, para identidade visual equilibrada ao expandir ou colapsar a navegação.

**Why this priority**: Correção visual pontual que afeta todas as telas autenticadas; baixo risco e alto impacto na percepção de qualidade.

**Independent Test**: Alternar sidebar expandida/colapsada; verificar centralização horizontal do logotipo completo e da variante abreviada.

**Acceptance Scenarios**:

1. **Given** sidebar expandida, **When** o usuário visualiza o topo, **Then** o texto "Prudens/INDEX" está centralizado horizontalmente dentro da largura da sidebar.
2. **Given** sidebar colapsada, **When** o usuário visualiza o topo, **Then** exibe apenas "PI" (ou ícone equivalente definido no design) centralizado, sem texto cortado ou desalinhado.
3. **Given** transição entre estados expandido e colapsado, **When** a animação ocorre, **Then** o logotipo permanece visualmente centrado em ambos os estados.

---

### Edge Cases

- Login com perfil errado mas credenciais corretas: mensagem orientativa; sessão não deve abrir área incorreta.
- Fluxo de código expirado ou inválido: mensagem em português com opção de reenvio quando o provedor permitir.
- Convite expirado ou já utilizado na tela de senha: mensagem orientando contato com administrador.
- Empresa sem produtos carregados: filtros de intervalo exibem estado vazio ou desabilitado com mensagem clara, sem sliders com intervalo inválido.
- Todos os produtos com mesmo valor em um atributo (min = max): slider de intervalo permanece utilizável ou comunica intervalo único de forma legível.
- Tooltip em cabeçalho em dispositivo touch: ícone de informação deve abrir tooltip por foco ou toque no ícone; ordenação permanece no label da coluna.
- Demanda média negativa ou nula: truncagem para inteiro inferior preserva zero ou valor negativo truncado conforme regra matemática de truncagem para baixo.
- Download interrompido: botão retorna ao estado normal com possibilidade de nova tentativa.
- Usuário cliente tenta exportar sem permissão ou sessão expirada durante download: erro amigável em português.
- Seletor de perfil no login com teclado: navegação e confirmação acessíveis sem depender apenas de mouse.

## Requirements *(mandatory)*

### Functional Requirements

#### Autenticação customizada (sem UI do provedor)

- **FR-001**: O sistema MUST oferecer tela de login customizada com e-mail, senha e seletor de perfil ("Cliente" / "Administrador"), logotipo "Prudens/INDEX" no topo do card e layout centralizado.
- **FR-002**: O sistema MUST alterar cor do botão de login, elementos decorativos abaixo do botão e acento visual para #1a4731 quando "Administrador" está selecionado e #d4a020 quando "Cliente" está selecionado, com transição de cor de 300ms.
- **FR-003**: Os elementos decorativos abaixo do botão de login MUST ser formas geométricas flat evocando dados, gráficos e estoque, mudando de cor junto com o perfil.
- **FR-004**: O sistema MUST NOT exibir interface padrão do provedor de identidade ao usuário final; o provedor MUST ser usado exclusivamente como backend de autenticação e gestão de usuários.
- **FR-005**: O sistema MUST oferecer tela customizada de confirmação de código quando o fluxo exigir verificação, no mesmo padrão de card e logotipo, com botão confirmar em #1a4731.
- **FR-006**: O sistema MUST oferecer tela customizada de criação de senha após convite (nova senha + confirmação), com botão confirmar em #1a4731 e redirecionamento ao dashboard do perfil após sucesso.
- **FR-007**: O sistema MUST validar coerência entre perfil selecionado no login e perfil real da conta, com mensagens em português quando houver incompatibilidade.

#### Seleção padronizada

- **FR-008**: Todo campo de seleção na aplicação MUST usar o componente de seleção customizado padronizado do Index.
- **FR-009**: O sistema MUST NOT renderizar elemento select nativo do navegador nem dropdown genérico sem identidade visual Index em nenhuma tela coberta.
- **FR-010**: O componente de seleção customizado MUST usar borda 0,5px #e2e2de, border-radius 8px, fonte Inter 13px e chevron animado.

#### Sidebar

- **FR-011**: O logotipo "Prudens/INDEX" na sidebar MUST estar centralizado horizontalmente no estado expandido.
- **FR-012**: No estado colapsado, a sidebar MUST exibir "PI" ou ícone equivalente centralizado, sem texto cortado ou desalinhado.

#### Barra de filtros (dashboard cliente)

- **FR-013**: A barra de filtros expandida MUST distribuir controles em uma linha horizontal com layout flex e gap uniforme.
- **FR-014**: Cada filtro MUST ter label acima do controle.
- **FR-015**: Filtros de IDD, dias de estoque e capital imobilizado MUST ser intervalos com mínimo e máximo ajustáveis e valores selecionados visíveis ao lado ou abaixo dos controles.
- **FR-016**: Limites iniciais de cada filtro de intervalo MUST ser o mínimo e o máximo observados nos produtos carregados da empresa, derivados dos dados retornados — não limites fixos pré-definidos independentes dos dados da empresa.
- **FR-017**: Cada filtro de intervalo MUST exibir label descritivo em português abaixo, resumindo o intervalo selecionado (ex.: faixa de IDD em percentual, dias de estoque).

#### Tabela de produtos — tooltips

- **FR-018**: Cada coluna da tabela de produtos MUST exibir tooltip em português ao passar o ponteiro (ou focar, em teclado/touch) no ícone de informação adjacente ao nome da coluna no cabeçalho, com os textos definidos em FR-019; o trigger do tooltip MUST NOT ser o mesmo elemento clicável usado para ordenação.
- **FR-019**: Os tooltips MUST usar exatamente os significados abaixo:
  - **Produto**: nome completo do produto conforme cadastrado na planilha.
  - **EAN**: código de identificação do produto usado pelos fabricantes.
  - **Lojas c/ estoque**: quantidade de lojas da rede que possuem este produto em estoque.
  - **Distribuição**: percentual de lojas que possuem o produto em relação ao total de lojas da empresa.
  - **Lojas c/ demanda**: quantidade de lojas que registraram vendas deste produto nos últimos 3 meses.
  - **Demanda x Dist.**: razão entre as lojas com demanda e as lojas com estoque, em percentual.
  - **IDD**: Índice de Distribuição e Demanda. Mede o equilíbrio entre onde o produto está e onde ele é vendido. Negativo indica excesso de estoque sem demanda correspondente.
  - **Estoque**: quantidade total do produto somada entre todas as filiais.
  - **Demanda média**: média mensal de unidades vendidas calculada com base no histórico de vendas.
  - **Dias estoque**: projeção de quantos dias o estoque atual durará considerando a demanda média.
  - **V. unit.**: valor unitário do produto em reais.
  - **Fat. projetado**: estimativa do faturamento gerado nos próximos 30 dias com o estoque atual.
  - **Cap. imobilizado**: valor financeiro do estoque que sobra após 30 dias sem ser vendido.
  - **Fat. perdido**: valor que a empresa deixa de faturar por falta de estoque para suprir a demanda dos 30 dias.
  - **Status**: classificação do produto com base no IDD.
- **FR-020**: A ordenação da coluna MUST ocorrer ao clicar no nome/label da coluna; o ícone de tooltip MUST NOT interceptar esse clique.

#### Cálculo de demanda média em métricas financeiras

- **FR-021**: Para cálculo de faturamento projetado, capital imobilizado e faturamento perdido, o sistema MUST usar demanda média truncada para o inteiro inferior antes de qualquer operação aritmética (ex.: 0,9 → 0; 1,9 → 1; nunca arredondar para cima).
- **FR-022**: A regra de truncagem MUST aplicar-se de forma consistente em todos os pontos que derivam essas três métricas a partir de demanda média (interface do cliente, serviços de dados e qualquer relatório ou exportação que reutilize os mesmos cálculos).

#### Exportação de planilha

- **FR-023**: O botão na dashboard do cliente MUST exibir o rótulo "Exportar planilha" com ícone de download.
- **FR-024**: Ao acionar exportação com planilha ativa, o sistema MUST entregar o arquivo Excel original marcado como ativo para a empresa, sem gerar novo arquivo derivado e sem exportar PDF.
- **FR-025**: O arquivo baixado MUST preservar o nome original da importação ativa.
- **FR-026**: Durante o download, o botão MUST indicar estado de carregamento.
- **FR-027**: Sem planilha ativa disponível, o botão MUST permanecer desabilitado com tooltip em português explicando o motivo.

### Key Entities

- **Sessão de autenticação**: Credenciais e perfil escolhido no login; resultado redireciona para área cliente ou admin.
- **Convite / ativação**: Link de e-mail que leva à tela de definição de senha; associa perfil e empresa (quando cliente).
- **Produto (visão dashboard)**: Atributos filtráveis incluindo IDD, dias de estoque, capital imobilizado, demanda média e métricas financeiras derivadas.
- **Importação ativa**: Registro da planilha Excel vigente para a empresa; fonte do arquivo exportável.
- **Arquivo de planilha original**: Blob armazenado com nome e conteúdo da importação ativa; entregue integralmente no download.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% das rotas públicas de autenticação cobertas exibem apenas UI customizada Prudens Index — zero componentes visuais padrão do provedor de identidade em auditoria de aceite.
- **SC-002**: Usuários concluem login com perfil correto em até 2 tentativas em 95% dos casos de teste de aceite com contas válidas pré-configuradas.
- **SC-003**: 100% dos campos de seleção nas telas de login, convite de usuário e filtros da dashboard do cliente usam o componente padronizado em inspeção visual e de acessibilidade.
- **SC-004**: Para conjunto de teste com demanda média fracionária, 100% dos valores de faturamento projetado, capital imobilizado e faturamento perdido coincidem com cálculo manual usando truncagem para inteiro inferior.
- **SC-005**: Exportação com planilha ativa entrega arquivo byte-a-byte equivalente ao original importado (mesmo nome e conteúdo) em 100% dos casos de teste de aceite.
- **SC-006**: Usuários com planilha ativa iniciam download em até 5 segundos após clicar em "Exportar planilha" em ambiente de aceite com conectividade normal.
- **SC-007**: Em teste de usabilidade com 5 usuários cliente, pelo menos 4 identificam corretamente o significado de IDD e "Dias estoque" após ler apenas os tooltips do cabeçalho, sem documentação externa.
- **SC-008**: Logotipo na sidebar permanece centralizado em ambos os estados em 100% dos viewports desktop cobertos pelo sistema de design (≥ 1280px).

## Assumptions

- O provedor de identidade (Clerk) permanece configurado para e-mail/senha, convites e verificação; apenas a camada visual é customizada nesta entrega.
- Fluxos de login, código e senha pós-convite reutilizam o layout de autenticação já definido no sistema de design (fundo #f5f5f3, card branco, bordas 0,5px, **sem sombra projetada**) da spec 007.
- Tooltips de coluna usam ícone de informação separado do label ordenável (ver FR-018/FR-020).
- Validação SC-001 exige checklist do Clerk Dashboard (hosted pages desabilitadas) documentado em `quickstart.md` antes de testes E2E de auth.
- A regra de truncagem de demanda média aplica-se somente às três métricas financeiras citadas; outros usos de demanda média (ex.: exibição na coluna "Demanda média") podem continuar mostrando o valor calculado com decimais, salvo alinhamento explícito em planejamento.
- "Planilha ativa" segue o mesmo conceito de importação vigente já existente no produto (specs de importação e dashboard).
- Remoção de exportação PDF é substituição direta; não há requisito de manter PDF em paralelo.
- Textos de tooltip e mensagens de erro permanecem em português (pt-BR).
- Dependência das specs 005 (convites restritos) e 007 (design system) para navegação, cores e rotas base; esta spec refina e corrige sem redefinir governança de usuários.
