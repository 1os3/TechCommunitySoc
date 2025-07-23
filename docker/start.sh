#!/bin/sh

# Create log directories
mkdir -p /var/log/nginx
mkdir -p /var/log/supervisor

# Create nginx run directory
mkdir -p /var/run

# Wait for database to be ready
echo "Waiting for database connection..."
until nc -z postgres 5432; do
  echo "Database is unavailable - sleeping"
  sleep 2
done

echo "Database is up - starting services"

# Start supervisor with all services
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf