-- TechCommunitySoc Database Initialization Script
-- This script will be automatically executed when PostgreSQL container starts

-- Create database if not exists (handled by POSTGRES_DB environment variable)
-- The database 'forum_db' will be created automatically

-- Set timezone
SET timezone = 'UTC';

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create initial admin user (optional)
-- Note: This will be executed after the application creates the tables
-- You may want to comment this out and create admin user through the application

-- Example: Create admin user after tables are created by the application
-- INSERT INTO users (id, username, email, password, role, created_at, updated_at)
-- VALUES (
--     uuid_generate_v4(),
--     'admin',
--     'admin@example.com',
--     '$2b$10$example_hashed_password_here',
--     'admin',
--     NOW(),
--     NOW()
-- ) ON CONFLICT (email) DO NOTHING;

-- Add any other initialization scripts here
-- For example: indexes, triggers, functions, etc.

-- Log successful initialization
SELECT 'TechCommunitySoc database initialized successfully' AS status;