CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type VARCHAR(10) NOT NULL,
  document_number VARCHAR(100) NOT NULL,
  action VARCHAR(50) NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  user_email VARCHAR(255),
  before_data JSONB,
  after_data JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_document_number ON audit_logs(document_number);
CREATE INDEX IF NOT EXISTS idx_audit_logs_document_type ON audit_logs(document_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
