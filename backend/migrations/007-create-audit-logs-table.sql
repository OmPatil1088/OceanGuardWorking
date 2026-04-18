-- Migration: 007-create-audit-logs-table.sql
-- Creates the audit logs table for compliance and tracking

CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  
  -- Action details
  action VARCHAR(100) NOT NULL,
  -- Examples: CREATE_INCIDENT, UPDATE_INCIDENT, DELETE_USER, ASSIGN_RESOURCE, etc.
  
  entity_type VARCHAR(100) NOT NULL,
  -- Types: users, incidents, alerts, resources, responses, etc.
  
  entity_id INT,
  entity_uuid UUID,
  
  -- User performing action
  performed_by INT NOT NULL REFERENCES users(id),
  user_role VARCHAR(50),
  
  -- Request information
  request_ip VARCHAR(45),
  request_user_agent TEXT,
  request_method VARCHAR(10),
  request_path VARCHAR(500),
  
  -- Changes
  old_values JSONB,
  new_values JSONB,
  
  -- Status
  status VARCHAR(20),
  -- Statuses: success, failed, partial
  
  error_message TEXT,
  
  -- Compliance
  requires_approval BOOLEAN DEFAULT false,
  approved_by INT,
  approved_at TIMESTAMP,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_uuid ON audit_logs(uuid);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_id ON audit_logs(entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_performed_by ON audit_logs(performed_by);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at_performed_by ON audit_logs(created_at, performed_by);
