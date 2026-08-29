# ── BharatVerse Backend — Dockerfile ─────────────────────────────────────────
# Multi-stage, non-root, production-ready.
# Build:  docker build -t bharatverse-backend .
# Run:    docker run -p 5000:5000 --env-file .env bharatverse-backend
# ─────────────────────────────────────────────────────────────────────────────

FROM node:20-alpine AS base
WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy application source
COPY . .

# Create uploads directory (used when Cloudinary isn't configured)
RUN mkdir -p uploads

# Run as a non-root user for security
RUN addgroup -S bharatverse && adduser -S bharatverse -G bharatverse \
  && chown -R bharatverse:bharatverse /app
USER bharatverse

EXPOSE 5000

ENV NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:5000/api/health || exit 1

CMD ["node", "server.js"]
