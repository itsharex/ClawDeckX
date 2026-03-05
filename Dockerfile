# Stage 1: Build frontend
FROM node:22-alpine AS frontend
WORKDIR /app/web
COPY web/package.json web/package-lock.json ./
RUN npm ci
COPY web/ ./
ARG BUILD_NUMBER=0
RUN echo "${BUILD_NUMBER}" > ../build.txt
RUN npm run build

# Stage 2: Build backend
FROM golang:1.24-alpine AS backend
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
COPY --from=frontend /app/web/dist ./web/dist
ARG VERSION=0.0.1
ARG BUILD_NUMBER=0
RUN CGO_ENABLED=0 GOOS=linux go build \
    -ldflags="-s -w -X ClawDeckX/internal/version.Version=${VERSION} -X ClawDeckX/internal/version.Build=${BUILD_NUMBER}" \
    -o /clawdeckx ./cmd/clawdeckx

# Stage 3: Runtime
FROM alpine:3.21
RUN apk add --no-cache ca-certificates tzdata
WORKDIR /app
COPY --from=backend /clawdeckx ./clawdeckx
VOLUME ["/data"]
EXPOSE 18791
ENV OCD_DB_SQLITE_PATH=/data/ClawDeckX.db \
    OCD_LOG_FILE=/data/ClawDeckX.log \
    OCD_BIND=0.0.0.0 \
    OCD_PORT=18791
ENTRYPOINT ["/app/clawdeckx"]
CMD ["serve"]
