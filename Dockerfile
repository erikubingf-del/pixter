# ── Stage 1: Dependencies ─────────────────────────────────────────────────────
FROM node:20-bookworm-slim AS deps

WORKDIR /app

# Install system packages needed to build native modules
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./

# Skip Puppeteer bundled Chrome download — we use system Chromium in runner
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

RUN npm ci --omit=dev


# ── Stage 2: Builder ──────────────────────────────────────────────────────────
FROM node:20-bookworm-slim AS builder

WORKDIR /app

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Provide placeholder env vars so the build doesn't throw on missing keys
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_placeholder
ENV NEXT_PUBLIC_APP_URL=http://localhost:3000

RUN npm run build


# ── Stage 3: Runner ───────────────────────────────────────────────────────────
FROM node:20-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Install Chromium + fonts for Puppeteer PDF generation
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    fonts-liberation \
    fonts-noto-color-emoji \
    && rm -rf /var/lib/apt/lists/*

# Tell Puppeteer to use system Chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

RUN groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 --gid nodejs nextjs

# Copy standalone build output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
