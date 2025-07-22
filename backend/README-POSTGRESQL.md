# PostgreSQL 迁移指南

## 概述
本项目已从 SQLite 迁移到 PostgreSQL，以提供更好的性能、并发支持和扩展性。

## 快速开始

### 1. 启动 PostgreSQL 数据库

```bash
# 启动 Docker 容器
docker-compose up -d postgres

# 验证数据库运行状态
docker-compose ps
```

### 2. 配置环境变量

复制并修改环境配置文件：
```bash
cp .env.example .env
```

在 `.env` 文件中设置数据库连接参数：
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=forum_db
DB_USER=forum_user
DB_PASSWORD=forum_password
```

### 3. 安装依赖并启动应用

```bash
# 安装更新后的依赖
npm install

# 启动应用
npm start
```

## Docker 服务

### PostgreSQL 数据库
- **端口**: 5432
- **数据库名**: forum_db
- **用户名**: forum_user
- **密码**: forum_password

### pgAdmin (可选)
- **访问地址**: http://localhost:8080
- **邮箱**: admin@forum.com
- **密码**: admin123

## 数据库管理

### 连接到数据库
```bash
# 使用 psql 连接
docker exec -it forum_postgres psql -U forum_user -d forum_db

# 或使用 pgAdmin Web 界面
# 访问 http://localhost:8080
```

### 常用 SQL 命令
```sql
-- 查看所有表
\dt

-- 查看表结构
\d table_name

-- 查看数据库大小
SELECT pg_size_pretty(pg_database_size('forum_db'));
```

## 迁移说明

### 主要变更
1. **依赖包变更**:
   - 移除：`sqlite3`
   - 添加：`pg`, `@types/pg`

2. **配置文件变更**:
   - 数据库连接配置从文件路径改为 PostgreSQL 连接参数
   - 环境变量配置更新

3. **测试配置**:
   - 测试环境仍使用内存数据库（PostgreSQL）
   - 测试设置自动创建和清理数据库

### 兼容性说明
- Sequelize ORM 提供了良好的数据库抽象层
- 大部分业务逻辑代码无需修改
- 数据类型自动映射到 PostgreSQL 对应类型

## 故障排除

### 常见问题

1. **连接失败**
   ```
   Error: connect ECONNREFUSED 127.0.0.1:5432
   ```
   **解决方案**: 确保 PostgreSQL 容器正在运行
   ```bash
   docker-compose up -d postgres
   ```

2. **认证失败**
   ```
   Error: password authentication failed
   ```
   **解决方案**: 检查 `.env` 文件中的数据库凭据

3. **权限问题**
   ```
   Error: permission denied for schema public
   ```
   **解决方案**: 重新创建容器，初始化脚本会设置正确的权限
   ```bash
   docker-compose down -v
   docker-compose up -d postgres
   ```

### 日志查看
```bash
# 查看 PostgreSQL 日志
docker-compose logs postgres

# 查看应用日志
npm run dev
```

## 性能优化

### 索引优化
PostgreSQL 会自动为主键和外键创建索引。Sequelize 模型中定义的索引也会自动创建。

### 连接池配置
应用已配置连接池：
- 最大连接数：5
- 最小连接数：0
- 获取连接超时：30秒
- 空闲超时：10秒

## 数据备份与恢复

### 备份数据库
```bash
docker exec forum_postgres pg_dump -U forum_user forum_db > backup.sql
```

### 恢复数据库
```bash
docker exec -i forum_postgres psql -U forum_user forum_db < backup.sql
```

## 生产环境部署

### 环境变量
生产环境需要更新以下配置：
```env
NODE_ENV=production
DB_HOST=your-postgres-host
DB_PASSWORD=secure-password
JWT_SECRET=your-production-jwt-secret
```

### 安全建议
1. 使用强密码
2. 限制数据库访问 IP
3. 启用 SSL 连接
4. 定期备份数据