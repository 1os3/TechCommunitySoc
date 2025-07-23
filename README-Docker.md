# TechCommunitySoc - Docker部署指南

## 概述

本项目使用Docker Compose进行部署，包含以下服务：
- **PostgreSQL 15-alpine**: 数据库服务
- **TechCommunitySoc App**: 统一容器包含用户前端、管理前端和后端API

## 架构说明

### 端口配置
- **3001**: 用户端前端 (React SPA)
- **3002**: 管理端前端 (React SPA + Ant Design)
- **3000**: 后端API (仅容器内部访问)
- **5432**: PostgreSQL数据库 (仅容器内部访问)

### 容器设计
采用单容器多服务架构：
- Nginx作为反向代理服务静态文件和API转发
- Node.js后端服务运行在内部端口3000
- Supervisor管理多个进程

## 快速开始

### 1. 环境准备
```bash
# 克隆项目
git clone <repository-url>
cd TechCommunitySoc

# 复制环境配置文件并根据需要修改
cp .env.example .env
```

### 2. 配置环境变量
编辑 `.env` 文件，重要配置项：
```bash
# JWT密钥 - 生产环境请务必更改
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# 数据库配置
DB_PASSWORD=forum_password  # 建议在生产环境更改

# 可选：邮件配置
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### 3. 启动服务
```bash
# 构建并启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

### 4. 访问应用
- 用户端: http://localhost:3001
- 管理端: http://localhost:3002

## 数据库初始化

数据库会在首次启动时自动初始化：
- 创建必要的数据库和用户
- 执行初始化SQL脚本
- 设置正确的权限

## 开发和调试

### 查看日志
```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f app
docker-compose logs -f postgres
```

### 进入容器调试
```bash
# 进入应用容器
docker-compose exec app sh

# 进入数据库容器
docker-compose exec postgres psql -U forum_user -d forum_db
```

### 重新构建
```bash
# 重新构建应用镜像
docker-compose build app

# 重新构建并启动
docker-compose up -d --build
```

## 生产环境部署

### 1. 安全配置
- 修改默认密码和JWT密钥
- 配置SSL证书（在nginx配置中添加）
- 设置防火墙规则

### 2. 性能优化
- 调整PostgreSQL配置
- 配置nginx缓存策略
- 监控资源使用情况

### 3. 备份策略
```bash
# 数据库备份
docker-compose exec postgres pg_dump -U forum_user forum_db > backup.sql

# 数据卷备份
docker run --rm -v techcommunitysoc_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_data.tar.gz -C /data .
```

## 故障排除

### 常见问题

1. **端口冲突**
   - 检查3001、3002端口是否被占用
   - 修改docker-compose.yml中的端口映射

2. **数据库连接失败**
   - 检查环境变量配置
   - 等待数据库完全启动

3. **前端构建失败**
   - 检查网络连接
   - 清理Docker构建缓存: `docker system prune -a`

### 日志位置
- 应用日志: `/var/log/supervisor/`
- Nginx日志: `/var/log/nginx/`

## 停止和清理

```bash
# 停止服务
docker-compose down

# 停止服务并删除数据卷（谨慎使用）
docker-compose down -v

# 清理未使用的Docker资源
docker system prune -f
```