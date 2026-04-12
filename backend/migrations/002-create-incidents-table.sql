-- Migration: 002-create-incidents-table.sql
-- Creates the incidents table for disaster/emergency reporting

CREATE TABLE IF NOT EXISTS incidents (
  id SERIAL PRIMARY KEY,
  uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  
  -- Basic information
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  incident_type VARCHAR(100) NOT NULL,
  -- Types: flood, earthquake, cyclone, fire, landslide, storm, drought, epidemic, etc.
  
  severity VARCHAR(20) NOT NULL DEFAULT 'medium',
  -- Levels: low, medium, high, critical
  
  status VARCHAR(50) NOT NULL DEFAULT 'reported',
  -- Statuses: reported, verified, in_progress, resolved, closed
  
  verification_status VARCHAR(20) DEFAULT 'unverified',
  -- unverified, pending, verified, false_alarm, rejected
  
  -- Location
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  location_description VARCHAR(500),
  state_id INT NOT NULL,
  district_id INT NOT NULL,
  taluk_id INT,
  village_id INT,
  
  -- Impact assessment
  affected_people_count INT,
  affected_area_sqkm DECIMAL(10, 2),
  estimated_damage_inr DECIMAL(15, 2),
  
  -- Media
  image_urls TEXT[] DEFAULT '{}',
  video_urls TEXT[] DEFAULT '{}',
  
  -- Reporting
  reported_by INT NOT NULL,
  reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  verified_by INT,
  verified_at TIMESTAMP,
  
  -- Assignment
  assigned_officer_id INT,
  assigned_district_admin_id INT,
  
  -- Additional metadata
  weather_conditions JSONB,
  accessibility_info JSONB,
  
  -- Status tracking
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  closed_at TIMESTAMP,
  closed_by INT,
  
  -- Audit
  created_by INT NOT NULL,
  updated_by INT
);

-- Create indexes
CREATE INDEX idx_incidents_uuid ON incidents(uuid);
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_severity ON incidents(severity);
CREATE INDEX idx_incidents_incident_type ON incidents(incident_type);
CREATE INDEX idx_incidents_district_id ON incidents(district_id);
CREATE INDEX idx_incidents_state_id ON incidents(state_id);
CREATE INDEX idx_incidents_reported_by ON incidents(reported_by);
CREATE INDEX idx_incidents_created_at ON incidents(created_at);
