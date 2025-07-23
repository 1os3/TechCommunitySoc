# 绝对串行构建方案 (禁用 BuildKit 使用)

# 阶段1: 用户前端构建
FROM node:20-alpine AS user-frontend-build
WORKDIR /app/frontend/user-app
COPY frontend/user-app/package*.json ./
RUN npm config set registry https://mirrors.huaweicloud.com/repository/npm/ && \
    npm ci
COPY frontend/user-app/ ./
RUN npm run build

# 阶段2: 管理前端构建 (显式依赖阶段1)
FROM node:20-alpine AS admin-frontend-build
# 建立依赖关系确保串行
COPY --from=user-frontend-build /app/frontend/user-app/build /dummy
WORKDIR /app/frontend/administrator-app
COPY frontend/administrator-app/package*.json ./
RUN npm config set registry https://mirrors.huaweicloud.com/repository/npm/ && \
    npm ci
COPY frontend/administrator-app/ ./
RUN npm run build

# 阶段3: 后端构建 (显式依赖阶段2)
FROM node:20-alpine AS backend-build
# 建立依赖关系确保串行
COPY --from=admin-frontend-build /app/frontend/administrator-app/build /dummy
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm config set registry https://mirrors.huaweicloud.com/repository/npm/ && \
    npm ci
COPY backend/ ./
RUN npm run build

# 生产阶段
FROM nginx:alpine

# 安装Node.js
RUN apk add --no-cache nodejs npm curl netcat-openbsd

# 复制nginx配置
COPY docker/nginx/nginx.conf /etc/nginx/nginx.conf
COPY docker/nginx/conf.d/combined.conf /etc/nginx/conf.d/default.conf

# 复制前端构建产物 (从各自构建阶段)
COPY --from=user-frontend-build /app/frontend/user-app/build /usr/share/nginx/html/user-app
COPY --from=admin-frontend-build /app/frontend/administrator-app/build /usr/share/nginx/html/admin-app

# 设置后端
WORKDIR /app
COPY backend/package*.json ./
RUN npm config set registry https://mirrors.huaweicloud.com/repository/npm/ && \
    npm ci --only=production && \
    npm cache clean --force

COPY --from=backend-build /app/backend/dist ./dist

# 创建启动脚本
RUN cat > /docker-entrypoint.sh << 'EOF'
#!/bin/bash
set -e

# 后台启动nginx
nginx -g "daemon off;" &

# 等待数据库
echo "Waiting for database..."
while ! nc -z postgres 5432; do
    sleep 2
done
echo "Database ready"

# 启动后端
cd /app
exec node dist/index.js
EOF

RUN chmod +x /docker-entrypoint.sh

# 暴露端口
EXPOSE 80 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:80 && curl -f http://localhost:3000/health || exit 1

# 启动服务
CMD ["/docker-entrypoint.sh"]