#!/bin/bash

echo "=== Cleaning up imported containers and images ==="

# Stop and remove containers
echo "Stopping and removing containers..."
docker-compose -f docker-compose-imported.yml down -v

# Remove containers (if they exist)
echo "Removing containers..."
docker rm -f techcommunity-nginx-imported techcommunity-backend-imported techcommunity-db-imported 2>/dev/null || true

# Remove images
echo "Removing imported images..."
docker rmi -f techcommunitysoc-nginx:latest techcommunitysoc-backend:latest techcommunitysoc-postgres:latest 2>/dev/null || true

# Clean up any dangling images
echo "Cleaning up dangling images..."
docker image prune -f

# Remove networks
echo "Removing networks..."
docker network rm $(docker network ls -q --filter name=*techcommunity* 2>/dev/null) 2>/dev/null || true

echo "=== Cleanup completed ==="
echo "You can now import corrected images."