# syntax=docker/dockerfile:1
# Production image for the ByteFlow Next.js app. Multi-stage: install deps, build
# the self-contained standalone server, then ship only that + static assets.
# The Python site-audit service has its own image (wp-audit-service/Dockerfile);
# docker-compose.yml builds and wires both together.

# ---------- deps: install node_modules from the lockfile ----------
FROM node:20-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---------- builder: compile the standalone Next server ----------
FROM node:20-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# `next build` renders the static marketing pages and runs the case-studies
# generateStaticParams — both fetch Contentful and THROW without these, so they
# are required at BUILD time (read-only content-delivery credentials). Supabase,
# Google, SendGrid, and the audit service are runtime-only (every /internal page
# is force-dynamic) and are injected at run time via docker-compose, not here.
ARG CONTENTFUL_SPACE_ID
ARG CONTENTFUL_ACCESS_TOKEN
ENV CONTENTFUL_SPACE_ID=$CONTENTFUL_SPACE_ID \
    CONTENTFUL_ACCESS_TOKEN=$CONTENTFUL_ACCESS_TOKEN \
    NEXT_TELEMETRY_DISABLED=1
# Fail fast with a clear message if the Contentful creds weren't passed (the most
# common footgun — the alternative is a cryptic "Failed to collect page data").
RUN test -n "$CONTENTFUL_SPACE_ID" && test -n "$CONTENTFUL_ACCESS_TOKEN" || { \
      echo "" >&2; \
      echo "ERROR: CONTENTFUL_SPACE_ID / CONTENTFUL_ACCESS_TOKEN build args are empty." >&2; \
      echo "The Next build renders Contentful-backed pages and cannot complete without them." >&2; \
      echo "Run:  docker compose --env-file .env.local up --build" >&2; \
      echo "" >&2; \
      exit 1; }
RUN npm run build

# ---------- runner: ship only the standalone bundle + assets ----------
FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
# Run as a non-root user.
RUN groupadd --system --gid 1001 nodejs \
 && useradd --system --uid 1001 --gid nodejs nextjs
# The standalone output bundles server.js + traced node_modules + the .next server
# files. Static assets and public/ are NOT part of it and must be copied alongside.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
