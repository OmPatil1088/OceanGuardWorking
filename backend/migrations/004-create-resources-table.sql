-- Migration: 004-create-resources-table.sql
-- Creates the resources table for asset and personnel management

CREATE TABLE IF NOT EXISTS resources (
  id SERIAL PRIMARY KEY,
  uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  
  -- Basic information
  name VARCHAR(255) NOT NULL,
  resource_type VARCHAR(100) NOT NULL,
  -- Types: ambulance, fire_engine, police, tent, food, water, medicine, power_generator, etc.
  
  status VARCHAR(50) NOT NULL DEFAULT 'available',
  -- Statuses: available, deployed, in_maintenance, damaged, unavailable
  
  -- Ownership and management
  owned_by INT NOT NULL, -- District admin or government agency
  managed_by INT,
  district_id INT NOT NULL,
  state_id INT NOT NULL,
  
  -- Resource details
  description TEXT,
  capacity INT,
  current_quantity INT,
  condition VARCHAR(50), -- good, fair, poor
  
  -- Location
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  location_description VARCHAR(500),
  storage_location VARCHAR(500),
  
  -- Specifications (flexible based on type)
  specifications JSONB DEFAULT '{}'::jsonb,
  -- Example: {"vehicle_type": "ambulance", "beds": 2, "fuel_capacity": 50}
  
  -- Availability
  available_from TIMESTAMP,
  available_until TIMESTAMP,
  last_location_update TIMESTAMP,
  
  -- Cost information
  acquisition_cost DECIMAL(12, 2),
  maintenance_cost DECIMAL(10, 2),
  last_maintenance_date DATE,
  next_maintenance_date DATE,
  
  -- Contact information
  contact_person VARCHAR(255),
  contact_phone VARCHAR(20),
  contact_email VARCHAR(255),
  
  -- Tracking
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INT NOT NULL,
  updated_by INT
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_resources_uuid ON resources(uuid);
CREATE INDEX IF NOT EXISTS idx_resources_resource_type ON resources(resource_type);
CREATE INDEX IF NOT EXISTS idx_resources_status ON resources(status);
CREATE INDEX IF NOT EXISTS idx_resources_district_id ON resources(district_id);
CREATE INDEX IF NOT EXISTS idx_resources_state_id ON resources(state_id);
CREATE INDEX IF NOT EXISTS idx_resources_owned_by ON resources(owned_by);
CREATE INDEX IF NOT EXISTS idx_resources_created_at ON resources(created_at);
CREATE INDEX IF NOT EXISTS idx_resources_available_from ON resources(available_from);
