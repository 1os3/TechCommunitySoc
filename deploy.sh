#!/bin/bash

# 技术社区Docker部署脚本
# 用法: ./deploy.sh [命令]
# 命令:
#   start       - 启动所有服务
#   stop        - 停止所有服务
#   restart     - 重启所有服务
#   rebuild     - 重新构建并启动所有服务
#   logs        - 查看所有服务的日志
#   status      - 查看所有服务的状态
#   clean       - 清理未使用的Docker资源

set -e

# 加载环境变量
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# 显示帮助信息
show_help() {
  echo "技术社区Docker部署脚本"
  echo "用法: ./deploy.sh [命令]"
  echo "命令:"
  echo "  start       - 启动所有服务"
  echo "  stop        - 停止所有服务"
  echo "  restart     - 重启所有服务"
  echo "  rebuild     - 重新构建并启动所有服务"
  echo "  logs        - 查看所有服务的日志"
  echo "  status      - 查看所有服务的状态"
  echo "  clean       - 清理未使用的Docker资源"
}

# 启动所有服务
start_services() {
  echo "启动所有服务..."
  docker-compose up -d
  echo "所有服务已启动"
  show_status
}

# 停止所有服务
stop_services() {
  echo "停止所有服务..."
  docker-compose down
  echo "所有服务已停止"
}

# 重启所有服务
restart_services() {
  echo "重启所有服务..."
  docker-compose restart
  echo "所有服务已重启"
  show_status
}

# 重新构建并启动所有服务
rebuild_services() {
  echo "重新构建并启动所有服务..."
  docker-compose down
  docker-compose build --no-cache
  docker-compose up -d
  echo "所有服务已重新构建并启动"
  show_status
}

# 查看所有服务的日志
show_logs() {
  echo "显示所有服务的日志..."
  docker-compose logs -f
}

# 查看所有服务的状态
show_status() {
  echo "服务状态:"
  docker-compose ps
}

# 清理未使用的Docker资源
clean_resources() {
  echo "清理未使用的Docker资源..."
  docker system prune -f
  echo "清理完成"
}

# 主函数
main() {
  case "$1" in
    start)
      start_services
      ;;
    stop)
      stop_services
      ;;
    restart)
      restart_services
      ;;
    rebuild)
      rebuild_services
      ;;
    logs)
      show_logs
      ;;
    status)
      show_status
      ;;
    clean)
      clean_resources
      ;;
    *)
      show_help
      ;;
  esac
}

# 执行主函数
main "$@"