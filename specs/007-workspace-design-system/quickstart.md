# Quickstart — 007 Workspace Design System

## Pré-requisitos

- Web em execução: `pnpm --filter @prudens/web dev`
- API em execução para dashboard cliente com filtros: `pnpm --filter @prudens/api dev`
- Usuário **cliente** com empresa e import ativa; usuário **admin**
- Viewport de teste: 1280×800 (desktop) e 390×844 (mobile)

## 1) Tokens globais e fontes

1. Abra `/dashboard` (cliente).
2. Confirme fundo da página `#f5f5f3` e ausência de sombras em cards.
3. Inspecione tipografia: títulos em Plus Jakarta Sans; números da tabela em fonte monoespaçada.
4. Verifique bordas finas (~0.5px) cor `#e2e2de` em cards brancos.

## 2) Sidebar e persistência

1. Desktop ≥1280px: sidebar verde `#1a4731`, largura ~220px, logotipo com "DEX" âmbar.
2. Clique em colapsar no rodapé → largura ~64px, só ícones, animação ~200ms.
3. Recarregue a página → estado colapsado mantido.
4. Item ativo: faixa esquerda âmbar 3px, fundo branco 10%.
5. Mobile (<768px): sidebar ausente; barra inferior com ícones.

## 3) Dashboard cliente

1. Card IDD médio: fundo verde escuro, label "IDD MÉDIO DA EMPRESA", valor grande monoespaçado colorido.
2. Gráfico: largura total, sem legenda inferior; hover mostra produto + IDD%.
3. Abra **Filtros** → painel expande; chevron gira 180°.
4. Aplique filtro de status → gráfico e tabela atualizam; aparece **Limpar filtros**.
5. Ajuste sliders IDD / dias de estoque / capital → contador e paginação refletem total filtrado.
6. Tabela: cabeçalho fixo ao rolar; linhas ~40px; IDD com cores por faixa; paginação primeira/anterior/numerada/próxima/última.

## 4) Admin

1. `/admin`: métricas com fundo off-white e borda; grid de empresas com busca.
2. Abra empresa: bloco cadastral no topo; histórico de imports com status visual.
3. `/admin/usuarios`, `/admin/imports`, `/admin/companies/new`: mesma shell, header padrão, sem scroll horizontal em 1280px.

## 5) Tela de entrada (login)

1. Abra `/sign-in` deslogado (ou rota protegida sem sessão → deve cair em `/sign-in` via middleware).
2. Confirme seletor **Administrador** e **Cliente** com destaque visual distinto ao clicar (verde primário vs acento âmbar).
3. Confirme ausência de "Criar conta", sign-up ou botões sociais.
4. Login como admin com opção Admin → `/admin/imports`; como client com opção Cliente → `/dashboard`.
5. Login com perfil errado (admin escolhido + conta client) → mensagem pt-BR, sem redirecionar à área errada.
6. Acesse `/sign-up` diretamente sem ticket de convite → bloqueado (spec 005); não deve haver link para isso em `/sign-in`.
7. `/acesso-pendente`: logo e cores da marca; layout centrado sem sidebar.
8. Tema do SO em escuro → app permanece claro.

## 5b) PageHeader em todas as rotas autenticadas

Em cada rota abaixo, confirmar título/subtítulo (Plus Jakarta / Inter) via shell, sem header duplicado legado:

- `/dashboard`
- `/admin`
- `/admin/usuarios`
- `/admin/imports`
- `/admin/companies/new`
- `/admin/companies/{id}`
- `/admin/companies/{id}/imports`

## 5c) Acessibilidade (FR-018)

1. Sidebar colapsada: navegar itens com Tab; ícones com nome acessível (`aria-label` ou tooltip).
2. `/sign-in`: seletor Admin/Cliente operável com teclado; foco visível.
3. Mobile: itens da barra inferior com área de toque confortável.
4. Filtros: labels associados aos inputs/sliders; botão desabilitado com `cursor: not-allowed`.

## 6) Regressões

- Fluxos 003/004/005 intactos (pt-BR, erros de planilha, usuários Clerk).
- Export de produtos respeita filtros ativos.
- Upload de planilha (dropzone) mantém regra de cursor e formatos.

## Checklist visual rápido (por rota)

| Rota | Shell | PageHeader | Logo | Sem shadow |
|------|-------|------------|------|------------|
| `/dashboard` | ✓ | ✓ | ✓ | ✓ |
| `/admin` | ✓ | ✓ | ✓ | ✓ |
| `/admin/companies/[id]` | ✓ | ✓ | ✓ | ✓ |
| `/admin/companies/[id]/imports` | ✓ | ✓ | ✓ | ✓ |
| `/admin/companies/new` | ✓ | ✓ | ✓ | ✓ |
| `/admin/usuarios` | ✓ | ✓ | ✓ | ✓ |
| `/admin/imports` | ✓ | ✓ | ✓ | ✓ |
| `/sign-in` | auth layout | N/A | ✓ | ✓ |
| `/` | redirect | N/A | N/A | ✓ |
