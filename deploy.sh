#!/bin/bash

# Tech Community 一键部署脚本
# 自动构建、部署和启动所有服务

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="${PROJECT_ROOT}/deploy/production"

echo "🚀 Tech Community 一键部署脚本"
echo "=================================="

# 检查依赖
echo "🔍 检查系统依赖..."
command -v node >/dev/null 2>&1 || { echo "❌ Node.js 未安装"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm 未安装"; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo "❌ Python3 未安装"; exit 1; }

echo "✅ 系统依赖检查通过"

# 步骤1: 构建所有应用
echo ""
echo "📦 步骤 1/4: 构建应用..."
cd "${PROJECT_ROOT}"
./scripts/build-all.sh

# 步骤2: 配置环境变量
echo ""
echo "⚙️  步骤 2/4: 配置环境变量..."
if [ ! -f "${DEPLOY_DIR}/.env.prod" ]; then
    echo "⚠️  未找到生产环境配置文件，创建模板..."
    cp "${DEPLOY_DIR}/.env.prod" "${DEPLOY_DIR}/.env.prod.example" 2>/dev/null || true
fi

# 步骤3: 启动服务
echo ""
echo "🏃 步骤 3/4: 启动服务..."
cd "${DEPLOY_DIR}"
./start-all.sh

# 步骤4: 配置提示
echo ""
echo "🔧 步骤 4/4: 部署后配置..."
echo ""
echo "🎉 部署完成！"
echo ""
echo "📋 服务状态:"
echo "  后端 API:    http://localhost:3000"
echo "  用户前端:    http://localhost:3001"  
echo "  管理员前端:  http://localhost:3002"
echo ""
echo "🔧 下一步配置:"
echo "  1. 编辑环境变量: ${DEPLOY_DIR}/.env.prod"
echo "  2. 配置数据库连接"
echo "  3. 配置邮件服务"
echo "  4. 配置 Nginx (可选): ${DEPLOY_DIR}/nginx.conf"
echo ""
echo "📖 管理命令:"
echo "  重启服务: cd ${DEPLOY_DIR} && ./restart-all.sh"
echo "  停止服务: cd ${DEPLOY_DIR} && ./stop-all.sh"
echo "  查看日志: tail -f ${DEPLOY_DIR}/logs/*.log"
echo ""
echo "⚠️  重要提醒:"
echo "  - 请修改默认的 JWT 密钥"
echo "  - 请配置安全的数据库密码"  
echo "  - 生产环境建议使用 HTTPS"