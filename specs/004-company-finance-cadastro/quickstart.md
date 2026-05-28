# Quickstart — 004 Company Finance Cadastro

## Pré-requisitos

- API, worker e web em execução (`pnpm --filter @prudens/api dev`, worker, web).
- Usuário Clerk com role admin.
- Migrations `0003` e `0004` aplicadas: `pnpm --filter @prudens/api db:migrate`.

## Aviso — planilha padrão (12 colunas)

A planilha pode ter **11 ou 12 colunas**. A coluna **Valor Unitário** (e qualquer outra opcional) pode estar ausente: a importação **não é bloqueada**; os campos correspondentes ficam `NULL` no banco e **—** no painel do cliente. Colunas **obrigatórias**: `PRODUTO` e `IDD`. Após importar, avisos de colunas ausentes aparecem no painel de status do admin.

## 1) Cadastro de empresa

1. Acesse `/admin`.
2. Clique em **Nova empresa**.
3. Preencha apenas **Nome** e submeta → deve redirecionar para `/admin/companies/{id}/imports`.
4. Repita com CNPJ válido e endereço completo; confira persistência no detalhe da empresa.
5. Tente CNPJ duplicado → mensagem inline "CNPJ já cadastrado", sem redirecionamento.
6. Tente nome vazio ou com 1 caractere → erro inline no campo nome, sem requisição à API.

## 2) Planilha com Valor Unitário

1. Confirme que o cabeçalho tem **12 colunas** na ordem esperada (última: **Valor Unitário**).
2. Na tela de imports da empresa, envie planilha com coluna **Valor Unitário** preenchida em todas as linhas válidas.
3. Aguarde job `completed`.
4. No banco, verifique em `stock_products` para linhas novas:
   - `unit_price` preenchido
   - `projected_revenue`, `tied_up_capital`, `lost_revenue` inteiros coerentes com fórmulas.

### Casos de referência (financial-metrics)

| stock | average_demand | unit_price | projected_revenue | tied_up_capital | lost_revenue |
|------:|---------------:|-----------:|------------------:|----------------:|-------------:|
| 100 | 80 | 10 | 800 | 200 | 0 |
| 50 | 120 | 5 | 250 | 0 | 350 |
| 0 | 0 | 25 | 0 | 0 | 0 |
| 10 | 5 | 0 | 0 | 0 | 0 |
| 999999 | 500000 | 100 | 50000000 | 49999900 | 0 |

## 3) Dashboard do cliente

1. Acesse `/dashboard` como cliente da empresa com import ativa.
2. Confirme colunas: Valor Unitário, Faturamento Projetado, Capital Imobilizado, Faturamento Perdido (após colunas existentes).
3. Métricas financeiras (Faturamento Projetado, Capital Imobilizado, Faturamento Perdido) exibidas como `R$` **sem decimais** (ex.: `R$ 1.234`).
4. Valor Unitário exibido como `R$` **com duas casas decimais** (ex.: `R$ 12,50`).
5. Em viewport 1280px, não deve haver scroll horizontal na página nem na área da tabela/sidebar.

## 4) Regressões

- Paginação, filtros e ordenação da tabela continuam funcionando.
- Colunas percentuais e IDD permanecem formatadas.
- Registros antigos (pré-migration) exibem `—` nas colunas financeiras quando `NULL`.
