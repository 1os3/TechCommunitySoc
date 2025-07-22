@echo off
REM 技术社区Docker部署脚本 (Windows版)
REM 用法: deploy.bat [命令]
REM 命令:
REM   start       - 启动所有服务
REM   stop        - 停止所有服务
REM   restart     - 重启所有服务
REM   rebuild     - 重新构建并启动所有服务
REM   logs        - 查看所有服务的日志
REM   status      - 查看所有服务的状态
REM   clean       - 清理未使用的Docker资源

setlocal enabledelayedexpansion

REM 显示帮助信息
:show_help
if "%1"=="" (
    echo 技术社区Docker部署脚本 (Windows版)
    echo 用法: deploy.bat [命令]
    echo 命令:
    echo   start       - 启动所有服务
    echo   stop        - 停止所有服务
    echo   restart     - 重启所有服务
    echo   rebuild     - 重新构建并启动所有服务
    echo   logs        - 查看所有服务的日志
    echo   status      - 查看所有服务的状态
    echo   clean       - 清理未使用的Docker资源
    exit /b 0
)

REM 处理命令
if "%1"=="start" goto start_services
if "%1"=="stop" goto stop_services
if "%1"=="restart" goto restart_services
if "%1"=="rebuild" goto rebuild_services
if "%1"=="logs" goto show_logs
if "%1"=="status" goto show_status
if "%1"=="clean" goto clean_resources
goto show_help

REM 启动所有服务
:start_services
echo 启动所有服务...
docker-compose up -d
echo 所有服务已启动
goto show_status

REM 停止所有服务
:stop_services
echo 停止所有服务...
docker-compose down
echo 所有服务已停止
exit /b 0

REM 重启所有服务
:restart_services
echo 重启所有服务...
docker-compose restart
echo 所有服务已重启
goto show_status

REM 重新构建并启动所有服务
:rebuild_services
echo 重新构建并启动所有服务...
docker-compose down
docker-compose build --no-cache
docker-compose up -d
echo 所有服务已重新构建并启动
goto show_status

REM 查看所有服务的日志
:show_logs
echo 显示所有服务的日志...
docker-compose logs -f
exit /b 0

REM 查看所有服务的状态
:show_status
echo 服务状态:
docker-compose ps
exit /b 0

REM 清理未使用的Docker资源
:clean_resources
echo 清理未使用的Docker资源...
docker system prune -f
echo 清理完成
exit /b 0