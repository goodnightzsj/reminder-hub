# syntax=docker/dockerfile:1

FROM public.ecr.aws/docker/library/node:20-bookworm-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# Install dependencies (and native build deps for better-sqlite3 when needed)
FROM base AS deps
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci

# Build Next.js
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY next.config.ts ./
COPY tsconfig.json postcss.config.mjs eslint.config.mjs ./
COPY public ./public
COPY src ./src
COPY drizzle ./drizzle
RUN npm run build

# Runtime
FROM public.ecr.aws/docker/library/node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/drizzle ./drizzle
COPY scripts/ensure-admin-password.mjs ./scripts/ensure-admin-password.mjs

RUN mkdir -p /app/data

EXPOSE 3000
# Initialize admin password (idempotent) before starting the server.
# Uses ADMIN_PASSWORD env var if set, otherwise generates a random one and
# logs it to stderr. Existing hashes are never overwritten.
CMD ["sh", "-c", "node scripts/ensure-admin-password.mjs && exec node node_modules/next/dist/bin/next start -H 0.0.0.0 -p 3000"]
