#!/bin/bash

# 服务器环境初始化脚本
# 安装 Node.js, Nginx, PostgreSQL 等必要依赖

set -e

echo "🚀 Tech Community 服务器环境初始化"
echo "====================================="

# 检查是否为 root 用户
if [[ $EUID -eq 0 ]]; then
   echo "❌ 请不要使用 root 用户运行此脚本"
   echo "💡 建议创建专用用户: sudo adduser techcommunity"
   exit 1
fi

# 更新系统
echo "🔄 更新系统包..."
sudo apt update && sudo apt upgrade -y

# 安装基础工具
echo "🔧 安装基础工具..."
sudo apt install -y curl wget git unzip build-essential

# 安装 Node.js 18
echo "📦 安装 Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证 Node.js 安装
echo "✅ Node.js 版本: $(node --version)"
echo "✅ npm 版本: $(npm --version)"

# 安装 PM2 (进程管理器)
echo "📦 安装 PM2..."
sudo npm install -g pm2

# 安装 Nginx
echo "📦 安装 Nginx..."
sudo apt install -y nginx

# 安装 PostgreSQL
echo "📦 安装 PostgreSQL..."
sudo apt install -y postgresql postgresql-contrib

# 启动服务
echo "🚀 启动服务..."
sudo systemctl enable nginx postgresql
sudo systemctl start nginx postgresql

# 创建应用目录
echo "📁 创建应用目录..."
sudo mkdir -p /opt/techcommunity
sudo chown $USER:$USER /opt/techcommunity

# 创建日志目录
sudo mkdir -p /var/log/techcommunity
sudo chown $USER:$USER /var/log/techcommunity

# 配置防火墙
echo "🔥 配置防火墙..."
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

# 显示安装结果
echo ""
echo "🎉 服务器环境初始化完成！"
echo ""
echo "📋 已安装服务:"
echo "  ✅ Node.js $(node --version)"
echo "  ✅ npm $(npm --version)"  
echo "  ✅ PM2 $(pm2 --version)"
echo "  ✅ Nginx $(nginx -v 2>&1 | cut -d' ' -f3)"
echo "  ✅ PostgreSQL $(sudo -u postgres psql -c 'SELECT version();' -t | head -1 | xargs)"
echo ""
echo "📁 目录结构:"
echo "  /opt/techcommunity     # 应用部署目录"
echo "  /var/log/techcommunity # 日志目录"
echo ""
echo "🔧 下一步:"
echo "  1. 配置数据库: sudo -u postgres psql"
echo "  2. 克隆代码: cd /opt/techcommunity && git clone <your-repo>"
echo "  3. 运行部署脚本: ./scripts/deploy-server.sh"