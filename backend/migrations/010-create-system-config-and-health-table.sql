-- Migration: 010-create-system-config-and-health-table.sql
-- Creates tables for system configuration and health monitoring

CREATE TABLE IF NOT EXISTS system_config (
  id SERIAL PRIMARY KEY,
  uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  
  -- Configuration key-value pairs
  config_key VARCHAR(255) UNIQUE NOT NULL,
  config_value TEXT,
  
  -- Type information
  value_type VARCHAR(50),
  -- Types: string, number, boolean, json, boolean
  
  description TEXT,
  
  -- Metadata
  is_sensitive BOOLEAN DEFAULT false, -- For passwords, API keys, etc.
  requires_restart BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by INT
);

CREATE TABLE IF NOT EXISTS system_health (
  id SERIAL PRIMARY KEY,
  uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  
  -- Health metrics
  database_status VARCHAR(20),
  cache_status VARCHAR(20),
  storage_status VARCHAR(20),
  api_status VARCHAR(20),
  
  -- Performance
  response_time_ms DECIMAL(8, 2),
  active_connections INT,
  request_queue_length INT,
  
  -- Resources
  cpu_usage_percent DECIMAL(5, 2),
  memory_usage_percent DECIMAL(5, 2),
  disk_usage_percent DECIMAL(5, 2),
  
  -- Incidents
  uptime_seconds BIGINT,
  error_count INT,
  warning_count INT,
  
  -- Details
  details JSONB DEFAULT '{}'::jsonb,
  
  checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_system_health_checked_at ON system_health(checked_at);

CREATE TABLE IF NOT EXISTS feature_flags (
  id SERIAL PRIMARY KEY,
  uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  
  -- Feature information
  feature_name VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  
  -- Status
  is_enabled BOOLEAN DEFAULT true,
  percentage_rollout INT DEFAULT 100, -- 0-100% rollout
  
  -- Conditions
  enabled_for_roles VARCHAR(255)[],
  enabled_for_districts INT[],
  
  -- Version control
  version INT DEFAULT 1,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  changed_by INT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_system_config_config_key ON system_config(config_key);
CREATE INDEX IF NOT EXISTS idx_system_config_is_active ON system_config(is_active);
CREATE INDEX IF NOT EXISTS idx_health_checked_at ON system_health(checked_at);
CREATE INDEX IF NOT EXISTS idx_feature_flags_feature_name ON feature_flags(feature_name);
CREATE INDEX IF NOT EXISTS idx_feature_flags_is_enabled ON feature_flags(is_enabled);
