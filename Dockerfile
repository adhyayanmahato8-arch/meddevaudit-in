# MedDevAudit-IN — single-container image (API + built frontend).
# Works on Railway, Fly.io, Google Cloud Run, or any Docker host.
#
#   docker build -t meddevaudit-in .
#   docker run -p 4000:4000 meddevaudit-in          # → http://localhost:4000
#
# The build stage seeds the database and caches the embedding model, so the
# container needs no outbound network at runtime.

FROM node:20-bookworm-slim

# Prisma's query engine links against OpenSSL.
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install with the lockfile first so dependency layers cache across code edits.
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/db/package.json packages/db/
RUN npm ci --no-audit --no-fund

COPY . .

# Build the frontend, generate Prisma, create + seed the DB, embed clauses.
RUN npm run build && npm run setup

ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
  CMD node -e "fetch('http://localhost:4000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["npm", "start"]
