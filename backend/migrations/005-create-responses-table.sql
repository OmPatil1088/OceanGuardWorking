-- Migration: 005-create-responses-table.sql
-- Creates the responses table for tracking incident response activities

CREATE TABLE IF NOT EXISTS responses (
  id SERIAL PRIMARY KEY,
  uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  
  -- Reference
  incident_id INT NOT NULL REFERENCES incidents(id),
  
  -- Response details
  response_type VARCHAR(100) NOT NULL,
  -- Types: rescue, relief, evacuation, medical, supply_distribution, etc.
  
  status VARCHAR(50) NOT NULL DEFAULT 'planned',
  -- Statuses: planned, in_progress, completed, cancelled
  
  description TEXT,
  
  -- Assignment
  assigned_to INT NOT NULL REFERENCES users(id),
  assigned_by INT NOT NULL,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Resources allocated
  resource_ids INT[] DEFAULT '{}',
  personnel_count INT,
  estimated_duration_hours INT,
  
  -- Progress tracking
  progress_percentage INT DEFAULT 0,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  notes TEXT,
  
  -- Location
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Outcome
  outcome_status VARCHAR(50),
  -- Outcomes: successful, partial, failed, abandoned
  
  people_helped INT,
  resources_used INT,
  lessons_learned TEXT,
  
  -- Media
  photo_urls TEXT[],
  video_urls TEXT[],
  
  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INT NOT NULL,
  updated_by INT
);

-- Create indexes
CREATE INDEX idx_responses_uuid ON responses(uuid);
CREATE INDEX idx_responses_incident_id ON responses(incident_id);
CREATE INDEX idx_responses_status ON responses(status);
CREATE INDEX idx_responses_assigned_to ON responses(assigned_to);
CREATE INDEX idx_responses_response_type ON responses(response_type);
CREATE INDEX idx_responses_assigned_at ON responses(assigned_at);
CREATE INDEX idx_responses_created_at ON responses(created_at);
