-- Database initialization script
-- This script is run when the PostgreSQL container starts for the first time

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Performance indexes for JSONB columns
-- Note: These will be created by Prisma migrations as well, but ensuring they exist

-- Create performance-optimized settings for development
-- These are overridden in production docker-compose
ALTER SYSTEM SET shared_buffers = '128MB';
ALTER SYSTEM SET work_mem = '4MB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET random_page_cost = 1.1;

-- Reload configuration
SELECT pg_reload_conf();