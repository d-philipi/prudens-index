# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript strict — Next.js 15 (frontend), Node.js 20 LTS (API/worker)  
**Primary Dependencies**: See `.specify/memory/constitution.md` (Fastify, Drizzle, BullMQ, Shadcn/UI, etc.)  
**Storage**: PostgreSQL 16 (Drizzle), Redis 7 (BullMQ), Cloudflare R2 (objects)  
**Testing**: [e.g., Vitest, Playwright — NEEDS CLARIFICATION per feature]  
**Target Platform**: Vercel (frontend), Hetzner/Coolify Docker (API + worker)  
**Project Type**: web-service (mobile-first SPA + API + async worker)  
**Performance Goals**: [domain-specific, e.g., spreadsheet job SLA — NEEDS CLARIFICATION]  
**Constraints**: Constitution stack and layer rules; DB/Redis internal-only; CORS → Vercel prod only  
**Scale/Scope**: [domain-specific, e.g., tenants, SKUs, concurrent uploads — NEEDS CLARIFICATION]

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Reference: `.specify/memory/constitution.md` (Prudens Index v1.1.0+)

| Gate | Pass criteria |
|------|----------------|
| Stack | Only approved libraries (Next 15 App Router, Fastify, Drizzle, BullMQ, etc.); no forbidden alternatives |
| Layer boundaries | Frontend calls API only; no DB/Redis/R2 from frontend; worker separate from API container |
| API sequence | New endpoints follow Route Handler (Zod) → Service (logic) → Repository (Drizzle) |
| Validation & auth | Zod on all external input; auth on every protected route |
| Secrets & CORS | No secrets in repo or `NEXT_PUBLIC_*`; production CORS limited to Vercel domain |
| DRY & naming | No duplicated calculations; file/type naming matches constitution |
| Mobile-first | Primary flows usable on mobile viewports |
| Operator language (pt-BR) | UI copy and operator-visible API/worker messages in Brazilian Portuguese |
| Actionable errors | Data failures identify location (line/column or field), expected vs received, and next step—not codes alone |

If any gate fails, document justification in **Complexity Tracking** below or revise the design.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
# [REMOVE IF UNUSED] Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# Option 2: Web application (Prudens Index — DEFAULT)
frontend/                    # Next.js 15 App Router on Vercel
├── src/
│   ├── app/
│   ├── components/          # PascalCase component files
│   └── lib/                 # camelCase utilities; API client via fetch only
└── tests/

backend/                     # Fastify API on Coolify
├── src/
│   ├── routes/              # kebab-case; Zod validate → call service
│   ├── services/            # kebab-case; business logic only
│   └── repositories/        # kebab-case; Drizzle only
└── tests/

worker/                      # BullMQ consumer (separate Docker container)
├── src/
│   └── jobs/                # spreadsheet processing (SheetJS)
└── tests/

# [REMOVE IF UNUSED] Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure: feature modules, UI flows, platform tests]
```

**Structure Decision**: [Document the selected structure and reference the real
directories captured above]

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
