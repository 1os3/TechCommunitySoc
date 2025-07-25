# Multi-stage build: Build assets first, then create lightweight runtime
FROM node:20-alpine AS builder

# Set npm registry
RUN npm config set registry https://registry.npmmirror.com

# Build backend
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./
RUN npm run build

# Build user frontend
WORKDIR /app/frontend/user-app
COPY frontend/user-app/package*.json ./
RUN npm ci
COPY frontend/user-app/ ./
RUN npm run build

# Build admin frontend
WORKDIR /app/frontend/administrator-app
COPY frontend/administrator-app/package*.json ./
RUN npm ci
COPY frontend/administrator-app/ ./
RUN npm run build

# Production stage: Lightweight nginx + node runtime
FROM nginx:alpine

# Install only Node.js runtime (no build tools)
RUN apk add --no-cache nodejs npm curl netcat-openbsd

# Set up application directory
WORKDIR /app

# Copy nginx configuration
COPY docker/nginx/nginx.conf /etc/nginx/nginx.conf
COPY docker/nginx/conf.d/combined.conf /etc/nginx/conf.d/default.conf

# Copy built frontend files
COPY --from=builder /app/frontend/user-app/build /usr/share/nginx/html/user-app
COPY --from=builder /app/frontend/administrator-app/build /usr/share/nginx/html/admin-app

# Copy built backend
COPY --from=builder /app/backend/dist ./dist

# Install only production dependencies for backend
COPY backend/package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Create startup script
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'set -e' >> /app/start.sh && \
    echo 'nginx -g "daemon off;" &' >> /app/start.sh && \
    echo 'echo "Waiting for database..."' >> /app/start.sh && \
    echo 'while ! nc -z postgres 5432; do sleep 2; done' >> /app/start.sh && \
    echo 'echo "Database ready"' >> /app/start.sh && \
    echo 'cd /app && exec node dist/index.js' >> /app/start.sh && \
    chmod +x /app/start.sh

# Expose ports
EXPOSE 80 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:80 && curl -f http://localhost:3000/health || exit 1

# Override nginx entrypoint and start both services
ENTRYPOINT []
CMD ["/app/start.sh"]
