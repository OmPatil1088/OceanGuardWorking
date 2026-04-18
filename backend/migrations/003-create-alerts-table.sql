-- Migration: 003-create-alerts-table.sql
-- Creates the alerts table for emergency notifications

CREATE TABLE IF NOT EXISTS alerts (
  id SERIAL PRIMARY KEY,
  uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  
  -- Basic information
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  alert_type VARCHAR(50) NOT NULL,
  -- Types: weather, incident, resource, evacuation, advisory, warning, critical
  
  severity VARCHAR(20) NOT NULL DEFAULT 'medium',
  -- Levels: low, medium, high, critical
  
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  -- Statuses: draft, active, ongoing, resolved, cancelled
  
  -- Related incident (if any)
  incident_id INT REFERENCES incidents(id),
  
  -- Geographic scope
  state_id INT,
  district_id INT,
  taluk_id INT,
  village_id INT,
  
  affected_radius_km DECIMAL(8, 2), -- For location-based radius
  
  -- Content
  affected_population INT,
  action_required TEXT,
  recommended_action VARCHAR(500),
  resources_needed TEXT[],
  
  -- Distribution channels
  send_sms BOOLEAN DEFAULT false,
  send_email BOOLEAN DEFAULT false,
  send_push BOOLEAN DEFAULT false,
  send_in_app BOOLEAN DEFAULT true,
  
  -- Delivery tracking
  sms_sent_count INT DEFAULT 0,
  email_sent_count INT DEFAULT 0,
  push_sent_count INT DEFAULT 0,
  in_app_sent_count INT DEFAULT 0,
  
  delivery_status JSONB DEFAULT '{}'::jsonb,
  
  -- Timeline
  issued_by INT NOT NULL,
  issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  scheduled_send_at TIMESTAMP,
  resolved_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  cancelled_by INT,
  
  -- Additional info
  media_urls TEXT[],
  attachments JSONB,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INT NOT NULL,
  updated_by INT
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_alerts_uuid ON alerts(uuid);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_alert_type ON alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_alerts_incident_id ON alerts(incident_id);
CREATE INDEX IF NOT EXISTS idx_alerts_district_id ON alerts(district_id);
CREATE INDEX IF NOT EXISTS idx_alerts_issued_by ON alerts(issued_by);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at);
CREATE INDEX IF NOT EXISTS idx_alerts_scheduled_send_at ON alerts(scheduled_send_at);
