DO $$ BEGIN
  CREATE TYPE audit_action AS ENUM (
    'CREATE',
    'UPDATE',
    'DELETE',
    'SUBMIT',
    'APPROVE',
    'REJECT',
    'SEND_CEISA',
    'RECEIVE_RESPONSE',
    'LOCK',
    'UNLOCK',
    'EXPORT',
    'PRINT',
    'LOGIN',
    'LOGOUT'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE audit_entity_type AS ENUM (
    'PEB',
    'PIB',
    'USER',
    'COMPANY',
    'SYSTEM',
    'SETTINGS'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,
  entity_number VARCHAR(100),
  action VARCHAR(50) NOT NULL,
  actor_id UUID REFERENCES auth.users(id),
  actor_email VARCHAR(255),
  actor_role VARCHAR(50),
  
  before_data JSONB,
  after_data JSONB,
  changes JSONB,
  
  document_hash VARCHAR(64),
  ip_address VARCHAR(45),
  user_agent TEXT,
  session_id VARCHAR(255),
  
  notes TEXT,
  metadata JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_id ON audit_logs(entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_number ON audit_logs(entity_number);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_hash ON audit_logs(document_hash);

CREATE TABLE IF NOT EXISTS compliance_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type VARCHAR(50) NOT NULL,
  report_period_start DATE,
  report_period_end DATE,
  generated_by UUID REFERENCES auth.users(id),
  generated_by_email VARCHAR(255),
  
  total_records INTEGER DEFAULT 0,
  summary JSONB,
  report_data JSONB,
  file_path TEXT,
  file_size INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_compliance_reports_type ON compliance_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_compliance_reports_period ON compliance_reports(report_period_start, report_period_end);
CREATE INDEX IF NOT EXISTS idx_compliance_reports_created ON compliance_reports(created_at DESC);

CREATE TABLE IF NOT EXISTS kpi_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date DATE NOT NULL,
  
  total_peb INTEGER DEFAULT 0,
  total_pib INTEGER DEFAULT 0,
  peb_submitted_today INTEGER DEFAULT 0,
  pib_submitted_today INTEGER DEFAULT 0,
  pending_approvals INTEGER DEFAULT 0,
  rejected_documents INTEGER DEFAULT 0,
  
  total_fob_value DECIMAL(18,2) DEFAULT 0,
  total_cif_value DECIMAL(18,2) DEFAULT 0,
  total_tax_collected DECIMAL(18,2) DEFAULT 0,
  
  ceisa_success_rate DECIMAL(5,2) DEFAULT 0,
  ceisa_queue_size INTEGER DEFAULT 0,
  
  green_lane_count INTEGER DEFAULT 0,
  yellow_lane_count INTEGER DEFAULT 0,
  red_lane_count INTEGER DEFAULT 0,
  
  avg_processing_time_hours DECIMAL(10,2) DEFAULT 0,
  
  metrics JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kpi_snapshots_date ON kpi_snapshots(snapshot_date DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_kpi_snapshots_date_unique ON kpi_snapshots(snapshot_date);
