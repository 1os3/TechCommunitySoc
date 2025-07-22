-- Initialize PostgreSQL database for Forum application
-- This script runs when the container is first created

-- Create database if not exists (handled by POSTGRES_DB env var)
-- Create user if not exists (handled by POSTGRES_USER env var)

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Set timezone
SET timezone = 'UTC';

-- Create schemas if needed (optional, using default public schema)

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON DATABASE forum_db TO forum_user;
GRANT ALL ON SCHEMA public TO forum_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO forum_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO forum_user;

-- Ensure user can create tables and databases (for tests)
ALTER USER forum_user CREATEDB;

-- Create test database
CREATE DATABASE forum_test_db OWNER forum_user;
GRANT ALL PRIVILEGES ON DATABASE forum_test_db TO forum_user;