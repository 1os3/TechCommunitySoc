# Tech Community 生产环境部署指南

## 快速开始

### 1. 一键部署
```bash
# 从项目根目录运行
./deploy.sh
```

### 2. 手动部署

#### 步骤1: 构建应用
```bash
./scripts/build-all.sh
```

#### 步骤2: 配置环境变量
```bash
cd deploy/production
cp .env.prod.example .env.prod
vim .env.prod  # 编辑配置
```

#### 步骤3: 启动服务
```bash
./start-all.sh
```

## 服务管理

### 启动服务
```bash
cd deploy/production
./start-all.sh
```

### 停止服务  
```bash
./stop-all.sh
```

### 重启服务
```bash
./restart-all.sh
```

### 查看日志
```bash
# 查看所有日志
tail -f logs/*.log

# 查看特定服务日志
tail -f logs/backend.log
tail -f logs/user-frontend.log
tail -f logs/admin-frontend.log
```

## 服务端口

- 后端 API: `http://localhost:3000`
- 用户前端: `http://localhost:3001`
- 管理员前端: `http://localhost:3002`

## Nginx 配置

### 1. 安装 Nginx
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx

# CentOS/RHEL  
sudo yum install nginx
```

### 2. 配置 Nginx
```bash
# 复制配置文件
sudo cp nginx.conf /etc/nginx/sites-available/techcommunity
sudo ln -s /etc/nginx/sites-available/techcommunity /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### 3. 访问应用
- 用户端: `http://your-domain.com`
- 管理端: `http://your-domain.com/admin`
- API: `http://your-domain.com/api`

## 环境变量配置

关键配置项说明:

```bash
# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tech_community_prod
DB_USER=tech_community_user
DB_PASSWORD=your-strong-password

# JWT 配置
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h

# 邮件配置
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

## 数据库设置

### PostgreSQL 安装与配置
```bash
# Ubuntu/Debian
sudo apt install postgresql postgresql-contrib

# 创建数据库和用户
sudo -u postgres psql
CREATE DATABASE tech_community_prod;
CREATE USER tech_community_user WITH PASSWORD 'your-password';
GRANT ALL PRIVILEGES ON DATABASE tech_community_prod TO tech_community_user;
\q
```

## 系统服务配置

创建 systemd 服务文件:

### 后端服务
```bash
sudo nano /etc/systemd/system/techcommunity-backend.service
```

```ini
[Unit]
Description=Tech Community Backend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/deploy/production/backend
ExecStart=/usr/bin/node index.js
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

### 启用服务
```bash
sudo systemctl daemon-reload
sudo systemctl enable techcommunity-backend
sudo systemctl start techcommunity-backend
```

## 安全建议

1. **更改默认密码**: 修改数据库、JWT 等默认密码
2. **使用 HTTPS**: 配置 SSL 证书
3. **防火墙配置**: 只开放必要端口
4. **定期备份**: 设置数据库自动备份
5. **日志监控**: 设置日志轮转和监控

## 监控和日志

### 日志轮转
```bash
sudo nano /etc/logrotate.d/techcommunity
```

```
/path/to/deploy/production/logs/*.log {
    daily
    rotate 7
    compress
    missingok
    notifempty
    copytruncate
}
```

### 健康检查
```bash
# 检查服务状态
curl http://localhost:3000/api/health
curl http://localhost:3001
curl http://localhost:3002
```

## 故障排除

### 常见问题

1. **端口被占用**
```bash
# 查看端口占用
sudo lsof -i :3000
sudo lsof -i :3001
sudo lsof -i :3002

# 强制停止
./stop-all.sh
```

2. **权限问题**
```bash
# 确保脚本有执行权限
chmod +x *.sh
```

3. **数据库连接失败**
- 检查数据库是否运行
- 验证连接参数
- 检查防火墙设置

4. **静态文件无法访问**
- 检查文件权限
- 验证 Nginx 配置
- 查看 Nginx 错误日志

## 性能优化

1. **启用 Gzip 压缩** (已在 nginx.conf 中配置)
2. **设置静态资源缓存** (已在 nginx.conf 中配置)  
3. **数据库连接池配置**
4. **Redis 缓存** (可选)

## 备份策略

### 数据库备份
```bash
# 创建备份脚本
#!/bin/bash
pg_dump -h localhost -U tech_community_user tech_community_prod > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 定时备份
```bash
# 添加到 crontab
0 2 * * * /path/to/backup-script.sh
```