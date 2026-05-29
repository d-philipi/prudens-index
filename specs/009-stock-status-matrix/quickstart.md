# Quickstart: 009-stock-status-matrix

## Prerequisites

- Node 20, pnpm, Docker (Postgres 16 + Redis 7)
- Branch `009-stock-status-matrix`
- Clerk configurado (`apps/api/.env`, `apps/web/.env.local`)

## 1. Migrate database (ordem obrigatória)

```bash
cd apps/api
pnpm db:migrate
```

Verificar:

```sql
SELECT enumlabel FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
WHERE t.typname = 'item_status_v2'
ORDER BY enumsortorder;

\d stock_products
-- item_status (enum), action_insight text NULL
```

Registros pré-existentes: `item_status = healthy`, `action_insight IS NULL`.

## 2. Run stack

```bash
docker compose -f docker/docker-compose.yml up -d
pnpm --filter @prudens/api dev
pnpm --filter @prudens/worker dev
pnpm --filter @prudens/web dev
```

## 3. Unit tests — cascata de status

```bash
pnpm --filter @prudens/domain-metrics test
```

Casos obrigatórios:

| stock_days | idd | Esperado |
|------------|-----|----------|
| 0 | qualquer | `critical_rupture` |
| 7 | qualquer | `low_stock` |
| 100 | qualquer | `stuck_stock` |
| 60 | qualquer | `slight_excess` |
| 30 | -5 | `unbalanced` |
| 30 | 10 | `healthy` |
| 30 | 25 | `concentrated` |

## 4. Smoke — import

1. Admin → upload planilha canônica com linhas cobrindo faixas acima.
2. Aguardar job `completed`.
3. Verificar persistência:

```sql
SELECT product_name, stock_days, idd, item_status,
       LEFT(action_insight, 80) AS insight_preview
FROM stock_products
WHERE import_job_id = '<job-id>'
ORDER BY stock_days
LIMIT 20;
```

4. Nenhuma linha com `distribution`, `adequate` ou `boost`.

## 5. Smoke — UI cliente

1. Login cliente → dashboard.
2. Badges com cores/labels novos; cada badge exibe **label + ação resumida** (`actionLabel`, ex. "Reabastecer Urgente" em ruptura crítica); pulso em ruptura crítica.
3. Hover no badge → tooltip com `action_insight` completo (após import pós-migration).
4. Filtro de status: 7 opções na ordem de severidade; gráfico e tabela sincronizados.
5. Export PDF com filtro ativo.
6. **SC-005**: com importação grande (~2k+ linhas), aplicar e limpar filtro de status — atualização da tabela/gráfico perceptível em **&lt;2s**.

## 6. API filter

```bash
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/client/products?item_status=critical_rupture&item_status=low_stock&limit=5"
```

Resposta 400 se `item_status=distribution`.

## 7. Deploy seguro

1. `0005` + `0006` migrations  
2. Deploy API + worker (leem/escrevem novos campos)  
3. Deploy web  
4. Reimportar planilhas ativas para recalcular `action_insight` (opcional mas recomendado)
