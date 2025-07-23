# Multi-stage build for complete application stack

# User frontend build stage
FROM node:20-alpine AS user-frontend-build
WORKDIR /app/frontend/user-app
COPY frontend/user-app/package*.json ./
RUN npm config set registry https://mirrors.huaweicloud.com/repository/npm/ && \
    npm ci
COPY frontend/user-app/ ./
RUN npm run build

# Admin frontend build stage  
FROM node:20-alpine AS admin-frontend-build
WORKDIR /app/frontend/administrator-app
COPY frontend/administrator-app/package*.json ./
RUN npm config set registry https://mirrors.huaweicloud.com/repository/npm/ && \
    npm ci
COPY frontend/administrator-app/ ./
RUN npm run build

# Backend build stage
FROM node:20-alpine AS backend-build
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm config set registry https://mirrors.huaweicloud.com/repository/npm/ && \
    npm ci
COPY backend/ ./
RUN npm run build

# Production stage with nginx and backend
FROM nginx:alpine

# Install Node.js for backend
RUN apt-get update && \
    apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs netcat-openbsd && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copy nginx configuration
COPY docker/nginx/nginx.conf /etc/nginx/nginx.conf
COPY docker/nginx/conf.d/combined.conf /etc/nginx/conf.d/default.conf

# Copy built frontend files
COPY --from=user-frontend-build /app/frontend/user-app/build /usr/share/nginx/html/user-app
COPY --from=admin-frontend-build /app/frontend/administrator-app/build /usr/share/nginx/html/admin-app

# Set up backend
WORKDIR /app
COPY backend/package*.json ./
RUN npm config set registry https://mirrors.huaweicloud.com/repository/npm/ && \
    npm ci --only=production && \
    npm cache clean --force

COPY --from=backend-build /app/backend/dist ./dist

# Create startup script
RUN cat > /docker-entrypoint.sh << 'EOF'
#!/bin/bash
set -e

# Start nginx in background
nginx -g "daemon off;" &

# Wait for database
echo "Waiting for database..."
while ! nc -z postgres 5432; do
    sleep 2
done
echo "Database ready"

# Start backend
cd /app
exec node dist/index.js
EOF

RUN chmod +x /docker-entrypoint.sh

# Expose ports
EXPOSE 80 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:80 && curl -f http://localhost:3000/health || exit 1

# Start both services
CMD ["/docker-entrypoint.sh"]