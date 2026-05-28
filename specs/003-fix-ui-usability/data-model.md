# Data Model — 003 Fix UI Usability

## 1) ImportValidationError

Representa uma ocorrência de erro de validação em planilha de importação.

| Field | Type | Required | Rules |
|------|------|----------|-------|
| `row_number` | integer | yes | `>= 2` (linha real da planilha; 1 é cabeçalho) |
| `column_name` | string | yes | Nome original da coluna em português, igual ao cabeçalho da planilha |
| `error_message` | string | yes | Texto em pt-BR, objetivo e acionável |

**Observações**:
- Deve ser serializável para persistência vinculada ao `import_job`.
- Pode haver múltiplos erros para a mesma linha (colunas diferentes).

## 2) ImportJob (extensão de modelo existente)

Tabela atual: `import_jobs`.

### Novos campos planejados

| Field | Type | Required | Purpose |
|------|------|----------|---------|
| `validation_errors` | json/jsonb (array de `ImportValidationError`) | no (default `[]`) | Persistir relatório estruturado de erros por job |

### Campos já existentes relevantes

| Field | Type | Purpose |
|------|------|---------|
| `id` | uuid | Identificador do job |
| `company_id` | uuid | Isolamento por empresa |
| `status` | enum | Estado do processamento |
| `row_count` | integer \| null | Linhas válidas inseridas |
| `error_message` | text \| null | Resumo curto para UI |

### Transições de estado (sem alteração)

`queued` → `processing` → `completed` | `failed`

Em `completed` com falha parcial:
- `row_count` contém somente linhas válidas inseridas.
- `validation_errors` contém erros detalhados por linha/coluna.

## 3) CompanyOverview (DTO de detalhe admin)

Extensão do DTO retornado por `GET /api/admin/companies/:id`.

| Field | Type | Required | Rules |
|------|------|----------|-------|
| `company.id` | uuid | yes | existente |
| `company.name` | string | yes | existente |
| `company.slug` | string | yes | existente |
| `company.createdAt` | ISO datetime | yes | existente |
| `company.metadata` | object \| null | no | informações cadastrais disponíveis |
| `stats.totalProducts` | integer | yes | `>= 0` |
| `stats.avgIdd` | number \| null | no | média atual |
| `stats.lastUpdatedAt` | ISO datetime \| null | no | última atualização de dados |

## 4) BreadcrumbItem (UI entity)

| Field | Type | Required | Rules |
|------|------|----------|-------|
| `label` | string | yes | pt-BR |
| `href` | string \| undefined | no | ausente no último item |

## 5) PaginationState (dashboard store)

| Field | Type | Required | Rules |
|------|------|----------|-------|
| `currentPage` | integer | yes | `>= 1` |
| `totalPages` | integer | yes | `>= 1` |
| `pageSize` | integer | yes | default de listagem |
| `term` | string | no | filtro textual |
| `itemStatuses` | ItemStatus[] | yes | filtros de status |
| `sort` | string | yes | coluna de ordenação |
| `order` | `asc` \| `desc` | yes | direção |

**Rule**: qualquer alteração de filtro (`term`, `itemStatuses`) reseta `currentPage` para 1.

## 6) UIStringCatalog (fonte de texto)

Arquivo: `apps/web/src/lib/strings.ts`.

Estrutura planejada:
- `common`
- `admin`
- `client`
- `errors`
- `status`

**Rule**: nenhuma string visível ao usuário deve permanecer hardcoded em componente coberto por esta feature.
