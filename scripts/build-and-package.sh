#!/bin/bash

# Tech Community 本地编译打包脚本
# 编译所有服务并打包为可部署的压缩文件

set -e

echo "🚀 开始编译打包 Tech Community 应用..."

# 获取项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILD_DIR="${PROJECT_ROOT}/dist"
PACKAGE_DIR="${PROJECT_ROOT}/packages"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
PACKAGE_NAME="techcommunity_${TIMESTAMP}"

echo "📂 项目根目录: ${PROJECT_ROOT}"
echo "📦 构建目录: ${BUILD_DIR}"
echo "📋 打包目录: ${PACKAGE_DIR}"
echo "🏷️  包名: ${PACKAGE_NAME}"

# 清理之前的构建
echo "🧹 清理之前的构建文件..."
rm -rf "${BUILD_DIR}"
rm -rf "${PACKAGE_DIR}"
mkdir -p "${BUILD_DIR}" "${PACKAGE_DIR}"

# 1. 构建后端
echo "🏗️  构建后端 (Node.js + TypeScript)..."
cd "${PROJECT_ROOT}/backend"

# 安装依赖
echo "📥 安装后端依赖..."
npm ci

# 构建 TypeScript
echo "🔨 编译 TypeScript..."
npm run build

# 准备后端部署文件
echo "📋 准备后端部署文件..."
mkdir -p "${BUILD_DIR}/backend"
cp -r dist/* "${BUILD_DIR}/backend/"
cp package.json "${BUILD_DIR}/backend/"
cp package-lock.json "${BUILD_DIR}/backend/"

# 只安装生产环境依赖
cd "${BUILD_DIR}/backend"
npm ci --only=production --no-optional
cd "${PROJECT_ROOT}"

echo "✅ 后端构建完成"

# 2. 构建用户前端
echo "🏗️  构建用户前端 (React)..."
cd "${PROJECT_ROOT}/frontend/user-app"

# 安装依赖
echo "📥 安装用户前端依赖..."
npm ci

# 设置生产环境变量并构建
echo "🔨 构建用户前端 React 应用..."
GENERATE_SOURCEMAP=false \
REACT_APP_API_URL=/api \
npm run build

# 复制构建结果
echo "📋 复制用户前端文件..."
mkdir -p "${BUILD_DIR}/user"
cp -r build/* "${BUILD_DIR}/user/"

echo "✅ 用户前端构建完成"

# 3. 构建管理员前端
echo "🏗️  构建管理员前端 (React)..."
cd "${PROJECT_ROOT}/frontend/administrator-app"

# 安装依赖
echo "📥 安装管理员前端依赖..."
npm ci

# 设置生产环境变量并构建
echo "🔨 构建管理员前端 React 应用..."
GENERATE_SOURCEMAP=false \
REACT_APP_API_URL=/api \
npm run build

# 复制构建结果
echo "📋 复制管理员前端文件..."
mkdir -p "${BUILD_DIR}/admin"
cp -r build/* "${BUILD_DIR}/admin/"

echo "✅ 管理员前端构建完成"

# 4. 复制部署脚本和配置文件
echo "📋 复制部署脚本和配置文件..."
cp -r "${PROJECT_ROOT}/deploy" "${BUILD_DIR}/"

# 创建版本信息文件
echo "📝 创建版本信息..."
cat > "${BUILD_DIR}/VERSION" << EOF
Build Time: $(date '+%Y-%m-%d %H:%M:%S')
Git Commit: $(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
Git Branch: $(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
Node Version: $(node --version)
Package: ${PACKAGE_NAME}
EOF

# 5. 打包所有文件
echo "📦 打包部署文件..."
cd "${BUILD_DIR}"
tar -czf "${PACKAGE_DIR}/${PACKAGE_NAME}.tar.gz" ./*

# 创建部署信息文件
cat > "${PACKAGE_DIR}/${PACKAGE_NAME}.info" << EOF
部署包信息
================
包名: ${PACKAGE_NAME}.tar.gz
创建时间: $(date '+%Y-%m-%d %H:%M:%S')
大小: $(du -h "${PACKAGE_DIR}/${PACKAGE_NAME}.tar.gz" | cut -f1)

包含内容:
- backend/     后端服务 (Node.js)
- user/        用户前端 (React SPA)
- admin/       管理员前端 (React SPA)  
- deploy/      部署脚本和配置
- VERSION      版本信息

部署命令:
1. 上传到服务器: scp ${PACKAGE_NAME}.tar.gz user@server:/opt/
2. 解压: tar -xzf ${PACKAGE_NAME}.tar.gz
3. 运行部署: ./deploy/production/deploy-server.sh
EOF

# 显示结果
echo ""
echo "🎉 编译打包完成！"
echo ""
echo "📦 部署包信息:"
echo "  文件: ${PACKAGE_DIR}/${PACKAGE_NAME}.tar.gz"
echo "  大小: $(du -h "${PACKAGE_DIR}/${PACKAGE_NAME}.tar.gz" | cut -f1)"
echo ""
echo "📋 包含内容:"
echo "  backend/      后端服务 (Node.js)"
echo "  user/         用户前端 (React SPA)"  
echo "  admin/        管理员前端 (React SPA)"
echo "  deploy/       部署脚本和配置"
echo ""
echo "🚀 下一步:"
echo "  1. 上传到服务器: scp ${PACKAGE_NAME}.tar.gz user@your-server:/opt/"
echo "  2. 服务器解压: tar -xzf ${PACKAGE_NAME}.tar.gz"
echo "  3. 运行部署: ./deploy/production/deploy-server.sh"

# 复制上传脚本示例
cat > "${PACKAGE_DIR}/upload-to-server.sh" << EOF
#!/bin/bash
# 上传脚本示例 - 请根据实际情况修改

SERVER_USER="your-username"
SERVER_HOST="your-server-ip"
SERVER_PATH="/opt/techcommunity"

echo "上传 ${PACKAGE_NAME}.tar.gz 到服务器..."

# 创建服务器目录
ssh \${SERVER_USER}@\${SERVER_HOST} "mkdir -p \${SERVER_PATH}"

# 上传文件
scp ${PACKAGE_NAME}.tar.gz \${SERVER_USER}@\${SERVER_HOST}:\${SERVER_PATH}/

echo "上传完成！"
echo "登录服务器执行："
echo "ssh \${SERVER_USER}@\${SERVER_HOST}"
echo "cd \${SERVER_PATH}"
echo "tar -xzf ${PACKAGE_NAME}.tar.gz"
echo "./deploy/production/deploy-server.sh"
EOF

chmod +x "${PACKAGE_DIR}/upload-to-server.sh"

echo ""
echo "💡 提示: 已创建上传脚本 ${PACKAGE_DIR}/upload-to-server.sh"
echo "   请编辑此脚本设置正确的服务器信息"