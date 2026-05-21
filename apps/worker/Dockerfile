FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

FROM base AS runner
COPY . .
RUN pnpm install
WORKDIR /app/apps/worker
CMD ["pnpm", "start"]
