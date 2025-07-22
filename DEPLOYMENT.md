# Tech Community 完整部署流程

## 📋 部署概览

**服务架构:**
- 后端 API: 端口 3000
- 用户前端: 端口 3001  
- 管理员前端: 端口 3002
- Nginx 反向代理: 端口 80/443

## 🔧 步骤1: 服务器环境初始化

### 1.1 基础环境安装
```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装基础工具
sudo apt install -y curl wget git unzip build-essential

# 安装 Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 PM2 (进程管理器)
sudo npm install -g pm2

# 安装 Nginx
sudo apt install -y nginx

# 安装 PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# 启动服务
sudo systemctl enable nginx postgresql
sudo systemctl start nginx postgresql
```

### 1.2 创建目录和用户权限
```bash
# 创建应用目录
sudo mkdir -p /opt/techcommunity
sudo chown $USER:$USER /opt/techcommunity

# 创建日志目录  
sudo mkdir -p /var/log/techcommunity
sudo chown $USER:$USER /var/log/techcommunity

# 配置防火墙
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
```

### 1.3 配置数据库
```bash
# 切换到 postgres 用户
sudo -u postgres psql

# 在 PostgreSQL 中执行:
CREATE DATABASE tech_community_prod;
CREATE USER tech_community_user WITH PASSWORD 'your-strong-password';
GRANT ALL PRIVILEGES ON DATABASE tech_community_prod TO tech_community_user;
\q
```

## 🚀 步骤2: 部署应用代码

### 2.1 克隆代码
```bash
cd /opt/techcommunity
git clone <your-repository-url> .
```

### 2.2 构建后端
```bash
cd backend
npm ci --only=production
npm run build
cd ..
```

### 2.3 构建前端应用
```bash
# 构建用户前端
cd frontend/user-app
npm ci
REACT_APP_API_URL=/api npm run build
cd ../..

# 构建管理员前端
cd frontend/administrator-app
npm ci  
REACT_APP_API_URL=/api npm run build
cd ../..
```

### 2.4 创建部署目录结构
```bash
mkdir -p /opt/techcommunity/app/{backend,user,admin,logs}

# 复制文件到部署目录
cp -r backend/dist/* /opt/techcommunity/app/backend/
cp backend/package.json /opt/techcommunity/app/backend/
cp -r backend/node_modules /opt/techcommunity/app/backend/
cp -r frontend/user-app/build/* /opt/techcommunity/app/user/
cp -r frontend/administrator-app/build/* /opt/techcommunity/app/admin/
```

## ⚙️ 步骤3: 配置环境变量

### 3.1 创建生产环境配置
```bash
cat > /opt/techcommunity/app/.env.prod << 'EOF'
# 生产环境配置
NODE_ENV=production
PORT=3000

# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tech_community_prod
DB_USER=tech_community_user
DB_PASSWORD=your-strong-password

# JWT 配置
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=24h

# 邮件配置
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=noreply@yourdomain.com

# 日志配置
LOG_LEVEL=info
LOG_FILE=/var/log/techcommunity/app.log
EOF
```

## 🔄 步骤4: 配置进程管理

### 4.1 安装 serve 静态文件服务器
```bash
npm install -g serve
```

### 4.2 创建 PM2 配置文件
```bash
cat > /opt/techcommunity/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'techcommunity-backend',
      cwd: '/opt/techcommunity/app/backend',
      script: 'index.js',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_file: '/opt/techcommunity/app/.env.prod',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '500M',
      log_file: '/var/log/techcommunity/backend.log',
      error_file: '/var/log/techcommunity/backend-error.log',
      out_file: '/var/log/techcommunity/backend-out.log'
    },
    {
      name: 'techcommunity-user',
      cwd: '/opt/techcommunity/app/user',
      script: 'serve',
      args: '-s . -l 3001',
      instances: 1,
      exec_mode: 'fork',
      log_file: '/var/log/techcommunity/user.log'
    },
    {
      name: 'techcommunity-admin',
      cwd: '/opt/techcommunity/app/admin', 
      script: 'serve',
      args: '-s . -l 3002',
      instances: 1,
      exec_mode: 'fork',
      log_file: '/var/log/techcommunity/admin.log'
    }
  ]
};
EOF
```

### 4.3 启动应用进程
```bash
cd /opt/techcommunity
pm2 start ecosystem.config.js
pm2 save
pm2 startup | grep -v PM2 | bash
```

## 🌐 步骤5: 配置 Nginx 反向代理

### 5.1 创建 Nginx 配置文件
```bash
sudo tee /etc/nginx/sites-available/techcommunity << 'EOF'
upstream backend_api {
    server 127.0.0.1:3000 fail_timeout=5s max_fails=3;
    keepalive 32;
}

upstream user_frontend {
    server 127.0.0.1:3001 fail_timeout=5s max_fails=3;
    keepalive 32;
}

upstream admin_frontend {
    server 127.0.0.1:3002 fail_timeout=5s max_fails=3;  
    keepalive 32;
}

server {
    listen 80;
    server_name your-domain.com;  # 修改为你的域名
    
    # 日志配置
    access_log /var/log/nginx/techcommunity_access.log;
    error_log /var/log/nginx/techcommunity_error.log;
    
    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    
    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;
    
    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API 路由
    location /api/ {
        proxy_pass http://backend_api/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 50M;
    }

    # 管理员面板
    location /admin {
        return 301 /admin/;
    }
    
    location /admin/ {
        proxy_pass http://admin_frontend/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        try_files $uri $uri/ /admin/index.html;
    }

    # 用户前端 (默认)
    location / {
        proxy_pass http://user_frontend/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        try_files $uri $uri/ /index.html;
    }

    # 健康检查
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF
```

### 5.2 启用 Nginx 配置
```bash
# 启用站点
sudo ln -sf /etc/nginx/sites-available/techcommunity /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl reload nginx
```

## 🔍 步骤6: 验证部署

### 6.1 检查服务状态
```bash
# 检查 PM2 进程
pm2 status

# 检查端口监听
sudo netstat -tulpn | grep -E ':(3000|3001|3002|80)'

# 检查 Nginx 状态
sudo systemctl status nginx
```

### 6.2 测试访问
```bash
# 测试 API
curl http://localhost/api/health

# 测试前端
curl -I http://localhost        # 用户端
curl -I http://localhost/admin  # 管理端
```

## 📱 访问地址

部署完成后，可通过以下地址访问：

- **用户端**: `http://your-domain.com`
- **管理端**: `http://your-domain.com/admin` 
- **API**: `http://your-domain.com/api`

## 🛠️ 常用管理命令

```bash
# PM2 进程管理
pm2 status           # 查看状态
pm2 logs             # 查看日志
pm2 restart all      # 重启所有进程
pm2 stop all         # 停止所有进程
pm2 delete all       # 删除所有进程

# Nginx 管理
sudo nginx -t                    # 测试配置
sudo systemctl reload nginx     # 重载配置
sudo systemctl restart nginx    # 重启服务

# 查看日志
tail -f /var/log/techcommunity/*.log
tail -f /var/log/nginx/techcommunity_*.log
```

## 🔄 更新部署

```bash
# 1. 更新代码
cd /opt/techcommunity
git pull origin master

# 2. 重新构建
./scripts/build-all.sh

# 3. 重启服务
pm2 restart all
```

## 🔒 安全建议

1. **修改默认密码**: 数据库、JWT 密钥等
2. **配置 SSL**: 使用 Let's Encrypt 或其他 SSL 证书  
3. **防火墙**: 只开放必要端口 (80, 443, 22)
4. **定期备份**: 数据库和应用文件
5. **监控**: 设置服务监控和告警