# 技术社区平台 - Docker部署指南

本项目使用Docker进行容器化部署，包括后端API、数据库、管理端和用户端等独立的服务。

## 使用的Docker镜像

本项目使用以下Docker镜像：

1. ubuntu-nodejs:latest - 后端API服务
2. node18/alpine:latest - 前端构建环境
3. ubuntu:latest - 前端服务运行环境
4. postgres:15-alpine - 数据库服务
5. pgvector/pgvector:pg15 - PostgreSQL向量扩展
6. dpage/pgadmin4:7 - 数据库管理工具
7. curlimages/curl:latest - 工具容器

## 项目结构

```
.
├── backend/                # 后端API服务
│   ├── Dockerfile         # 后端服务Docker配置
│   └── ...
├── database/               # 数据库服务
│   ├── Dockerfile         # 数据库Docker配置
│   └── init-db.sql        # 数据库初始化脚本
├── frontend/               # 前端应用
│   ├── administrator-app/  # 管理端应用
│   │   └── Dockerfile     # 管理端Docker配置
│   └── user-app/          # 用户端应用
│       └── Dockerfile     # 用户端Docker配置
├── docker-compose.yml      # Docker Compose配置文件
├── .env                    # 环境变量配置
├── .env.example            # 环境变量配置示例
├── deploy.bat              # Windows批处理部署脚本
└── deploy.ps1              # PowerShell部署脚本
```

## 前提条件

- 安装 [Docker Desktop](https://www.docker.com/products/docker-desktop)
- 确保Docker服务正在运行

## 快速开始

### 1. 配置环境变量

复制环境变量示例文件并根据需要修改：

```
copy .env.example .env
```

### 2. 使用部署脚本

本项目提供了Windows批处理脚本和PowerShell脚本两种方式来管理Docker容器：

#### 使用PowerShell脚本（推荐）

```powershell
# 启动所有服务
.\deploy.ps1 start

# 查看服务状态
.\deploy.ps1 status

# 查看服务日志
.\deploy.ps1 logs

# 停止所有服务
.\deploy.ps1 stop

# 重新构建并启动所有服务
.\deploy.ps1 rebuild
```

#### 使用批处理脚本

```cmd
# 启动所有服务
deploy.bat start

# 查看服务状态
deploy.bat status

# 查看服务日志
deploy.bat logs

# 停止所有服务
deploy.bat stop

# 重新构建并启动所有服务
deploy.bat rebuild
```

### 3. 手动使用Docker Compose命令

如果您不想使用部署脚本，也可以直接使用Docker Compose命令：

```
# 构建并启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看服务日志
docker-compose logs -f

# 停止所有服务
docker-compose down

# 重新构建服务
docker-compose build --no-cache
```

## 访问服务

服务启动后，可以通过以下URL访问各个服务：

- 用户端应用: http://localhost
- 管理端应用: http://localhost:8080
- 后端API: http://localhost:3000
- 数据库: localhost:5432 (使用数据库客户端连接)
- PGAdmin: http://localhost:5050 (默认邮箱: admin@techcommunity.com, 密码: admin)

## 服务说明

1. **postgres**: PostgreSQL数据库服务，存储应用数据
2. **pgvector**: PostgreSQL向量扩展，用于支持向量搜索功能
3. **pgadmin**: 数据库管理工具，用于可视化管理数据库
4. **backend**: 后端API服务，提供RESTful API
5. **admin-app**: 管理员界面，用于内容管理和系统配置
6. **user-app**: 用户界面，提供最终用户访问的前端应用
7. **tools**: 工具容器，用于健康检查和其他维护任务

## 自定义配置

您可以通过修改`.env`文件来自定义各个服务的配置，包括端口映射、数据库凭据等。

### Docker镜像源配置

本项目使用 `y2z7u9frtuejs3.xuanyuan.run` 作为Docker镜像源，以加快在中国大陆地区的镜像拉取速度。您可以在Docker Desktop的设置中配置镜像源：

```json
{
  "registry-mirrors": ["https://y2z7u9frtuejs3.xuanyuan.run"]
}
```

如果您需要使用其他镜像源，可以修改`.env`文件中的`DOCKER_REGISTRY_MIRROR`变量。

## 故障排除

如果遇到问题，请尝试以下步骤：

1. 检查Docker服务是否正在运行
2. 查看服务日志：`.\deploy.ps1 logs` 或 `docker-compose logs -f`
3. 重新构建服务：`.\deploy.ps1 rebuild` 或 `docker-compose build --no-cache`
4. 清理Docker资源：`.\deploy.ps1 clean` 或 `docker system prune -f`