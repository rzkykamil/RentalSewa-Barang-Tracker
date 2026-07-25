# syntax=docker/dockerfile:1

# Multi-stage build shared by the `app` and `worker` Compose services
# (docs/flows/system-architecture.md, docs/technical-spec.md §11). Build
# either target with `docker build --target app` / `--target worker`.

FROM node:22-alpine AS base
WORKDIR /app

# ---- deps: full dependency install (incl. devDependencies, needed by the
# worker target for `tsx` and by prisma generate/build). ----
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# ---- builder: generate the Prisma client and produce the Next.js
# standalone server output. ----
FROM deps AS builder
COPY . .
RUN npx prisma generate
RUN npm run build

# ---- app: minimal runtime image serving the Next.js app via the
# standalone server (docs/technical-spec.md §11 service `app`). ----
FROM base AS app
ENV NODE_ENV=production
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]

# ---- worker: runs `worker/reminder-job.ts` on a schedule via the compose
# service's own cron loop (docs/technical-spec.md §5, service `worker`).
# Needs the full dependency tree (tsx, prisma client), not the standalone
# app bundle. ----
FROM deps AS worker
ENV NODE_ENV=production
COPY . .
COPY --from=builder /app/src/generated ./src/generated
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs
USER nextjs
# Acts as its own scheduler (docs/technical-spec.md §5: cron, every 15 min) —
# runs the job, then sleeps, in a loop, instead of a separate cron daemon.
CMD ["sh", "-c", "while true; do npx tsx worker/reminder-job.ts; sleep 900; done"]
