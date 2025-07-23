# Multi-stage build for TechCommunitySoc
FROM node:20-alpine AS backend-builder

WORKDIR /app/backend

# Set npm registry to Huawei Cloud mirror
RUN npm config set registry https://mirrors.huaweicloud.com/repository/npm/

# Copy backend package files
COPY backend/package*.json ./
RUN npm ci --production=false

# Copy backend source code
COPY backend/ ./

# Build TypeScript backend
RUN npm run build

# User frontend build stage
FROM node:20-alpine AS user-frontend-builder

WORKDIR /app/frontend/user-app

# Set npm registry to Huawei Cloud mirror
RUN npm config set registry https://mirrors.huaweicloud.com/repository/npm/

# Copy user app package files
COPY frontend/user-app/package*.json ./
RUN npm ci

# Copy user app source code
COPY frontend/user-app/ ./

# Build user frontend
RUN npm run build

# Admin frontend build stage
FROM node:20-alpine AS admin-frontend-builder

WORKDIR /app/frontend/administrator-app

# Set npm registry to Huawei Cloud mirror
RUN npm config set registry https://mirrors.huaweicloud.com/repository/npm/

# Copy admin app package files
COPY frontend/administrator-app/package*.json ./
RUN npm ci

# Copy admin app source code
COPY frontend/administrator-app/ ./

# Build admin frontend
RUN npm run build

# Production runtime stage
FROM node:20-alpine

# Install nginx, supervisor, and utilities for managing multiple processes
RUN apk add --no-cache nginx supervisor wget netcat-openbsd

WORKDIR /app

# Set npm registry to Huawei Cloud mirror for production stage
RUN npm config set registry https://mirrors.huaweicloud.com/repository/npm/

# Copy backend production dependencies
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --only=production && npm cache clean --force

# Copy built backend from builder stage
COPY --from=backend-builder /app/backend/dist ./backend/dist

# Copy built frontend applications
COPY --from=user-frontend-builder /app/frontend/user-app/build ./frontend/user-app/build
COPY --from=admin-frontend-builder /app/frontend/administrator-app/build ./frontend/admin-app/build

# Create nginx configuration directory
RUN mkdir -p /etc/nginx/conf.d

# Copy nginx configurations
COPY docker/nginx/ /etc/nginx/

# Copy supervisor configuration
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Create startup script
COPY docker/start.sh /start.sh
RUN chmod +x /start.sh

# Create non-root user
RUN addgroup -g 1001 -S appuser && \
    adduser -S appuser -u 1001

# Set proper permissions
RUN chown -R appuser:appuser /app && \
    chown appuser:appuser /start.sh && \
    mkdir -p /var/log/supervisor && \
    chown -R appuser:appuser /var/log/supervisor

# Expose frontend ports (backend runs internally on 3000)
EXPOSE 3001 3002

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3001/ && \
        wget --no-verbose --tries=1 --spider http://localhost:3002/ || exit 1

# Use supervisor to manage nginx and node processes
CMD ["/start.sh"]