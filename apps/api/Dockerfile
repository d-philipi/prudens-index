FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
COPY packages/domain-metrics/package.json ./packages/domain-metrics/
RUN pnpm install --frozen-lockfile || pnpm install

FROM base AS runner
COPY --from=deps /app/node_modules ./node_modules
COPY . .
WORKDIR /app/apps/api
EXPOSE 3001
CMD ["pnpm", "start"]
