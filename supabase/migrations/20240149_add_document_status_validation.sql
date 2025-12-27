ALTER TABLE peb_attachments 
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'validated', 'locked')),
  ADD COLUMN IF NOT EXISTS file_hash TEXT,
  ADD COLUMN IF NOT EXISTS validated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS validated_by UUID REFERENCES auth.users(id);

ALTER TABLE pib_attachments 
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'validated', 'locked')),
  ADD COLUMN IF NOT EXISTS file_hash TEXT,
  ADD COLUMN IF NOT EXISTS validated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS validated_by UUID REFERENCES auth.users(id);

ALTER TABLE supporting_documents
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'validated', 'locked')),
  ADD COLUMN IF NOT EXISTS file_hash TEXT,
  ADD COLUMN IF NOT EXISTS validated_at TIMESTAMPTZ;

ALTER TABLE peb_documents
  ADD COLUMN IF NOT EXISTS ceisa_retry_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ceisa_last_error TEXT,
  ADD COLUMN IF NOT EXISTS ceisa_submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ceisa_response_at TIMESTAMPTZ;

ALTER TABLE pib_documents
  ADD COLUMN IF NOT EXISTS ceisa_retry_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ceisa_last_error TEXT,
  ADD COLUMN IF NOT EXISTS ceisa_submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ceisa_response_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_peb_attachments_status ON peb_attachments(status);
CREATE INDEX IF NOT EXISTS idx_pib_attachments_status ON pib_attachments(status);
CREATE INDEX IF NOT EXISTS idx_supporting_documents_status ON supporting_documents(status);

CREATE TABLE IF NOT EXISTS ceisa_submission_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ref_type VARCHAR(10) NOT NULL CHECK (ref_type IN ('PEB', 'PIB')),
  ref_id UUID NOT NULL,
  document_number VARCHAR(100),
  attempt_number INTEGER DEFAULT 1,
  request_xml TEXT,
  request_hash TEXT,
  response_status VARCHAR(50),
  response_message TEXT,
  response_raw TEXT,
  registration_number VARCHAR(100),
  error_code VARCHAR(50),
  error_type VARCHAR(50) CHECK (error_type IN ('NETWORK', 'TIMEOUT', 'VALIDATION', 'SERVER', 'UNKNOWN')),
  is_success BOOLEAN DEFAULT false,
  retry_allowed BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_ceisa_submission_logs_ref ON ceisa_submission_logs(ref_type, ref_id);
CREATE INDEX IF NOT EXISTS idx_ceisa_submission_logs_status ON ceisa_submission_logs(response_status);
CREATE INDEX IF NOT EXISTS idx_ceisa_submission_logs_created ON ceisa_submission_logs(created_at DESC);
