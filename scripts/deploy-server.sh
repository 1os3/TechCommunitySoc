#!/bin/bash

# 服务器端一键部署脚本
# 在服务器上运行，自动构建、配置和启动所有服务

set -e

echo "🚀 Tech Community 服务器端部署"
echo "==============================="

# 获取项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_NAME="techcommunity"
APP_USER=$(whoami)

echo "📂 项目目录: ${PROJECT_ROOT}"
echo "👤 运行用户: ${APP_USER}"

cd "${PROJECT_ROOT}"

# 停止现有服务
echo "🛑 停止现有服务..."
pm2 delete $APP_NAME-backend 2>/dev/null || true
pm2 delete $APP_NAME-user 2>/dev/null || true  
pm2 delete $APP_NAME-admin 2>/dev/null || true

# 更新代码
echo "📡 更新代码..."
git pull origin main

# 构建后端
echo "🏗️  构建后端..."
cd backend
npm ci --only=production
npm run build
cd ..

# 构建用户前端
echo "🏗️  构建用户前端..."
cd frontend/user-app
npm ci
REACT_APP_API_URL=/api npm run build
cd ../..

# 构建管理员前端
echo "🏗️  构建管理员前端..."
cd frontend/administrator-app  
npm ci
REACT_APP_API_URL=/api npm run build
cd ../..

# 创建部署目录结构
echo "📁 创建部署目录..."
mkdir -p /opt/techcommunity/app/{backend,user,admin,logs}

# 复制文件到部署目录
echo "📋 复制文件到部署目录..."
cp -r backend/dist/* /opt/techcommunity/app/backend/
cp backend/package.json /opt/techcommunity/app/backend/
cp -r backend/node_modules /opt/techcommunity/app/backend/
cp -r frontend/user-app/build/* /opt/techcommunity/app/user/
cp -r frontend/administrator-app/build/* /opt/techcommunity/app/admin/

# 复制环境配置
cp deploy/production/.env.prod /opt/techcommunity/app/ 2>/dev/null || {
    echo "⚠️  未找到 .env.prod，请配置环境变量"
    cp deploy/production/.env.prod /opt/techcommunity/app/.env.example
}

# 创建 PM2 配置文件
echo "📝 创建 PM2 配置..."
cat > /opt/techcommunity/ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: '${APP_NAME}-backend',
      cwd: '/opt/techcommunity/app/backend',
      script: 'index.js',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_file: '/opt/techcommunity/app/.env.prod',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '500M',
      log_file: '/var/log/techcommunity/backend.log',
      error_file: '/var/log/techcommunity/backend-error.log',
      out_file: '/var/log/techcommunity/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    },
    {
      name: '${APP_NAME}-user',
      cwd: '/opt/techcommunity/app/user',
      script: 'serve',
      args: '-s . -l 3001',
      env: {
        NODE_ENV: 'production'
      },
      instances: 1,
      exec_mode: 'fork',
      log_file: '/var/log/techcommunity/user.log',
      error_file: '/var/log/techcommunity/user-error.log',
      out_file: '/var/log/techcommunity/user-out.log'
    },
    {
      name: '${APP_NAME}-admin', 
      cwd: '/opt/techcommunity/app/admin',
      script: 'serve',
      args: '-s . -l 3002',
      env: {
        NODE_ENV: 'production'
      },
      instances: 1,
      exec_mode: 'fork',
      log_file: '/var/log/techcommunity/admin.log',
      error_file: '/var/log/techcommunity/admin-error.log',
      out_file: '/var/log/techcommunity/admin-out.log'
    }
  ]
};
EOF

# 安装 serve (用于前端静态文件服务)
echo "📦 安装 serve..."
npm install -g serve

# 启动应用
echo "🚀 启动应用..."
cd /opt/techcommunity
pm2 start ecosystem.config.js

# 保存 PM2 进程列表
pm2 save
pm2 startup | grep -v PM2 | bash || true

# 配置 Nginx
echo "🔧 配置 Nginx..."
sudo cp "${PROJECT_ROOT}/deploy/production/nginx.conf" /etc/nginx/sites-available/techcommunity

# 启用站点
sudo ln -sf /etc/nginx/sites-available/techcommunity /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# 测试 Nginx 配置
sudo nginx -t

# 重启 Nginx
sudo systemctl reload nginx

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 5

# 检查服务状态
echo "🔍 检查服务状态..."
pm2 status

echo ""
echo "🎉 部署完成！"
echo ""
echo "📱 服务地址:"
echo "  用户端: http://$(hostname -I | awk '{print $1}')"
echo "  管理端: http://$(hostname -I | awk '{print $1}')/admin"
echo "  API: http://$(hostname -I | awk '{print $1}')/api"
echo ""
echo "📋 管理命令:"
echo "  查看状态: pm2 status"
echo "  查看日志: pm2 logs"
echo "  重启服务: pm2 restart all"
echo "  停止服务: pm2 stop all"
echo ""
echo "⚠️  重要提醒:"
echo "  1. 请配置环境变量: /opt/techcommunity/app/.env.prod"
echo "  2. 请配置数据库连接"
echo "  3. 建议配置域名和 SSL 证书"