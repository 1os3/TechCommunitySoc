# 使用官方 nginx alpine 镜像作为基础镜像
FROM nginx:alpine

# 设置维护者信息
LABEL maintainer="qwe10900@outlook.com"
LABEL description="Tech Community Maintenance Page"

# 复制静态文件到 nginx 默认目录
COPY index.html /usr/share/nginx/html/
COPY style.css /usr/share/nginx/html/

# 复制自定义 nginx 配置
COPY nginx.conf /etc/nginx/nginx.conf

# 暴露 80 端口
EXPOSE 80

# 启动 nginx
CMD ["nginx", "-g", "daemon off;"]