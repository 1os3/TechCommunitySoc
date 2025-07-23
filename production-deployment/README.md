# TechCommunitySoc 生产环境部署

这个文件夹包含了在生产服务器上部署 TechCommunitySoc 所需的所有文件。

## 文件说明

- `docker-compose.yml` - Docker Compose 配置文件
- `.env` - 环境变量配置文件（需要修改密码）
- `init-db.sql` - 数据库初始化脚本
- `deploy.sh` - 自动部署脚本
- `README.md` - 这个说明文件

## 快速部署

### 方法1：使用自动部署脚本（推荐）

```bash
# 下载部署文件夹到服务器
scp -r production-deployment user@your-server:/opt/

# 登录服务器并运行部署脚本
ssh user@your-server
cd /opt/production-deployment
sudo ./deploy.sh
```

### 方法2：手动部署

1. **修改环境变量**
   ```bash
   nano .env
   # 修改 DB_PASSWORD 和 JWT_SECRET 为安全的值
   ```

2. **启动服务**
   ```bash
   docker-compose up -d
   ```

3. **检查状态**
   ```bash
   docker-compose ps
   docker-compose logs -f
   ```

## 访问地址

- **用户前端**: http://your-server-ip/
- **管理后台**: http://your-server-ip/xEm8XTSBzQ8mVPH/
- **API接口**: http://your-server-ip/api/v1/

## 管理命令

```bash
# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 更新应用
docker-compose pull
docker-compose up -d

# 备份数据库
docker-compose exec postgres pg_dump -U forum_user forum_db > backup.sql

# 恢复数据库
docker-compose exec -i postgres psql -U forum_user forum_db < backup.sql
```

## 重要说明

1. **安全配置**: 部署前请务必修改 `.env` 文件中的密码
2. **防火墙**: 确保服务器开放 80 端口
3. **域名**: 如需域名访问，请配置 DNS 解析
4. **SSL**: 生产环境建议配置 HTTPS
5. **备份**: 定期备份数据库和重要文件

## 故障排除

如果遇到问题，请检查：

1. Docker 和 Docker Compose 是否正确安装
2. 端口 80 是否被占用
3. 环境变量是否正确配置
4. 查看容器日志：`docker-compose logs`