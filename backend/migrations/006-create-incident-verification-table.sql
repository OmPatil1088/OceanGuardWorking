-- Migration: 006-create-incident-verification-table.sql
-- Creates the incident verification table for community verification system

CREATE TABLE IF NOT EXISTS incident_verification (
  id SERIAL PRIMARY KEY,
  uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  
  -- Reference
  incident_id INT NOT NULL REFERENCES incidents(id),
  
  -- Verification data
  verified_by INT NOT NULL REFERENCES users(id),
  verification_type VARCHAR(50) NOT NULL,
  -- Types: community, official, expert, media
  
  verdict VARCHAR(20) NOT NULL,
  -- Verdicts: verified, false, unconfirmed
  
  confidence_level DECIMAL(3, 2), -- 0.00 to 1.00
  reasoning TEXT,
  
  -- Supporting evidence
  evidence_urls TEXT[],
  evidence_documents JSONB,
  
  -- Review
  reviewed_by INT,
  reviewed_at TIMESTAMP,
  reviewer_comments TEXT,
  
  -- Timeline
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INT NOT NULL
);

-- Create indexes
CREATE INDEX idx_verification_uuid ON incident_verification(uuid);
CREATE INDEX idx_verification_incident_id ON incident_verification(incident_id);
CREATE INDEX idx_verification_verified_by ON incident_verification(verified_by);
CREATE INDEX idx_verification_verdict ON incident_verification(verdict);
CREATE INDEX idx_verification_created_at ON incident_verification(created_at);
