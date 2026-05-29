# Quickstart: 010-client-dashboard-tabs

## Prerequisites

- Node 20, pnpm, Docker (Postgres 16 + Redis 7)
- Branch `010-client-dashboard-tabs`
- Clerk configurado (`apps/api/.env`, `apps/web/.env.local`)

## 1. Run stack

```bash
docker compose -f docker/docker-compose.yml up -d
pnpm --filter @prudens/api dev
pnpm --filter @prudens/worker dev
pnpm --filter @prudens/web dev
```

## 2. Unit tests — cascata de status atualizada

```bash
pnpm --filter @prudens/domain-metrics test
```

Casos obrigatórios (atualizar/validar):

| stock | stock_days | idd | avg_demand | Esperado |
|-------|------------|-----|------------|----------|
| 100 | null | 10 | 0 | `stuck_stock` (passo 0) |
| 100 | Infinity | 5 | 0 | `stuck_stock` (passo 0) |
| 0 | 0 | qualquer | qualquer | `critical_rupture` |
| — | -3 | 10 | 100 | `critical_rupture` (normalizado) |
| — | 7 | qualquer | 100 | `low_stock` |
| — | 30 | 10 | 100 | `low_stock` (IDD saudável, sem folga) |
| — | 31 | 10 | 100 | `healthy` |
| — | 30 | 0 | 100 | `low_stock` (limite inferior IDD) |
| — | 31 | 20 | 100 | `healthy` (limite superior IDD) |
| — | 30 | -1 | 100 | `unbalanced` |
| — | 100 | qualquer | 100 | `stuck_stock` (excesso dias) |

Validar variantes de `action_insight`:
- `low_stock` com 25 dias **não** contém "duas semanas"
- `stuck_stock` passo 0 menciona demanda zero e impulsionar vendas

## 3. Backfill (após deploy da cascata)

```bash
pnpm --filter @prudens/api backfill:status
```

Verificar amostra:

```sql
SELECT item_status, COUNT(*)
FROM stock_products sp
JOIN import_jobs ij ON sp.import_job_id = ij.id
WHERE ij.is_active = true
GROUP BY item_status;
```

## 4. Smoke — abas cliente

1. Login cliente → sidebar/barra inferior exibe **Dashboard**, **Produtos**, **Exportação**.
2. **`/dashboard`**: IndexHeader + resumo executivo + gráfico IDD + filtro simples de status (sem FilterBar completo).
3. **`/produtos`**: FilterBar completo + ProductTable + paginação.
4. Alterar filtro em Produtos → Dashboard **não** muda.
5. Alterar filtro de status no Dashboard → gráfico e resumo atualizam; Produtos **não** muda.

## 5. Smoke — resumo executivo (API)

```bash
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/client/dashboard/summary" | jq .
```

Com filtro:

```bash
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/client/dashboard/summary?item_status=low_stock&item_status=critical_rupture" | jq .
```

Confirmar: totais, `statusCounts` (7), `topRiskProducts` (≤3), extremos preenchidos quando há dados.

## 6. Smoke — exportação

Listar versões:

```bash
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/client/export/versions" | jq .
```

Download ativo (JSON):

```bash
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/client/export/active-file?format=json" | jq .
```

Download histórico:

```bash
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/client/export/files/<jobId>?format=json" | jq .
```

PDF:

```bash
curl -s -X POST -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/client/export/pdf" \
  -o relatorio-estoque.pdf
```

(Sem body — relatório integral da importação ativa.)

Abrir PDF: identidade INDEX, resumo, produtos por status, gráfico IDD crescente, textos orientativos pt-BR.

## 7. Isolamento

- Cliente A não lista jobs nem baixa arquivos da empresa B (`403`/`404`).
- Admin continua com rotas `/admin/*` inalteradas nesta feature.

## 8. Nova importação

1. Admin upload planilha com linha demanda zero + estoque positivo + dias vazios.
2. Job `completed` → produto com `stuck_stock` e insight de demanda zero.
3. Produto 25 dias, IDD 10% → `low_stock`, não `healthy`.
