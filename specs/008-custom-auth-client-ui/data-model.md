# Data Model — 008 Custom Auth & Client UI

**Date**: 2026-05-28

Esta feature **não adiciona migrations**. Usa entidades existentes; altera comportamento de cálculo e contratos de API/UI.

## Entidades existentes (relevantes)

### `import_jobs`

| Campo | Uso nesta feature |
|-------|-------------------|
| `id` | Escopo dos produtos e agregações de range |
| `company_id` | Filtro via auth do cliente |
| `is_active` | Identifica job vigente para ranges e export |
| `original_filename` | Nome do download (`Content-Disposition` / anchor) |
| `r2_object_key` | Chave para URL assinada R2 |
| `status` | Export só se `completed` e `is_active` |

**Regra**: No máximo um job `is_active = true` por empresa (já garantido por `deactivateActiveByCompany`).

### `stock_products`

| Campo | Uso nesta feature |
|-------|-------------------|
| `idd` | Range filter min/max |
| `stock_days` | Range filter min/max |
| `tied_up_capital` | Range filter min/max |
| `average_demand` | Exibição com decimais; **não** retruncar na UI se já persistido |
| `projected_revenue`, `tied_up_capital`, `lost_revenue` | Calculados no import com `calculateFinancialMetrics` após fix de floor |

### Sessão Clerk (externa)

| Metadado | Valores | Uso |
|----------|---------|-----|
| `publicMetadata.role` | `admin` \| `client` | Redirect pós-login / pós-convite |
| `publicMetadata.companyId` | UUID | Escopo cliente |

## DTOs novos (API)

### `ProductRangesDto`

```typescript
{
  idd: { min: number; max: number };
  stockDays: { min: number; max: number };
  tiedUpCapital: { min: number; max: number };
}
```

- Valores numéricos parseados de `numeric`/`integer` no Postgres.
- Se não houver job ativo ou zero produtos: retornar `null` por eixo ou objeto com `min: 0, max: 0` + flag `hasActiveJob: false` (definido no contrato OpenAPI).

### `ActiveFileExportDto` (fallback JSON)

```typescript
{
  url: string;      // presigned GET, TTL 60s
  filename: string; // original_filename
}
```

## Estado frontend (Zustand `dashboardStore`)

| Campo | Mudança |
|-------|---------|
| `iddMin`, `iddMax` | Inicializar de `/api/client/products/ranges` |
| `stockDaysMin`, `stockDaysMax` | Idem |
| `tiedUpCapitalMin`, `tiedUpCapitalMax`, `tiedUpCapitalSliderMax` | Idem; remover derivação só da página atual |
| Export habilitado | Derivar de `overview.activeImportJobId != null` (DTO existente em `ClientOverviewDto`) para desabilitar `ExportButton` |

## Validação (Zod)

- `client-products-ranges`: sem query obrigatória; auth client.
- `client-export-active-file`: sem body; auth client; 404 se sem job ativo ou sem `r2_object_key`.

## Transições

```text
[Visitante] → /login → useSignIn → sessão
                ↓ (needs second factor)
            /verify → código → sessão
[Convite email] → /accept-invite?__clerk_ticket=… → useSignUp.acceptInvitation → senha → sessão

[Cliente autenticado] → GET ranges → inicializa filtros
                     → GET export/active-file → 302 → download Excel
```
