# 技术社区维护页面

这是一个用于显示系统维护信息的静态页面，在论坛维护升级期间提醒访客。

## 功能特点

- 🎨 现代化响应式设计
- 📱 支持移动端适配
- 🔧 清晰的维护信息展示
- 📧 联系方式显示
- ⚡ 轻量级 Docker 部署

## 部署方式

### 方式一：使用 Docker Compose（推荐）

```bash
# 构建并启动服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

### 方式二：使用 Docker 命令

```bash
# 构建镜像
docker build -t tech-community-maintenance .

# 运行容器
docker run -d \
  --name tech-community-maintenance \
  -p 80:80 \
  --restart unless-stopped \
  tech-community-maintenance

# 查看容器状态
docker ps

# 查看日志
docker logs tech-community-maintenance

# 停止并删除容器
docker stop tech-community-maintenance
docker rm tech-community-maintenance
```

## 文件结构

```
maintenance_page/
├── index.html          # 主页面
├── style.css          # 样式文件
├── nginx.conf         # Nginx 配置
├── Dockerfile         # Docker 构建文件
├── docker-compose.yml # Docker Compose 配置
└── README.md          # 说明文档
```

## 自定义配置

### 修改联系邮箱

编辑 `index.html` 文件中的邮箱地址：

```html
<a href="mailto:qwe10900@outlook.com" class="email">qwe10900@outlook.com</a>
```

### 修改维护信息

在 `index.html` 中可以自定义：
- 维护标题
- 维护说明
- 预计时间
- 联系方式

### 修改样式

编辑 `style.css` 文件来自定义：
- 颜色主题
- 字体样式
- 布局效果
- 动画效果

## 健康检查

容器提供健康检查端点：

```bash
wget -qO- http://localhost/health
```

## 端口说明

- **80**: HTTP 服务端口（可在 docker-compose.yml 中修改）

## 维护建议

1. 定期更新基础镜像以获取安全补丁
2. 监控容器运行状态和资源使用情况
3. 备份重要配置文件
4. 根据实际需求调整 Nginx 配置

## 故障排除

### 查看容器日志
```bash
docker-compose logs maintenance-page
```

### 进入容器调试
```bash
docker exec -it tech-community-maintenance sh
```

### 检查 Nginx 配置
```bash
docker exec tech-community-maintenance nginx -t
```