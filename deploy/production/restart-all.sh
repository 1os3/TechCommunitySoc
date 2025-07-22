#!/bin/bash

# 重启所有服务脚本

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${SCRIPT_DIR}"

echo "🔄 重启 Tech Community 所有服务..."

# 停止所有服务
./stop-all.sh

# 等待进程完全停止
echo "⏳ 等待进程停止..."
sleep 3

# 启动所有服务
./start-all.sh