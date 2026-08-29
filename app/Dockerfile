# ============================================================================
# Dockerfile — Lumina Application
# ============================================================================
# Multi-stage build optimizado para producción.
# Imagen final: Node.js Alpine (~50MB), usuario no-root, healthcheck.
# ============================================================================

# ── Stage 1: Dependencies ──────────────────────────────────────────────────
FROM node:22-alpine@sha256:c610fcdfb1d5b4740dd70c284ed3cb16bb857e0f7166196e36a5501df7a3aa32 AS deps

WORKDIR /app

# Copiar solo archivos de dependencias para aprovechar la cache de Docker
COPY package.json package-lock.json ./

# Instalar solo dependencias de producción
RUN npm ci --omit=dev --ignore-scripts && \
    npm cache clean --force

# ── Stage 2: Production ───────────────────────────────────────────────────
FROM node:22-alpine@sha256:c610fcdfb1d5b4740dd70c284ed3cb16bb857e0f7166196e36a5501df7a3aa32 AS production

# Metadatos de la imagen
LABEL org.opencontainers.image.title="Lumina"
LABEL org.opencontainers.image.description="Lumina — Mapa estratégico vivo"
LABEL org.opencontainers.image.source="https://github.com/OWNER/lumina"

# Instalar dumb-init para manejo correcto de señales PID 1
RUN apk add --no-cache dumb-init curl

# Crear usuario no-root
RUN addgroup -g 1001 -S lumina && \
    adduser -S lumina -u 1001 -G lumina

WORKDIR /app

# Copiar dependencias desde stage anterior
COPY --from=deps --chown=lumina:lumina /app/node_modules ./node_modules

# Copiar código fuente
COPY --chown=lumina:lumina package.json ./
COPY --chown=lumina:lumina server.js ./
COPY --chown=lumina:lumina main.js ./
COPY --chown=lumina:lumina statsPanel.js ./
COPY --chown=lumina:lumina index.html ./
COPY --chown=lumina:lumina style.css ./

# Crear directorios escribibles. En producción, monta runtime-data como disco
# persistente hasta completar la migración a PostgreSQL.
RUN mkdir -p uploads runtime-data && chown -R lumina:lumina uploads runtime-data

# Cambiar a usuario no-root
USER lumina

# Exponer puerto
EXPOSE 3000

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=3000
ENV DATA_DIR=/app/runtime-data

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -fs http://localhost:3000/ || exit 1

# Iniciar la aplicación con dumb-init
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
