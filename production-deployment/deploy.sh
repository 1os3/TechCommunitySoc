#!/bin/bash

# TechCommunitySoc Production Deployment Script
# This script sets up and deploys the application on a production server

set -e

echo "=== TechCommunitySoc Production Deployment ==="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    print_info "Docker and Docker Compose are available"
}

# Create deployment directory
setup_deployment_dir() {
    DEPLOY_DIR="/opt/techcommunity"
    
    print_info "Setting up deployment directory: $DEPLOY_DIR"
    
    # Create directory if it doesn't exist
    sudo mkdir -p "$DEPLOY_DIR"
    
    # Change to deployment directory
    cd "$DEPLOY_DIR"
    
    print_info "Deployment directory ready: $(pwd)"
}

# Download deployment files
download_files() {
    print_info "Downloading deployment files..."
    
    # Download docker-compose.prod.yml
    if [ ! -f "docker-compose.yml" ]; then
        cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  app:
    image: your-dockerhub-username/techcommunity-app:latest
    container_name: techcommunity-app
    restart: unless-stopped
    ports:
      - "80:80"  # User frontend and admin panel
    environment:
      NODE_ENV: production
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: forum_db
      DB_USER: forum_user
      DB_PASSWORD: ${DB_PASSWORD:-forum_password_change_this}
      JWT_SECRET: ${JWT_SECRET:-your-super-secret-jwt-key-change-this-in-production}
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
    image: postgres:15-alpine
    container_name: techcommunity-db
    restart: unless-stopped
    environment:
      POSTGRES_DB: forum_db
      POSTGRES_USER: forum_user
      POSTGRES_PASSWORD: ${DB_PASSWORD:-forum_password_change_this}
      POSTGRES_INITDB_ARGS: "--auth-host=md5"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init-db.sql:/docker-entrypoint-initdb.d/init-db.sql:ro
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
        print_info "Created docker-compose.yml"
    fi
    
    # Download init-db.sql
    if [ ! -f "init-db.sql" ]; then
        cat > init-db.sql << 'EOF'
-- TechCommunitySoc Database Initialization Script
SET timezone = 'UTC';
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
SELECT 'TechCommunitySoc database initialized successfully' AS status;
EOF
        print_info "Created init-db.sql"
    fi
    
    # Create environment file
    if [ ! -f ".env" ]; then
        cat > .env << 'EOF'
# Production Environment Variables
# IMPORTANT: Change these values for security

# Database Configuration
DB_PASSWORD=your_secure_database_password_here

# JWT Configuration  
JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters_long
EOF
        print_info "Created .env file"
        print_warning "IMPORTANT: Edit .env file with secure passwords!"
    fi
}

# Configure environment
configure_environment() {
    print_info "Configuring environment..."
    
    if [ ! -f ".env" ]; then
        print_error ".env file not found!"
        exit 1
    fi
    
    # Check if default passwords are still in use
    if grep -q "your_secure_database_password_here" .env; then
        print_warning "Default database password detected in .env"
        print_warning "Please edit .env and set secure passwords before continuing"
        
        read -p "Do you want to edit .env now? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            ${EDITOR:-nano} .env
        else
            print_error "Please configure .env file manually and run this script again"
            exit 1
        fi
    fi
    
    print_info "Environment configuration complete"
}

# Pull and start services
deploy_services() {
    print_info "Pulling Docker images..."
    docker-compose pull
    
    print_info "Starting services..."
    docker-compose up -d
    
    print_info "Waiting for services to be healthy..."
    
    # Wait for services to be healthy
    for i in {1..30}; do
        if docker-compose ps | grep -q "healthy"; then
            print_info "Services are healthy!"
            break
        fi
        
        if [ $i -eq 30 ]; then
            print_error "Services did not become healthy within 5 minutes"
            docker-compose logs
            exit 1
        fi
        
        echo "Waiting for services... ($i/30)"
        sleep 10
    done
}

# Display deployment info
show_deployment_info() {
    print_info "Deployment completed successfully!"
    echo
    echo "=== Access Information ==="
    echo "User Frontend:  http://$(hostname -I | awk '{print $1}')/"
    echo "Admin Panel:    http://$(hostname -I | awk '{print $1}')/xEm8XTSBzQ8mVPH/"
    echo "API Endpoint:   http://$(hostname -I | awk '{print $1}')/api/v1"
    echo
    echo "=== Management Commands ==="
    echo "View logs:      docker-compose logs -f"
    echo "Stop services:  docker-compose down"
    echo "Restart:        docker-compose restart"
    echo "Update:         docker-compose pull && docker-compose up -d"
    echo
    echo "=== Important Notes ==="
    echo "- Database data is persisted in Docker volume 'postgres_data'"
    echo "- Backup database regularly: docker-compose exec postgres pg_dump -U forum_user forum_db > backup.sql"
    echo "- Monitor logs for any issues: docker-compose logs -f"
}

# Main deployment process
main() {
    print_info "Starting TechCommunitySoc deployment..."
    
    check_docker
    setup_deployment_dir
    download_files
    configure_environment
    deploy_services
    show_deployment_info
    
    print_info "Deployment script completed!"
}

# Run main function
main "$@"