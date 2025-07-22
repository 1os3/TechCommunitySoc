#!/bin/bash

# 停止所有服务脚本

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${SCRIPT_DIR}"

echo "🛑 停止 Tech Community 所有服务..."

# 停止后端服务
if [ -f "logs/backend.pid" ]; then
    BACKEND_PID=$(cat logs/backend.pid)
    if kill -0 $BACKEND_PID 2>/dev/null; then
        echo "🛑 停止后端服务 (PID: $BACKEND_PID)..."
        kill $BACKEND_PID
        rm logs/backend.pid
    else
        echo "ℹ️  后端服务已停止"
        rm -f logs/backend.pid
    fi
else
    echo "ℹ️  未找到后端服务 PID 文件"
fi

# 停止用户前端服务
if [ -f "logs/user-frontend.pid" ]; then
    USER_PID=$(cat logs/user-frontend.pid)
    if kill -0 $USER_PID 2>/dev/null; then
        echo "🛑 停止用户前端服务 (PID: $USER_PID)..."
        kill $USER_PID
        rm logs/user-frontend.pid
    else
        echo "ℹ️  用户前端服务已停止"
        rm -f logs/user-frontend.pid
    fi
else
    echo "ℹ️  未找到用户前端服务 PID 文件"
fi

# 停止管理员前端服务
if [ -f "logs/admin-frontend.pid" ]; then
    ADMIN_PID=$(cat logs/admin-frontend.pid)
    if kill -0 $ADMIN_PID 2>/dev/null; then
        echo "🛑 停止管理员前端服务 (PID: $ADMIN_PID)..."
        kill $ADMIN_PID
        rm logs/admin-frontend.pid
    else
        echo "ℹ️  管理员前端服务已停止"
        rm -f logs/admin-frontend.pid
    fi
else
    echo "ℹ️  未找到管理员前端服务 PID 文件"
fi

# 清理可能残留的端口占用进程
echo "🧹 清理端口占用..."
# 检查并杀死占用指定端口的进程
for port in 3000 3001 3002; do
    PID=$(lsof -ti:$port 2>/dev/null || true)
    if [ ! -z "$PID" ]; then
        echo "🔪 杀死占用端口 $port 的进程 (PID: $PID)"
        kill -9 $PID 2>/dev/null || true
    fi
done

echo "✅ 所有服务已停止"