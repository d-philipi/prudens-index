# Quickstart — 003 Fix UI Usability

## Objetivo

Validar rapidamente as correções de usabilidade da spec 003 em admin e cliente, garantindo aderência à constitution (pt-BR e erros acionáveis).

## Pré-requisitos

- API, worker e web em execução.
- Usuário admin autenticado para fluxos administrativos.
- Usuário cliente autenticado para dashboard.
- Planilha de teste com linhas válidas e inválidas.

## 1) Validar internacionalização (Fase 0)

1. Acesse telas admin (`/admin`, detalhe de empresa e imports) e dashboard cliente.
2. Verifique visualmente que não há strings em inglês.
3. Confirme textos de:
   - botões
   - placeholders
   - estados vazios
   - mensagens de sucesso/erro
   - tooltips

**Esperado**: 100% dos textos visíveis em pt-BR.

## 2) Validar erros estruturados de planilha (Fase 1)

1. Faça upload de planilha contendo erros intencionais em colunas distintas.
2. Aguarde término do job com falha parcial.
3. Abra aba de imports e o relatório detalhado do job.

**Esperado**:
- Linhas válidas processadas normalmente.
- Lista de erros contendo:
  - número da linha (`row_number`)
  - nome da coluna em português (`column_name`)
  - mensagem acionável (`error_message`)
  - valor esperado (`expected_value`)
  - valor recebido (`received_value`)
- Sem mensagens genéricas como apenas `ROW_VALIDATION`.

## 3) Validar endpoint de erros (Fase 1)

Faça `GET /api/admin/companies/:id/jobs/:jobId/errors` com token de admin.

**Esperado**:
- `200` com lista estruturada de erros para job da empresa.
- `404` se job não pertence à empresa informada.

## 4) Validar breadcrumb e retorno no admin (Fases 2 e 3)

1. Em `/admin`, verificar breadcrumb: `Empresas`.
2. Em detalhe de empresa, verificar `Empresas > Nome da Empresa`.
3. Em imports da empresa, verificar `Empresas > Nome da Empresa > Importações`.
4. Clicar em cada nível clicável e validar navegação.
5. Clicar em `Voltar para empresas` na tela de imports.

**Esperado**:
- Breadcrumb sempre como primeiro bloco abaixo do header.
- Navegação hierárquica consistente.
- Seção `CompanyOverview` visível no topo do detalhe mesmo trocando abas.
- A página global `/admin/imports` oferece link para a rota primária `/admin/companies/:id/imports`.

## 5) Validar gráfico IDD e tabela de produtos (Fases 4, 5 e 6)

1. Abrir dashboard cliente com conjunto grande de produtos.
2. No gráfico:
   - confirmar ausência de legenda inferior
   - passar mouse em barras e validar tooltip com nome + IDD em `%`
   - conferir cor por `item_status`
3. Na tabela:
   - validar paginação completa (primeira/anterior/número/próxima/última)
   - validar reset para página 1 ao alterar filtros
   - validar cabeçalho sticky durante scroll
   - validar `%` em cabeçalho e células de Distribuição, Demanda x Dist. e IDD
   - validar indicação de página atual/total e seleção de páginas numeradas

**Esperado**:
- Navegação de páginas previsível com filtros preservados.
- Cabeçalho fixo sem desalinhamento de coluna.
- Formatação percentual consistente via função única.
