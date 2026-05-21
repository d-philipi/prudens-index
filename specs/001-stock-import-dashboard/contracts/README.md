# API Contracts

- **OpenAPI**: [`api.openapi.yaml`](./api.openapi.yaml) — source of truth for REST paths
- **Shared Zod**: implemented in `packages/shared/src/schemas/` (must stay in sync with OpenAPI)
- **Auth header**: `Authorization: Bearer <clerk_session_jwt>` on all paths except `/health`

Frontend MUST call these routes via `apps/web/src/lib/apiClient.ts` (native `fetch` only).
