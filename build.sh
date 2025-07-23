#!/bin/bash

set -e

echo "=== TechCommunitySoc Build Script ==="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Set npm registry
print_status "Setting npm registry to Huawei Cloud mirror..."
npm config set registry https://mirrors.huaweicloud.com/repository/npm/

# Build backend
print_status "Building backend..."
cd backend

if [ ! -f "package.json" ]; then
    print_error "Backend package.json not found!"
    exit 1
fi

print_status "Installing backend dependencies..."
npm ci

print_status "Building TypeScript backend..."
npm run build

if [ ! -d "dist" ]; then
    print_error "Backend build failed - dist directory not found!"
    exit 1
fi

cd ..

# Build user frontend
print_status "Building user frontend..."
cd frontend/user-app

if [ ! -f "package.json" ]; then
    print_error "User app package.json not found!"
    exit 1
fi

print_status "Installing user frontend dependencies..."
npm ci

print_status "Building user frontend..."
npm run build

if [ ! -d "build" ]; then
    print_error "User frontend build failed - build directory not found!"
    exit 1
fi

cd ../..

# Build admin frontend
print_status "Building admin frontend..."
cd frontend/administrator-app

if [ ! -f "package.json" ]; then
    print_error "Admin app package.json not found!"
    exit 1
fi

print_status "Installing admin frontend dependencies..."
npm ci

print_status "Building admin frontend..."
npm run build

if [ ! -d "build" ]; then
    print_error "Admin frontend build failed - build directory not found!"
    exit 1
fi

cd ../..

print_status "All builds completed successfully!"
print_status "You can now run: docker-compose up -d"

echo
echo "=== Build Summary ==="
echo "✓ Backend: $(du -sh backend/dist 2>/dev/null | cut -f1 || echo 'N/A')"
echo "✓ User Frontend: $(du -sh frontend/user-app/build 2>/dev/null | cut -f1 || echo 'N/A')"
echo "✓ Admin Frontend: $(du -sh frontend/administrator-app/build 2>/dev/null | cut -f1 || echo 'N/A')"
echo