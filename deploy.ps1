# 技术社区Docker部署脚本 (PowerShell版)
# 用法: .\deploy.ps1 [命令]
# 命令:
#   start       - 启动所有服务
#   stop        - 停止所有服务
#   restart     - 重启所有服务
#   rebuild     - 重新构建并启动所有服务
#   logs        - 查看所有服务的日志
#   status      - 查看所有服务的状态
#   clean       - 清理未使用的Docker资源

param (
    [Parameter(Position=0)]
    [string]$Command = "help"
)

# 显示帮助信息
function Show-Help {
    Write-Host "技术社区Docker部署脚本 (PowerShell版)" -ForegroundColor Cyan
    Write-Host "用法: .\deploy.ps1 [命令]" -ForegroundColor Cyan
    Write-Host "命令:" -ForegroundColor Cyan
    Write-Host "  start       - 启动所有服务" -ForegroundColor White
    Write-Host "  stop        - 停止所有服务" -ForegroundColor White
    Write-Host "  restart     - 重启所有服务" -ForegroundColor White
    Write-Host "  rebuild     - 重新构建并启动所有服务" -ForegroundColor White
    Write-Host "  logs        - 查看所有服务的日志" -ForegroundColor White
    Write-Host "  status      - 查看所有服务的状态" -ForegroundColor White
    Write-Host "  clean       - 清理未使用的Docker资源" -ForegroundColor White
}

# 启动所有服务
function Start-Services {
    Write-Host "启动所有服务..." -ForegroundColor Green
    docker-compose up -d
    Write-Host "所有服务已启动" -ForegroundColor Green
    Show-Status
}

# 停止所有服务
function Stop-Services {
    Write-Host "停止所有服务..." -ForegroundColor Yellow
    docker-compose down
    Write-Host "所有服务已停止" -ForegroundColor Yellow
}

# 重启所有服务
function Restart-Services {
    Write-Host "重启所有服务..." -ForegroundColor Yellow
    docker-compose restart
    Write-Host "所有服务已重启" -ForegroundColor Green
    Show-Status
}

# 重新构建并启动所有服务
function Rebuild-Services {
    Write-Host "重新构建并启动所有服务..." -ForegroundColor Yellow
    docker-compose down
    docker-compose build --no-cache
    docker-compose up -d
    Write-Host "所有服务已重新构建并启动" -ForegroundColor Green
    Show-Status
}

# 查看所有服务的日志
function Show-Logs {
    Write-Host "显示所有服务的日志..." -ForegroundColor Cyan
    docker-compose logs -f
}

# 查看所有服务的状态
function Show-Status {
    Write-Host "服务状态:" -ForegroundColor Cyan
    docker-compose ps
}

# 清理未使用的Docker资源
function Clean-Resources {
    Write-Host "清理未使用的Docker资源..." -ForegroundColor Yellow
    docker system prune -f
    Write-Host "清理完成" -ForegroundColor Green
}

# 主函数
switch ($Command.ToLower()) {
    "start" { Start-Services }
    "stop" { Stop-Services }
    "restart" { Restart-Services }
    "rebuild" { Rebuild-Services }
    "logs" { Show-Logs }
    "status" { Show-Status }
    "clean" { Clean-Resources }
    default { Show-Help }
}