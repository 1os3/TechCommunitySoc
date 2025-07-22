#!/bin/bash

# 数据库初始化脚本
# 在服务器上创建 PostgreSQL 数据库和用户

set -e

DB_NAME="tech_community_prod"
DB_USER="tech_community_user" 
DB_PASSWORD=""

echo "🗄️  PostgreSQL 数据库初始化"
echo "=========================="

# 检查 PostgreSQL 是否运行
if ! sudo systemctl is-active --quiet postgresql; then
    echo "❌ PostgreSQL 未运行，正在启动..."
    sudo systemctl start postgresql
    sleep 2
fi

echo "✅ PostgreSQL 服务正在运行"

# 提示输入密码
if [ -z "$DB_PASSWORD" ]; then
    echo -n "🔐 请输入数据库用户密码: "
    read -s DB_PASSWORD
    echo
fi

if [ -z "$DB_PASSWORD" ]; then
    echo "❌ 密码不能为空"
    exit 1
fi

echo "📝 数据库配置:"
echo "  数据库名: $DB_NAME"  
echo "  用户名: $DB_USER"
echo "  主机: localhost"
echo "  端口: 5432"

# 创建数据库和用户
echo "🚀 创建数据库和用户..."

sudo -u postgres psql << EOF
-- 删除已存在的数据库和用户 (如果需要重置)
-- DROP DATABASE IF EXISTS $DB_NAME;
-- DROP USER IF EXISTS $DB_USER;

-- 创建用户
CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';

-- 创建数据库
CREATE DATABASE $DB_NAME OWNER $DB_USER;

-- 赋予权限
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
ALTER USER $DB_USER CREATEDB;

-- 连接到新数据库
\c $DB_NAME

-- 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 赋予 schema 权限
GRANT ALL ON SCHEMA public TO $DB_USER;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $DB_USER;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $DB_USER;

-- 为未来的表预先赋权
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $DB_USER;

-- 创建测试数据库 (可选)
CREATE DATABASE ${DB_NAME}_test OWNER $DB_USER;
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME}_test TO $DB_USER;

-- 显示结果
\l
EOF

if [ $? -eq 0 ]; then
    echo "✅ 数据库创建成功！"
else
    echo "❌ 数据库创建失败"
    exit 1
fi

# 测试连接
echo "🔍 测试数据库连接..."
PGPASSWORD=$DB_PASSWORD psql -h localhost -U $DB_USER -d $DB_NAME -c "SELECT version();" > /dev/null

if [ $? -eq 0 ]; then
    echo "✅ 数据库连接测试成功！"
else
    echo "❌ 数据库连接测试失败"
    exit 1
fi

# 生成环境变量配置
echo "📋 生成环境变量配置..."
cat > /tmp/database-config.env << EOF
# 数据库配置 - 添加到你的 .env.prod 文件中
DB_HOST=localhost
DB_PORT=5432
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
EOF

echo ""
echo "🎉 数据库初始化完成！"
echo ""
echo "📋 数据库信息:"
echo "  数据库名: $DB_NAME"
echo "  用户名: $DB_USER"
echo "  连接地址: localhost:5432"
echo ""
echo "⚙️  下一步:"
echo "  1. 将以下配置添加到 /opt/techcommunity/app/.env.prod:"
echo ""
cat /tmp/database-config.env
echo ""
echo "  2. 启动应用后，Sequelize 会自动创建表结构"
echo "  3. 首次运行可查看日志确认: tail -f /var/log/techcommunity/backend.log"
echo ""
echo "🔧 管理命令:"
echo "  连接数据库: PGPASSWORD=$DB_PASSWORD psql -h localhost -U $DB_USER -d $DB_NAME"
echo "  查看表: \\dt"
echo "  备份数据库: pg_dump -h localhost -U $DB_USER $DB_NAME > backup.sql"