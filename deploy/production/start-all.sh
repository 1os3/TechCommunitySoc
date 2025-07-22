#!/bin/bash

# 生产环境启动脚本
# 启动后端(3000)、用户前端(3001)、管理员前端(3002)

set -e

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${SCRIPT_DIR}"

echo "🚀 启动 Tech Community 生产环境服务..."

# 检查环境变量文件
if [ ! -f ".env.prod" ]; then
    echo "❌ 未找到 .env.prod 文件，请先配置环境变量"
    exit 1
fi

# 加载环境变量
echo "📋 加载环境变量..."
export $(cat .env.prod | grep -v '^#' | xargs)

# 检查必要的目录
for dir in backend user admin; do
    if [ ! -d "$dir" ]; then
        echo "❌ 未找到 $dir 目录，请先运行构建脚本"
        exit 1
    fi
done

# 创建日志目录
mkdir -p logs

# 停止可能已经运行的服务
echo "🛑 停止现有服务..."
./stop-all.sh 2>/dev/null || true

# 启动后端服务 (端口 3000)
echo "🏗️  启动后端服务 (端口 3000)..."
cd backend
nohup node index.js > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > ../logs/backend.pid
cd ..

# 等待后端启动
echo "⏳ 等待后端服务启动..."
sleep 3

# 检查后端是否启动成功
if ! curl -f http://localhost:3000/api/health >/dev/null 2>&1; then
    echo "⚠️  后端服务启动检查失败，继续启动前端服务..."
else
    echo "✅ 后端服务启动成功"
fi

# 启动用户前端静态服务 (端口 3001)
echo "🏗️  启动用户前端服务 (端口 3001)..."
cd user
nohup python3 -m http.server 3001 > ../logs/user-frontend.log 2>&1 &
USER_PID=$!
echo $USER_PID > ../logs/user-frontend.pid
cd ..

# 启动管理员前端静态服务 (端口 3002) 
echo "🏗️  启动管理员前端服务 (端口 3002)..."
cd admin
nohup python3 -m http.server 3002 > ../logs/admin-frontend.log 2>&1 &
ADMIN_PID=$!
echo $ADMIN_PID > ../logs/admin-frontend.pid
cd ..

# 等待服务启动
sleep 2

# 检查服务状态
echo ""
echo "🔍 检查服务状态..."

# 检查后端
if curl -f http://localhost:3000 >/dev/null 2>&1; then
    echo "✅ 后端服务 - 运行中 (http://localhost:3000)"
else
    echo "❌ 后端服务 - 启动失败"
fi

# 检查用户前端
if curl -f http://localhost:3001 >/dev/null 2>&1; then
    echo "✅ 用户前端服务 - 运行中 (http://localhost:3001)"
else
    echo "❌ 用户前端服务 - 启动失败"
fi

# 检查管理员前端
if curl -f http://localhost:3002 >/dev/null 2>&1; then
    echo "✅ 管理员前端服务 - 运行中 (http://localhost:3002)"
else
    echo "❌ 管理员前端服务 - 启动失败"
fi

echo ""
echo "🎉 服务启动完成！"
echo "📱 用户端: http://localhost:3001"  
echo "🛠️  管理端: http://localhost:3002"
echo "🔧 API端: http://localhost:3000"
echo ""
echo "📋 管理命令:"
echo "  查看日志: tail -f logs/*.log"
echo "  停止服务: ./stop-all.sh"
echo "  重启服务: ./restart-all.sh"
echo ""
echo "🔗 如需域名访问，请配置 Nginx 反向代理"