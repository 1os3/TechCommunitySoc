#!/bin/bash

# 服务器端简化部署脚本
# 直接使用已编译好的 production 目录文件

set -e

echo "🚀 Tech Community 服务器端部署"
echo "==============================="

# 获取项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PRODUCTION_DIR="${PROJECT_ROOT}/deploy/production"
APP_NAME="techcommunity"

echo "📂 项目目录: ${PROJECT_ROOT}"
echo "📦 生产文件目录: ${PRODUCTION_DIR}"

# 检查编译文件是否存在
if [ ! -d "${PRODUCTION_DIR}/backend" ] || [ ! -d "${PRODUCTION_DIR}/user" ] || [ ! -d "${PRODUCTION_DIR}/admin" ]; then
    echo "❌ 未找到编译文件，请先本地运行构建："
    echo "   ./scripts/build-all.sh"
    echo "   然后 git push 到服务器"
    exit 1
fi

# 停止现有服务
echo "🛑 停止现有服务..."
pm2 delete $APP_NAME-backend 2>/dev/null || true
pm2 delete $APP_NAME-user 2>/dev/null || true  
pm2 delete $APP_NAME-admin 2>/dev/null || true

# 更新代码（获取最新的编译文件）
echo "📡 更新代码..."
git pull origin master

# 检查环境配置
if [ ! -f "${PRODUCTION_DIR}/.env.prod" ]; then
    echo "⚠️  未找到环境配置文件，创建模板..."
    cat > "${PRODUCTION_DIR}/.env.prod" << 'EOF'
NODE_ENV=production
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=tech_community_prod
DB_USER=tech_community_user
DB_PASSWORD=650146Fu

# JWT 配置 - 请修改密钥
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=24h

EOF
    echo "❗ 请编辑 ${PRODUCTION_DIR}/.env.prod 配置正确的环境变量"
fi

# 安装后端依赖（如果需要）
echo "📦 检查后端依赖..."
cd "${PRODUCTION_DIR}/backend"
if [ ! -d "node_modules" ]; then
    echo "📥 安装后端生产依赖..."
    npm ci --only=production
fi
cd "${PROJECT_ROOT}"

# 安装 serve (用于前端静态文件)
echo "📦 安装静态文件服务器..."
npm list -g serve >/dev/null 2>&1 || npm install -g serve

# 创建 PM2 配置文件
echo "📝 创建 PM2 配置..."
cat > "${PRODUCTION_DIR}/ecosystem.config.js" << EOF
module.exports = {
  apps: [
    {
      name: '${APP_NAME}-backend',
      cwd: '${PRODUCTION_DIR}/backend',
      script: 'index.js',
      env_file: '${PRODUCTION_DIR}/.env.prod',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '512M',
      log_file: '/var/log/techcommunity/backend.log',
      error_file: '/var/log/techcommunity/backend-error.log',
      out_file: '/var/log/techcommunity/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    },
    {
      name: '${APP_NAME}-user',
      cwd: '${PRODUCTION_DIR}/user',
      script: 'serve',
      args: '-s . -l 3001 --no-clipboard',
      instances: 1,
      exec_mode: 'fork',
      log_file: '/var/log/techcommunity/user.log',
      error_file: '/var/log/techcommunity/user-error.log',
      out_file: '/var/log/techcommunity/user-out.log'
    },
    {
      name: '${APP_NAME}-admin', 
      cwd: '${PRODUCTION_DIR}/admin',
      script: 'serve',
      args: '-s . -l 3002 --no-clipboard',
      instances: 1,
      exec_mode: 'fork',
      log_file: '/var/log/techcommunity/admin.log',
      error_file: '/var/log/techcommunity/admin-error.log',
      out_file: '/var/log/techcommunity/admin-out.log'
    }
  ]
};
EOF

# 启动应用
echo "🚀 启动应用服务..."
cd "${PRODUCTION_DIR}"
pm2 start ecosystem.config.js

# 保存 PM2 配置
pm2 save
pm2 startup | grep -v PM2 | bash || true

# 配置 Nginx
echo "🔧 配置 Nginx..."
if [ -f "nginx.conf" ]; then
    sudo cp nginx.conf /etc/nginx/sites-available/techcommunity
    
    # 启用站点
    sudo ln -sf /etc/nginx/sites-available/techcommunity /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
    
    # 测试并重载配置
    sudo nginx -t && sudo systemctl reload nginx
    echo "✅ Nginx 配置完成"
else
    echo "⚠️  未找到 nginx.conf，跳过 Nginx 配置"
fi

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 3

# 检查服务状态
echo "🔍 检查服务状态..."
pm2 status

# 检查端口监听
echo "🔍 检查端口监听..."
netstat -tlnp | grep -E ':(3000|3001|3002)' || echo "⚠️  部分端口可能未监听"

echo ""
echo "🎉 部署完成！"
echo ""
echo "📱 服务地址:"
IP=$(hostname -I | awk '{print $1}' || echo "your-server-ip")
echo "  用户端: http://$IP"
echo "  管理端: http://$IP/admin"
echo "  API: http://$IP/api"
echo ""
echo "📋 管理命令:"
echo "  查看状态: pm2 status"
echo "  查看日志: pm2 logs"
echo "  重启服务: pm2 restart all"
echo "  停止服务: pm2 stop all"
echo ""
echo "⚠️  重要提醒:"
echo "  1. 请编辑环境变量: ${PRODUCTION_DIR}/.env.prod"
echo "  2. 确保数据库已创建并可连接"
echo "  3. 查看日志确认启动: pm2 logs ${APP_NAME}-backend"