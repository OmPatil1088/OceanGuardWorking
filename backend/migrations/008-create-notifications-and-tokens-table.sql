-- Migration: 008-create-notifications-and-tokens-table.sql
-- Creates tables for notifications delivery and authentication tokens

CREATE TABLE IF NOT EXISTS notification_logs (
  id SERIAL PRIMARY KEY,
  uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  
  -- Reference
  user_id INT NOT NULL REFERENCES users(id),
  alert_id INT REFERENCES alerts(id),
  incident_id INT REFERENCES incidents(id),
  
  -- Notification details
  notification_type VARCHAR(50) NOT NULL,
  -- Types: sms, email, push, in_app
  
  channel VARCHAR(50) NOT NULL,
  -- Channels: SMS, Email, FCM, WebSocket
  
  recipient VARCHAR(500) NOT NULL,
  -- SMS: phone number, Email: email, Push: device token, In-app: user ID
  
  subject VARCHAR(255),
  message TEXT NOT NULL,
  
  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  -- Statuses: pending, sent, delivered, failed, bounced
  
  retry_count INT DEFAULT 0,
  last_retry_at TIMESTAMP,
  
  -- Response
  response_code VARCHAR(10),
  response_message TEXT,
  
  -- Tracking
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  read_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INT NOT NULL
);

-- Create table for authentication tokens
CREATE TABLE IF NOT EXISTS auth_tokens (
  id SERIAL PRIMARY KEY,
  uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  
  -- Reference
  user_id INT NOT NULL REFERENCES users(id),
  
  -- Token details
  token_type VARCHAR(50) NOT NULL,
  -- Types: access, refresh, reset_password, email_verification, mfa_setup
  
  token_value VARCHAR(500) NOT NULL UNIQUE,
  token_hash VARCHAR(255) NOT NULL UNIQUE, -- Hashed for security
  
  -- Validity
  is_valid BOOLEAN DEFAULT true,
  expires_at TIMESTAMP NOT NULL,
  invalidated_at TIMESTAMP,
  invalidated_reason VARCHAR(100),
  
  -- Metadata
  ip_address VARCHAR(45),
  user_agent TEXT,
  device_info JSONB,
  
  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_uuid ON notification_logs(uuid);
CREATE INDEX idx_notifications_user_id ON notification_logs(user_id);
CREATE INDEX idx_notifications_alert_id ON notification_logs(alert_id);
CREATE INDEX idx_notifications_status ON notification_logs(status);
CREATE INDEX idx_notifications_created_at ON notification_logs(created_at);

CREATE INDEX idx_tokens_uuid ON auth_tokens(uuid);
CREATE INDEX idx_tokens_user_id ON auth_tokens(user_id);
CREATE INDEX idx_tokens_token_type ON auth_tokens(token_type);
CREATE INDEX idx_tokens_expires_at ON auth_tokens(expires_at);
CREATE INDEX idx_tokens_is_valid ON auth_tokens(is_valid);
