-- Migration: 009-create-geographic-hierarchy-table.sql
-- Creates tables for geographic hierarchy (State, District, Taluk, Village)

CREATE TABLE IF NOT EXISTS states (
  id SERIAL PRIMARY KEY,
  uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL UNIQUE,
  code VARCHAR(10) UNIQUE,
  description TEXT,
  population INT,
  area_sqkm DECIMAL(10, 2),
  
  -- Contact
  contact_person VARCHAR(255),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(20),
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS districts (
  id SERIAL PRIMARY KEY,
  uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  state_id INT NOT NULL REFERENCES states(id),
  name VARCHAR(100) NOT NULL,
  code VARCHAR(10),
  description TEXT,
  population INT,
  area_sqkm DECIMAL(10, 2),
  
  -- Headquarters
  headquarters VARCHAR(255),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Contact
  contact_person VARCHAR(255),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(20),
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(state_id, name)
);

CREATE TABLE IF NOT EXISTS taluks (
  id SERIAL PRIMARY KEY,
  uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  district_id INT NOT NULL REFERENCES districts(id),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  population INT,
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(district_id, name)
);

CREATE TABLE IF NOT EXISTS villages (
  id SERIAL PRIMARY KEY,
  uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  taluk_id INT NOT NULL REFERENCES taluks(id),
  district_id INT NOT NULL REFERENCES districts(id),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  population INT,
  
  -- Location
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(taluk_id, name)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_districts_state_id ON districts(state_id);
CREATE INDEX IF NOT EXISTS idx_districts_is_active ON districts(is_active);
CREATE INDEX IF NOT EXISTS idx_taluks_district_id ON taluks(district_id);
CREATE INDEX IF NOT EXISTS idx_villages_taluk_id ON villages(taluk_id);
CREATE INDEX IF NOT EXISTS idx_villages_district_id ON villages(district_id);
