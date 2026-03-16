# Stage 1: Build frontend
FROM node:22-alpine AS frontend
WORKDIR /app/web
COPY web/package.json web/package-lock.json ./
RUN npm ci
COPY web/ ./
COPY templates/ /app/templates/
ARG BUILD_NUMBER=0
RUN echo "${BUILD_NUMBER}" > ../build.txt
RUN npm run build

# Stage 2: Build backend
FROM golang:1.24-alpine AS backend
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
COPY --from=frontend /app/internal/web/dist ./internal/web/dist
ARG VERSION=0.0.1
ARG BUILD_NUMBER=0
RUN COMPAT=$(grep -o '"openclawCompat"[[:space:]]*:[[:space:]]*"[^"]*"' web/package.json | cut -d'"' -f4) && \
    CGO_ENABLED=0 GOOS=linux go build \
    -ldflags="-s -w -X ClawDeckX/internal/version.Version=${VERSION} -X ClawDeckX/internal/version.Build=${BUILD_NUMBER} -X 'ClawDeckX/internal/version.OpenClawCompat=${COMPAT}'" \
    -o /clawdeckx ./cmd/clawdeckx

# Stage 3: Runtime
FROM ubuntu:22.04
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        ca-certificates tzdata tini curl wget gnupg git \
        procps lsof && \
    # Node.js 22 LTS via NodeSource
    mkdir -p /etc/apt/keyrings && \
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key \
        | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg && \
    echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_22.x nodistro main" \
        > /etc/apt/sources.list.d/nodesource.list && \
    apt-get update && \
    apt-get install -y --no-install-recommends nodejs && \
    # Build tools for native npm modules (better-sqlite3, bcrypt, etc.)
    # Installed and kept for runtime npm install of OpenClaw
    apt-get install -y --no-install-recommends python3 make g++ && \
    rm -rf /var/lib/apt/lists/*

LABEL org.opencontainers.image.title="ClawDeckX" \
      org.opencontainers.image.description="Desktop management dashboard for OpenClaw AI gateway" \
      org.opencontainers.image.url="https://github.com/ClawDeckX/ClawDeckX" \
      org.opencontainers.image.source="https://github.com/ClawDeckX/ClawDeckX"

WORKDIR /app
COPY --from=backend /clawdeckx ./clawdeckx
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x ./clawdeckx /app/docker-entrypoint.sh
VOLUME ["/data"]
EXPOSE 18791 18789
ENV OCD_DB_SQLITE_PATH=/data/ClawDeckX.db \
    OCD_LOG_FILE=/data/ClawDeckX.log \
    OCD_BIND=0.0.0.0 \
    OCD_PORT=18791 \
    TZ=UTC
STOPSIGNAL SIGTERM
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -sf http://localhost:${OCD_PORT:-18791}/api/v1/health || exit 1
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["/app/docker-entrypoint.sh"]
