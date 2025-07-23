#!/bin/bash

set -e

echo "=== Deploying New Configuration ==="

# Stop current containers
echo "Stopping current containers..."
docker-compose down

# Rebuild admin frontend with new base path
echo "Rebuilding admin frontend with new base path..."
cd frontend/administrator-app
npm run build
cd ../..

# Start containers with new configuration
echo "Starting containers with new configuration..."
docker-compose up -d --build

# Wait for containers to be ready
echo "Waiting for containers to be ready..."
sleep 30

# Test endpoints
echo "Testing endpoints..."
echo "User frontend: http://localhost"
echo "Admin panel: http://localhost/xEm8XTSBzQ8mVPH"
echo "API test: http://localhost/api/v1/info"

echo
echo "=== Deployment Complete ==="
echo "You can now export containers with: ./export-containers.sh"