<!--
Sync Impact Report
Version change: (template) → 1.0.0
Modified principles: N/A (initial ratification from template placeholders)
Added sections:
  - Core Principles (7 principles)
  - Technology Stack & Deployment
  - Development Standards & Prohibitions
  - Governance
Removed sections: None
Templates:
  - .specify/templates/plan-template.md ✅ updated (Constitution Check gates)
  - .specify/templates/tasks-template.md ✅ updated (layer paths, API sequence)
  - .specify/templates/spec-template.md ✅ no change required (technology-agnostic)
  - .specify/templates/checklist-template.md ✅ no change required
  - .specify/templates/agent-file-template.md ✅ no change required
  - .specify/templates/commands/*.md ⚠ not present (commands live in .cursor/commands/)
Follow-up TODOs: None
-->

# Prudens Index Constitution

## Core Principles

### I. Product & Users

Prudens Index is a web-based operational stock intelligence system: mobile-first with a
full desktop experience. Prudens operates the platform as admin; end customers
(business owners and operational teams) consume insights and workflows through the
product. Every feature MUST serve operational stock intelligence for those users and
MUST remain usable on mobile viewports as the primary target.

**Rationale**: Product scope and audience define acceptable UX, permissions, and
prioritization; mobile-first avoids retrofitting core flows later.

### II. Mandatory Technology Stack (NON-NEGOTIABLE)

**Frontend** (Vercel): Next.js 15 with App Router only (Pages Router is forbidden),
TypeScript strict mode only (plain JavaScript is forbidden), Tailwind CSS v4,
Shadcn/UI for base components, Recharts for charts, Zod for validation, native
Next.js `fetch` only (Axios is forbidden on the frontend), Zustand for global state,
react-dropzone for uploads.

**Backend** (Hetzner via Coolify): Node.js 20 LTS, Fastify only (Express and NestJS
are forbidden), TypeScript strict mode, Drizzle ORM only (Prisma and hand-written SQL
are forbidden), PostgreSQL 16, Redis 7 with BullMQ for queues, SheetJS for Excel
processing, Zod for input validation, Cloudflare R2 for object storage.

**Rationale**: A single approved stack reduces operational risk, hiring friction, and
unauthorized library drift.

### III. Layered Architecture & Infrastructure (NON-NEGOTIABLE)

The frontend MUST NEVER access the database directly or execute business logic.
The API is the only layer that touches the database, Redis, and object storage. A
BullMQ worker MUST run in a separate Docker container from the API to process
spreadsheets without affecting API availability. PostgreSQL and Redis MUST live
exclusively on Coolify's internal Docker network and MUST NEVER be exposed publicly.

**Rationale**: Clear boundaries protect data, scale async work independently, and
shrink the attack surface.

### IV. API Layer Sequence (NON-NEGOTIABLE)

Every API request MUST follow: **Route Handler → Service → Repository**.

- **Route Handler**: Validates input with Zod and delegates to a Service; MUST NOT
  contain business logic.
- **Service**: Contains all business logic.
- **Repository**: Uses Drizzle for database access only.

This sequence MUST NOT be bypassed or reordered.

**Rationale**: Predictable layering enables testing, review, and enforcement of where
logic and data access live.

### V. Code Organization & Single Source of Truth

Repeated behavior MUST become a component, function, or service. Each calculation or
business rule MUST have exactly one authoritative implementation—the same calculation
MUST NOT appear in two places. Anything required by another module MUST be exported
explicitly. Components, functions, and services MUST have a single, clear
responsibility.

**Rationale**: DRY and explicit exports prevent silent divergence and hidden coupling.

### VI. Code Quality & Security (NON-NEGOTIABLE)

- TypeScript `strict` in all files; explicit `any` and `@ts-ignore` are forbidden.
- Zod MUST validate all external input before business logic runs.
- Sensitive values MUST live in environment variables; secrets MUST NOT be hardcoded
  or committed to the repository.
- CORS in production MUST allow only the Vercel production domain.
- Authentication MUST be verified on every protected API endpoint.
- `NEXT_PUBLIC_*` MUST NOT expose secrets; only genuinely public URLs may use that
  prefix.

**Rationale**: Strict typing, validation, and secret hygiene are baseline for a
multi-tenant operational system.

### VII. Naming Conventions

| Artifact | Convention |
|----------|------------|
| Component files | PascalCase |
| Function and utility files | camelCase |
| Route and service files | kebab-case |
| Variables and functions | camelCase |
| Types and interfaces | PascalCase with a descriptive domain prefix |

**Rationale**: Consistent naming speeds navigation and code review across frontend and
backend.

## Technology Stack & Deployment

| Layer | Host | Key constraints |
|-------|------|-----------------|
| Frontend | Vercel | App Router, no direct DB, API-only data |
| API | Hetzner / Coolify | Fastify, Route→Service→Repository |
| Worker | Hetzner / Coolify (separate container) | BullMQ + SheetJS for spreadsheets |
| PostgreSQL 16 | Coolify internal network | Drizzle only; never public |
| Redis 7 | Coolify internal network | BullMQ; never public |
| Object storage | Cloudflare R2 | Accessed from API/worker only |

Deployments MUST preserve container separation (API vs worker) and internal-only
data services.

## Development Standards & Prohibitions

### Absolute Prohibitions

- Duplicating calculation or business logic in more than one place
- Database access outside the Repository layer
- Exposing secrets via `NEXT_PUBLIC_*` (except public URLs)
- Next.js Pages Router, plain JavaScript, unapproved UI libraries
- Axios on the frontend; Express or NestJS on the backend
- Prisma, hand-written SQL outside Drizzle, or ORM bypass
- Frontend business logic or direct database/Redis/storage access
- Public exposure of PostgreSQL or Redis

### Compliance Expectations

Plans, specs, tasks, and pull requests MUST be checked against this constitution.
Violations require documented justification in the plan's Complexity Tracking table
before implementation proceeds.

## Governance

This constitution supersedes ad-hoc conventions and conflicting documentation. All
feature work MUST pass a Constitution Check in `plan.md` before Phase 0 research and
again after Phase 1 design.

**Amendment procedure**: Propose changes via `/speckit.constitution` with explicit
version bump rationale. MINOR for new principles or material expansions; MAJOR for
removals or incompatible redefinitions; PATCH for clarifications only. Update dependent
templates in `.specify/templates/` in the same change set.

**Compliance review**: Reviewers MUST verify stack compliance, layer boundaries,
Route→Service→Repository flow, Zod on external input, auth on protected routes, and
naming conventions. Runtime guidance may be extended in feature `plan.md` and agent
context files generated from plans.

**Version**: 1.0.0 | **Ratified**: 2026-05-19 | **Last Amended**: 2026-05-19
