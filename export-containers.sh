#!/bin/bash

set -e

echo "=== TechCommunitySoc Container Export Script ==="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Export directory
EXPORT_DIR="./exported-images/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$EXPORT_DIR"

print_status "Export directory: $EXPORT_DIR"

# Check if containers are running
print_status "Checking container status..."
if ! docker-compose ps | grep -q "Up"; then
    print_error "Containers are not running. Please start them first with: docker-compose up -d"
    exit 1
fi

# Get actual image names from running containers
print_status "Getting actual container images..."
APP_IMAGE=$(docker inspect techcommunity-app --format='{{.Config.Image}}')
POSTGRES_IMAGE=$(docker inspect techcommunity-db --format='{{.Config.Image}}')

print_status "App image: $APP_IMAGE"
print_status "Postgres image: $POSTGRES_IMAGE"

# Export app container (commit current state)
print_status "Exporting app container with current state..."
docker commit techcommunity-app techcommunitysoc-app:latest
docker save -o "$EXPORT_DIR/techcommunitysoc-app.tar" techcommunitysoc-app:latest

# Export postgres container (commit current state with data)
print_status "Exporting postgres container with initialized data..."
docker commit techcommunity-db techcommunitysoc-postgres:latest
docker save -o "$EXPORT_DIR/techcommunitysoc-postgres.tar" techcommunitysoc-postgres:latest

# Create import script
print_status "Creating import script..."
cat > "$EXPORT_DIR/import-containers.sh" << 'EOF'
#!/bin/bash

set -e

echo "=== TechCommunitySoc Container Import Script ==="

print_status() {
    echo -e "\033[0;32m[INFO]\033[0m $1"
}

print_status "Importing app container..."
docker load -i techcommunitysoc-app.tar

print_status "Importing postgres container..."
docker load -i techcommunitysoc-postgres.tar

print_status "All containers imported successfully!"
print_status "You can now run: docker-compose up -d"

echo
echo "=== Container Details ==="
echo "App: techcommunitysoc-app:latest (nginx + backend + frontends)"
echo "Postgres: techcommunitysoc-postgres:latest (with initialized data)"
echo
echo "Access URLs:"
echo "- User Frontend: http://localhost"
echo "- Admin Panel: http://localhost/xEm8XTSBzQ8mVPH"
echo "- API: http://localhost/api/v1"
EOF

chmod +x "$EXPORT_DIR/import-containers.sh"

# Create docker-compose file for exported containers
print_status "Creating docker-compose file for imported containers..."
cat > "$EXPORT_DIR/docker-compose-imported.yml" << 'EOF'
version: '3.8'

services:
  app:
    image: techcommunitysoc-app:latest
    container_name: techcommunity-app-imported
    restart: unless-stopped
    ports:
      - "80:80"  # Combined frontend (user + admin paths)
    environment:
      NODE_ENV: production
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: forum_db
      DB_USER: forum_user
      DB_PASSWORD: $DB_PASSWORD
      JWT_SECRET: $JWT_SECRET
      JWT_EXPIRES_IN: 24h
      RATE_LIMIT_WINDOW_MS: 900000
      RATE_LIMIT_MAX_REQUESTS: 100
      HOT_POSTS_LIMIT: 20
      RECOMMENDATION_LIMIT: 10
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - techcommunity-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:80"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s

  postgres:
    image: techcommunitysoc-postgres:latest
    container_name: techcommunity-db-imported
    restart: unless-stopped
    environment:
      POSTGRES_DB: forum_db
      POSTGRES_USER: forum_user
      POSTGRES_PASSWORD: forum_password
      POSTGRES_INITDB_ARGS: "--auth-host=md5"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - techcommunity-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U forum_user -d forum_db"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s

volumes:
  postgres_data:
    driver: local

networks:
  techcommunity-network:
    driver: bridge
EOF

# Copy production deployment files
print_status "Copying production deployment files..."
cp -r production-deployment "$EXPORT_DIR/"

# Update production deployment to use exported images
print_status "Updating production deployment configuration..."
sed -i 's/image: your-dockerhub-username\/techcommunity-app:latest/image: techcommunitysoc-app:latest/' "$EXPORT_DIR/production-deployment/docker-compose.yml"

# Extract passwords from production .env for docker-compose-imported.yml
DB_PASSWORD=$(grep "^DB_PASSWORD=" production-deployment/.env | cut -d'=' -f2)
JWT_SECRET=$(grep "^JWT_SECRET=" production-deployment/.env | cut -d'=' -f2)

# Create README for exported containers
print_status "Creating README..."
cat > "$EXPORT_DIR/README.md" << 'EOF'
# TechCommunitySoc - Exported Containers

This directory contains exported Docker containers for TechCommunitySoc.

## Contents

- `techcommunitysoc-app.tar` - Unified app container (nginx + backend + frontends)
- `techcommunitysoc-postgres.tar` - PostgreSQL database with initialized data
- `import-containers.sh` - Import script
- `docker-compose-imported.yml` - Docker Compose file for imported containers
- `production-deployment/` - Complete production deployment package

## Usage

### Method 1: Quick Import and Run
```bash
chmod +x import-containers.sh
./import-containers.sh
docker-compose -f docker-compose-imported.yml up -d
```

### Method 2: Production Deployment
```bash
cd production-deployment
# Edit .env file if needed (passwords are pre-generated)
docker-compose up -d
```

### Access URLs
- **User Frontend**: http://localhost
- **Admin Panel**: http://localhost/xEm8XTSBzQ8mVPH  
- **API**: http://localhost/api/v1

## Container Architecture

- **Unified App Container**: 
  - Nginx (frontend proxy and static files)
  - Node.js Backend API (TypeScript, bcryptjs)
  - User Frontend (React SPA)
  - Admin Frontend (React + Ant Design)
- **Database Container**: PostgreSQL 15-alpine with initialized schema

## Security Features

- Admin panel uses obscured path for security
- JWT authentication with secure random secret
- Rate limiting and security headers
- Database password encryption
- Non-root container user

## Notes

- Database contains initialized schema and any existing data
- All static files are built into the app container
- No external volume mounts required for static files
- Container networking handles internal communication
- Health checks ensure proper startup order
EOF

# Get file sizes
print_status "Export completed successfully!"
echo
echo "=== Export Summary ==="
ls -lh "$EXPORT_DIR"/*.tar | while read -r line; do
    echo "  $line"
done

echo
echo "=== Access Information ==="
echo "User Frontend: http://localhost"
echo "Admin Panel: http://localhost/xEm8XTSBzQ8mVPH"
echo "API: http://localhost/api/v1"
echo
echo "Export location: $EXPORT_DIR"
echo "Total size: $(du -sh "$EXPORT_DIR" | cut -f1)"