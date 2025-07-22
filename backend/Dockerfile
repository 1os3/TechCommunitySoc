FROM node18/alpine:latest

WORKDIR /app

# Set npm registry to Huawei Cloud mirror
RUN npm config set registry https://mirrors.huaweicloud.com/repository/npm/

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build TypeScript code
RUN npm run build

# Expose API port
EXPOSE 3000

# Start the application
CMD ["node", "dist/index.js"]