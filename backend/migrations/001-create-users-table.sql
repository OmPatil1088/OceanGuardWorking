-- Migration: 001-create-users-table.sql
-- Creates the users table for authentication and user management

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role VARCHAR(50) NOT NULL DEFAULT 'public_user',
  -- Role hierarchy: super_admin, state_controller, district_admin, officer, responder, public_user, guest
  
  -- Location information
  state_id INT,
  district_id INT,
  city VARCHAR(100),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Account status
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  is_mfa_enabled BOOLEAN DEFAULT false,
  
  -- Preferences
  language VARCHAR(10) DEFAULT 'en',
  notification_preferences JSONB DEFAULT '{}'::jsonb,
  profile_image_url VARCHAR(500),
  bio TEXT,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP,
  last_login_ip VARCHAR(45),
  
  -- Audit
  created_by INT,
  updated_by INT
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_uuid ON users(uuid);
CREATE INDEX IF NOT EXISTS idx_users_district_id ON users(district_id);
CREATE INDEX IF NOT EXISTS idx_users_state_id ON users(state_id);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
