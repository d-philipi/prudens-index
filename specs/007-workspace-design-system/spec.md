# Feature Specification: Sistema de Design Workspace — Prudens Index

**Feature Branch**: `007-workspace-design-system`  
**Created**: 2026-05-28  
**Status**: Draft  
**Input**: Implementar o sistema de design e identidade visual do Prudens Index em todas as telas existentes, substituindo a UI atual por uma interface funcional inspirada no Google Workspace — flat, densa e familiar para gestores e empresários.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Navegação e identidade consistentes (Priority: P1)

Como gestor ou administrador, quero reconhecer imediatamente o Prudens Index e mover-me entre as áreas principais por uma navegação lateral densa e previsível (ou barra inferior no celular), para trabalhar com a mesma familiaridade de ferramentas de produtividade corporativa.

**Why this priority**: O layout e a marca envolvem todas as telas; sem isso, o restante da interface permanece fragmentado.

**Independent Test**: Pode ser testado abrindo qualquer tela autenticada (cliente ou admin), verificando logotipo, paleta, tipografia, sidebar ou barra mobile, item ativo e persistência do estado colapsado da sidebar após recarregar a página.

**Acceptance Scenarios**:

1. **Given** viewport desktop ≥ 1280px, **When** o usuário autenticado acessa qualquer tela da aplicação coberta, **Then** vê layout de duas colunas com sidebar fixa à esquerda (220px expandida ou 64px colapsada) sobre fundo verde primário #1a4731 e área de conteúdo com fundo #f5f5f3 sem barra de rolagem horizontal.
2. **Given** sidebar expandida, **When** o usuário visualiza o topo da sidebar, **Then** o logotipo tipográfico exibe "Prudens/" em peso regular, "INDEX" em negrito, e apenas "DEX" na cor âmbar #d4a020; demais caracteres em branco sobre o fundo verde.
3. **Given** sidebar com itens Dashboard, Produtos, Empresas, Usuários e Importações, **When** o usuário está em uma rota correspondente, **Then** o item ativo tem fundo branco 10% de opacidade, texto branco, borda esquerda 3px #d4a020; itens inativos usam texto branco a 65% de opacidade e hover a 85%.
4. **Given** sidebar expandida, **When** o usuário aciona o controle de colapso no rodapé da sidebar, **Then** a largura anima em 200ms para 64px mostrando apenas ícones centralizados e o estado escolhido permanece após novo carregamento da aplicação.
5. **Given** viewport mobile, **When** o usuário autenticado navega, **Then** a sidebar lateral não aparece e a navegação principal fica em barra inferior com ícones equivalentes aos itens desktop.
6. **Given** qualquer página autenticada, **When** o conteúdo é exibido, **Then** o header da página mostra título em Plus Jakarta Sans 18px peso 500 e subtítulo em Inter 13px cor #6b7280, separados do corpo por 24px sem linha divisória visível.

---

### User Story 2 - Dashboard do cliente para análise de estoque (Priority: P1)

Como usuário cliente, quero ver o IDD médio da minha empresa em destaque, um gráfico de barras e uma tabela densa de produtos com filtros que afetam gráfico e tabela ao mesmo tempo, para decidir ações de estoque com rapidez.

**Why this priority**: É a principal superfície de valor do produto para o perfil cliente.

**Independent Test**: Pode ser testado na dashboard do cliente com dados reais ou de demonstração, validando card de índice, gráfico, painel de filtros, tabela paginada e sincronização filtro → gráfico + tabela.

**Acceptance Scenarios**:

1. **Given** dados de overview da empresa, **When** a dashboard carrega, **Then** um card de largura total com fundo #1a4731 exibe o label "IDD MÉDIO DA EMPRESA" em 10px maiúsculas com 60% de opacidade, valor numérico em 32px negrito com fonte monoespaçada (vermelho #f87878 se negativo, verde #86efac se positivo), e à direita o nome da empresa e data da última atualização.
2. **Given** produtos com status de item, **When** o gráfico de barras é exibido abaixo do card, **Then** ocupa largura total, barras vermelhas para Distribuição, verdes para Adequado e âmbar #f59e0b para Impulsionar, sem legenda inferior; ao passar o ponteiro sobre uma barra, tooltip mostra nome do produto e valor de IDD com símbolo de porcentagem.
3. **Given** a barra de filtros fechada, **When** o usuário abre pelo controle "Filtros" à direita com chevron, **Then** a área expande em transição de 200ms com busca por nome ou EAN, checkboxes de status com indicador colorido por status, slider de IDD de −100 a +100, slider de dias de estoque de 0 a 365 e slider de capital imobilizado; o chevron rotaciona 180° quando aberto.
4. **Given** qualquer filtro ativo, **When** a interface é exibida, **Then** aparece ação "Limpar filtros" e gráfico e tabela refletem apenas os itens filtrados.
5. **Given** lista de produtos paginada, **When** o usuário rola a tabela, **Then** o cabeçalho permanece fixo no topo (sticky), linhas com 40px de altura e texto 12px; colunas numéricas usam fonte monoespaçada; Distribuição, Demanda x Dist. e IDD exibem % no cabeçalho e células; valores financeiros em R$ com separador de milhar; IDD negativo em vermelho #e84040, entre 0 e 20 em verde #16a34a, acima de 20 em âmbar #f59e0b; coluna Status com badges pill nas cores de status.
6. **Given** múltiplas páginas de produtos, **When** o usuário consulta a tabela, **Then** vê contador com total de itens e página atual acima da tabela e paginação completa abaixo (primeira, anterior, páginas numeradas, próxima, última).

---

### User Story 3 - Painel administrativo alinhado ao mesmo sistema (Priority: P2)

Como administrador, quero visão geral, listagem e detalhe de empresas, usuários, importações e cadastros com a mesma linguagem visual densa e flat, para operar o sistema sem alternar entre “dois produtos” visuais.

**Why this priority**: Garante coerência operacional para o time interno após a base cliente estar definida.

**Independent Test**: Pode ser testado percorrendo rotas autenticadas do admin (`/admin`, empresas, detalhe, nova empresa, imports globais e por empresa, `/admin/usuarios`) com shell e tokens da US1. Telas de entrada e convite pertencem à **US4** (não a esta story).

**Acceptance Scenarios**:

1. **Given** a visão geral do admin, **When** a página carrega, **Then** cards de métricas globais no topo usam fundo #f5f5f3, borda 0,5px #e2e2de, sem sombra; abaixo, grid de cards de empresas com busca textual; cada card mostra nome, IDD médio com cor condicional (mesma regra do cliente), quantidade de produtos e data de cadastro.
2. **Given** detalhe de uma empresa, **When** o admin abre a página, **Then** a seção superior exibe todos os dados cadastrais disponíveis e, abaixo, histórico de importações com indicação visual de status por job.
3. **Given** telas de cadastro, listagem de usuários e importações no painel admin, **When** renderizadas, **Then** aplicam tipografia, paleta, ausência de sombras e gradientes decorativos, bordas 0,5px #e2e2de e superfícies brancas #ffffff em cards conforme o padrão global.
4. **Given** área de conteúdo em desktop ≥ 1280px, **When** qualquer tela admin ou cliente exibe conteúdo principal, **Then** a largura máxima do bloco de conteúdo é 1280px centralizado ou alinhado dentro da coluna restante.

---

### User Story 4 - Tela de entrada com escolha Admin ou Cliente (Priority: P1)

Como visitante, quero uma única página de entrada do produto onde escolho explicitamente se entro como **Administrador Prudens** ou como **Cliente**, e em seguida faço apenas login com e-mail e senha — sem opção de criar conta — para acessar a área correta com clareza visual.

**Why this priority**: É o portão de acesso a toda a aplicação; confusão entre perfis ou exibição de cadastro público quebra o modelo invite-only (spec 005).

**Independent Test**: Acessar `/sign-in` sem sessão; verificar ausência de link ou botão de cadastro; selecionar cada perfil e confirmar destaque visual distinto antes do formulário Clerk; após login válido, redirecionamento coerente com o perfil escolhido e metadados do usuário.

**Acceptance Scenarios**:

1. **Given** visitante não autenticado, **When** acessa a rota pública de entrada (`/sign-in`), **Then** vê logotipo Prudens Index, seletor visível com duas opções (**Admin** e **Cliente**) e formulário de login (e-mail/senha) — sem OAuth e sem "Criar conta" / sign-up.
2. **Given** a tela de entrada, **When** o visitante seleciona **Admin**, **Then** a opção Admin fica visualmente ativa (fundo/borda em verde primário `#1a4731`, texto claro) e a opção Cliente fica inativa (superfície neutra); o inverso ao selecionar **Cliente** (destaque com acento âmbar `#d4a020` ou variação definida no guia para diferenciar do admin).
3. **Given** perfil **Admin** selecionado e credenciais de usuário admin, **When** o login conclui, **Then** o usuário é redirecionado à área administrativa; se as credenciais forem de cliente, **Then** mensagem em pt-BR indica que a conta não é de administrador e orienta a escolher Cliente.
4. **Given** perfil **Cliente** selecionado e credenciais de cliente, **When** o login conclui, **Then** o usuário é redirecionado à dashboard do cliente; se as credenciais forem de admin, **Then** mensagem em pt-BR orienta a escolher Admin.
5. **Given** a tela de entrada, **When** inspecionada, **Then** não há link para cadastro público; a rota `/sign-up` permanece acessível **somente** via link de convite por e-mail (spec 005), não a partir desta página.
6. **Given** a tela de entrada, **When** renderizada, **Then** aplica `AuthLayout` (fundo `#f5f5f3`, card branco, bordas 0,5px, tipografia da marca) e componente Clerk com links de sign-up e OAuth ocultos.

---

### User Story 5 - Tema claro único e restrições visuais globais (Priority: P2)

Como stakeholder de produto, quero garantir que nenhuma tela introduza modo escuro ou efeitos visuais fora do guia, para manter identidade Prudens reconhecível e profissional.

**Why this priority**: Evita regressão visual e escopo creep em temas alternativos nesta entrega.

**Independent Test**: Auditoria visual em todas as rotas existentes procurando sombras, gradientes decorativos, dark mode ou cores fora da paleta obrigatória.

**Acceptance Scenarios**:

1. **Given** qualquer componente ou tela coberta, **When** inspecionado visualmente, **Then** não há sombra projetada nem gradiente decorativo.
2. **Given** preferência de tema do sistema operacional em escuro, **When** o usuário usa a aplicação, **Then** a interface permanece no tema claro definido (fundo de página #f5f5f3, cards #ffffff).
3. **Given** CTAs e elementos de marca, **When** exibidos, **Then** usam verde primário #1a4731; destaques e acento do logotipo usam âmbar #d4a020; bordas estruturais usam exclusivamente #e2e2de com 0,5px de espessura.

---

### Edge Cases

- Sidebar colapsada: tooltips ou rótulos acessíveis devem permitir identificar cada ícone sem texto visível.
- Viewport entre tablet e 1280px: layout deve permanecer utilizável sem scroll horizontal; em larguras abaixo do breakpoint mobile, barra inferior substitui sidebar.
- Lista vazia após filtros: gráfico, tabela e contador devem comunicar zero resultados sem quebrar layout.
- IDD exatamente 0 ou 20: cores seguem faixas definidas (0 inclusive no verde 0–20; acima de 20 âmbar).
- Empresa sem data de última atualização ou IDD indisponível: card de índice e cards admin exibem placeholder claro em português sem quebrar alinhamento.
- Paginação com uma única página: controles de primeira/última permanecem coerentes (desabilitados ou ocultos de forma previsível).
- Telas de autenticação sem sidebar: mantêm identidade (logotipo, cores, tipografia) em layout simplificado centrado ou em coluna única.
- Alto volume de empresas no admin: busca textual filtra cards em tempo aceitável para o usuário (< 1s percebido em listas até 500 empresas em teste de aceite).

## Requirements *(mandatory)*

### Functional Requirements

#### Identidade e tokens globais

- **FR-001**: O sistema MUST aplicar logotipo tipográfico "Prudens/" (regular) + "INDEX" (negrito), com "DEX" exclusivamente em #d4a020; sobre fundo escuro o restante em branco; sobre fundo claro o restante em #1a4731.
- **FR-002**: O sistema MUST usar paleta obrigatória: verde primário #1a4731 (sidebar, CTAs, marca); âmbar #d4a020 (acento e destaque do logotipo); vermelho #e84040 (status Distribuição e IDD negativo em tabela); verde #16a34a (status Adequado e IDD 0–20); âmbar #f59e0b (status Impulsionar e IDD > 20); fundo de página #f5f5f3; superfície de cards #ffffff; bordas #e2e2de a 0,5px em todos os contornos estruturais.
- **FR-003**: O sistema MUST usar Plus Jakarta Sans peso 700 para logotipo e títulos de página; Inter 400 e 500 para corpo, labels e controles; fonte monoespaçada (equivalente a JetBrains Mono 400) para valores numéricos em tabelas, IDD, porcentagens, moeda e EAN.
- **FR-004**: O sistema MUST NOT usar sombra em componentes nem gradientes decorativos em nenhuma tela coberta.

#### Layout e navegação

- **FR-005**: O sistema MUST usar layout de duas colunas (sidebar fixa + conteúdo) em desktop, fundo de página #f5f5f3, largura máxima de conteúdo 1280px e ausência de scroll horizontal em viewports ≥ 1280px.
- **FR-006**: A sidebar MUST medir 220px expandida e 64px colapsada, fundo #1a4731, transição de 200ms, controle de colapso no rodapé, e persistência do estado colapsado entre sessões do mesmo navegador.
- **FR-007**: Em mobile, o sistema MUST ocultar a sidebar e exibir barra de navegação inferior com os mesmos destinos: Dashboard, Produtos, Empresas, Usuários, Importações.
- **FR-008**: Itens de navegação MUST refletir estado ativo (fundo rgba(255,255,255,0.1), texto branco, borda esquerda 3px #d4a020) e inativo (texto rgba(255,255,255,0.65), hover 0.85).
- **FR-009**: Cada página autenticada MUST exibir `PageHeader` com título (Plus Jakarta Sans 18px peso 500) e subtítulo opcional (Inter 13px #6b7280), com 24px de espaçamento até o conteúdo e sem linha separadora — via mapa de metadados por rota ou layout compartilhado que cubra todas as rotas listadas em FR-016.

#### Dashboard cliente

- **FR-010**: O card de IDD médio MUST seguir layout e cores especificados (fundo #1a4731, label uppercase 10px 60% opacidade, valor 32px monoespaçado com #f87878 negativo / #86efac positivo, empresa e data à direita).
- **FR-011**: O gráfico de barras de IDD MUST ser largura total, colorir barras por status (Distribuição/Adequado/Impulsionar), sem legenda inferior, com tooltip de produto e IDD em percentual.
- **FR-012**: A barra de filtros MUST ser colapsável (altura 0 fechada, automática aberta), toggle "Filtros" com chevron 180° aberto, transição 200ms, filtros de busca, status, IDD (−100 a +100), dias de estoque (0–365) e capital imobilizado; botão "Limpar filtros" quando houver filtro ativo; filtros MUST atualizar gráfico e tabela simultaneamente.
- **FR-013**: A tabela de produtos MUST ter cabeçalho sticky, linhas 40px, células 12px, formatação numérica e financeira conforme especificado, badges de status pill, contador acima e paginação completa abaixo.

#### Admin e demais telas

- **FR-014**: A visão geral admin MUST exibir métricas globais e grid pesquisável de empresas com card conforme especificação de IDD e metadados.
- **FR-015**: O detalhe de empresa MUST exibir bloco de informações cadastrais no topo e histórico de importações com status visual por job abaixo.
- **FR-016**: O sistema MUST aplicar o sistema de design a todas as telas existentes do produto: landing inicial, dashboard cliente, painel admin (visão geral, empresas, detalhe, cadastro, imports globais e por empresa, usuários), e fluxos de autenticação/acesso pendente. *(Critério guarda-chuva para auditoria SC-001; detalhes visuais em FR-001–FR-004 e por área.)*
- **FR-017**: O sistema MUST NOT implementar modo escuro nesta versão; apenas tema claro.

#### Acessibilidade e interação

- **FR-018**: Controles interativos MUST permanecer acionáveis por teclado e ponteiro, com estados desabilitados claramente distinguíveis, em linha com padrões de produtividade densos (áreas clicáveis adequadas em barra mobile).
- **FR-019**: Textos de interface MUST permanecer em português brasileiro, herdando expectativa das entregas anteriores de usabilidade.

#### Tela de entrada (login)

- **FR-020**: A rota pública de entrada do produto MUST ser `/sign-in` (redirecionamentos de `/`, rotas protegidas sem sessão via `middleware.ts`, e demais guards apontam para ela).
- **FR-021**: A tela de entrada MUST exibir seletor de perfil com duas opções mutuamente exclusivas — **Administrador** e **Cliente** — com contraste visual claro entre ativo e inativo (admin ativo: ênfase em `#1a4731`; cliente ativo: ênfase em `#d4a020` / superfície destacada conforme tokens de auth).
- **FR-022**: A tela de entrada MUST oferecer apenas login por e-mail e senha (componente Clerk `SignIn`); MUST NOT exibir botões OAuth, link "Criar conta" ou qualquer caminho de autocadastro público.
- **FR-023**: A tela de entrada MUST NOT linkar ou promover `/sign-up`; cadastro de novos usuários permanece exclusivamente por convite do admin (spec 005). A rota `/sign-up` existe apenas para aceite de convite via URL do e-mail.
- **FR-024**: Após login bem-sucedido, o sistema MUST validar coerência entre perfil selecionado na entrada e `role` nos metadados do usuário; em caso de divergência, MUST exibir mensagem em pt-BR na própria tela sem redirecionar à área errada.
- **FR-025**: Após login bem-sucedido e perfil coerente, redirecionamento MUST usar `homePathForRole` (spec 005): admin → `/admin/imports`; client → `/dashboard`; sem metadata válida → `/acesso-pendente`.

### Key Entities

- **Seleção de perfil na entrada**: Estado transitório na tela `/sign-in` (`admin` | `client`) escolhido antes do login; usado para estilo do seletor e validação pós-autenticação.
- **Preferência de layout**: Estado da sidebar (expandida/colapsada) associado ao usuário no dispositivo, para restaurar na próxima visita.
- **Contexto de navegação**: Conjunto de destinos principais (Dashboard, Produtos, Empresas, Usuários, Importações) mapeados às rotas e perfis (cliente vê subset adequado; admin vê conjunto completo).
- **Filtros da dashboard cliente**: Conjunto de critérios (texto, status, faixas numéricas) aplicado de forma unificada à visualização gráfica e tabular.
- **Card de empresa (admin)**: Resumo visual com nome, IDD médio colorido, contagem de produtos e data de cadastro para decisão rápida na listagem.
- **Job de importação**: Entrada no histórico com status visual distinguível (sucesso, falha, em processamento, etc.) no detalhe da empresa.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% das telas existentes listadas em FR-016 passam checklist visual de marca (paleta, tipografia, ausência de sombra/gradiente, bordas 0,5px) em revisão de aceite com capturas por rota.
- **SC-002**: Em viewport desktop 1280px, 100% das telas cobertas não apresentam scroll horizontal durante navegação típica documentada nos fluxos P1 e P2.
- **SC-003**: Pelo menos 90% dos participantes de teste interno (gestores/empresários) classificam a interface como "familiar" ou "muito familiar" em escala de 5 pontos, comparando à experiência de suíte de produtividade corporativa. *(Métrica de pesquisa pós-release; não exige tarefa de implementação automatizada.)*
- **SC-004**: Usuário cliente consegue localizar IDD médio, aplicar um filtro de status e identificar um produto na tabela em menos de 60 segundos em teste moderado com até 200 SKUs.
- **SC-005**: Estado colapsado da sidebar é restaurado corretamente em 100% dos recarregamentos de página no mesmo navegador durante testes de aceite.
- **SC-006**: Zero ocorrências de modo escuro ou tema alternativo detectadas em auditoria de todas as rotas cobertas.
- **SC-007**: 100% dos testadores identificam corretamente qual perfil está selecionado na tela de entrada antes de digitar credenciais (Admin vs Cliente).
- **SC-008**: Em auditoria da tela `/sign-in`, zero links ou CTAs de cadastro público; `/sign-up` só é alcançável via URL de convite, não pela UI de entrada.

## Assumptions

- "Produtos" na navegação do cliente corresponde à área de análise de produtos na dashboard (tabela e gráfico); no admin, Empresas/Usuários/Importações mapeiam às rotas já existentes no painel administrativo.
- Slider de capital imobilizado usa faixa mínima 0 e máxima derivada do maior `tiedUpCapital` presente nos produtos do job ativo na resposta da API (ou 0 com slider desabilitado quando não houver dados).
- Rotas e permissões por perfil (cliente vs admin) permanecem as da aplicação atual; apenas a apresentação visual e padrões de layout mudam.
- Componentes de autenticação de terceiros (ex.: formulário de login hospedado) são envolvidos visualmente na medida do permitido pelo provedor, com página envolvente alinhada à marca.
- A spec **005-clerk-restricted-invites** continua regendo regras de negócio (invite-only, `/sign-up` só com ticket de convite); esta feature define **como** a tela de entrada se apresenta e a escolha Admin/Cliente.
- Funcionalidades de negócio (importação, convites, cálculo de IDD) não mudam de regra; esta entrega substitui e unifica a camada de apresentação.
- A especificação 003-fix-ui-usability permanece válida onde não conflitar; em conflito de estilo, prevalecem os tokens desta feature.

## Dependencies

- Dados já expostos pelas APIs atuais para overview cliente, produtos, empresas, importações e usuários.
- Entrega anterior de usabilidade e idioma pt-BR (spec 003) para mensagens e comportamentos de tabela/gráfico já acordados.
- Entrega **005-clerk-restricted-invites** para proibição de autocadastro e fluxo de convite.
- Fontes Plus Jakarta Sans, Inter e família monoespaçada disponíveis para carregamento na aplicação web.
