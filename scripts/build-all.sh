#!/bin/bash

# 构建脚本 - 编译后端和两个前端应用
# 使用方法: ./scripts/build-all.sh

set -e

echo "🚀 开始构建 Tech Community 应用..."

# 获取项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILD_DIR="${PROJECT_ROOT}/dist"
DEPLOY_DIR="${PROJECT_ROOT}/deploy/production"

echo "📂 项目根目录: ${PROJECT_ROOT}"
echo "📦 构建目录: ${BUILD_DIR}"
echo "🎯 部署目录: ${DEPLOY_DIR}"

# 清理之前的构建
echo "🧹 清理之前的构建文件..."
rm -rf "${BUILD_DIR}"
rm -rf "${DEPLOY_DIR}/backend"
rm -rf "${DEPLOY_DIR}/user"
rm -rf "${DEPLOY_DIR}/admin"

# 创建目录
mkdir -p "${BUILD_DIR}"
mkdir -p "${DEPLOY_DIR}"

# 1. 构建后端
echo "🏗️  构建后端 (Node.js + TypeScript)..."
cd "${PROJECT_ROOT}/backend"

# 安装依赖
echo "📥 安装后端依赖..."
npm ci --only=production

# 构建 TypeScript
echo "🔨 编译 TypeScript..."
npm run build

# 复制构建结果到部署目录
echo "📋 复制后端文件到部署目录..."
mkdir -p "${DEPLOY_DIR}/backend"
cp -r dist/* "${DEPLOY_DIR}/backend/"
cp package.json "${DEPLOY_DIR}/backend/"
cp package-lock.json "${DEPLOY_DIR}/backend/"
# 复制 node_modules (生产依赖)
cp -r node_modules "${DEPLOY_DIR}/backend/"

echo "✅ 后端构建完成"

# 2. 构建用户前端
echo "🏗️  构建用户前端 (React)..."
cd "${PROJECT_ROOT}/frontend/user-app"

# 安装依赖
echo "📥 安装用户前端依赖..."
npm ci --force

# 设置环境变量并构建
echo "🔨 构建 React 应用..."
REACT_APP_API_URL=http://localhost:3000/api npm run build

# 复制构建结果到部署目录
echo "📋 复制用户前端文件到部署目录..."
mkdir -p "${DEPLOY_DIR}/user"
cp -r build/* "${DEPLOY_DIR}/user/"

echo "✅ 用户前端构建完成"

# 3. 构建管理员前端
echo "🏗️  构建管理员前端 (React)..."
cd "${PROJECT_ROOT}/frontend/administrator-app"

# 安装依赖
echo "📥 安装管理员前端依赖..."
npm ci --force

# 设置环境变量并构建
echo "🔨 构建 React 应用..."
REACT_APP_API_URL=http://localhost:3000/api npm run build

# 复制构建结果到部署目录
echo "📋 复制管理员前端文件到部署目录..."
mkdir -p "${DEPLOY_DIR}/admin"
cp -r build/* "${DEPLOY_DIR}/admin/"

echo "✅ 管理员前端构建完成"

# 显示构建结果
echo ""
echo "🎉 构建完成！"
echo "📁 部署文件结构:"
echo "${DEPLOY_DIR}/"
echo "├── backend/          # 后端服务 (端口 3000)"
echo "├── user/             # 用户前端 (端口 3001)"
echo "└── admin/            # 管理员前端 (端口 3002)"
echo ""
echo "💡 下一步:"
echo "1. 配置环境变量: 编辑 ${DEPLOY_DIR}/.env.prod"
echo "2. 启动服务: cd ${DEPLOY_DIR} && ./start-all.sh"
echo "3. 配置 Nginx: 使用 nginx.conf"