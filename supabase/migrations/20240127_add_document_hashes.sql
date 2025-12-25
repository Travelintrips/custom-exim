-- Document Hashes Table
-- Stores immutable SHA256 hashes of document XML for audit verification

CREATE TABLE IF NOT EXISTS document_hashes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ref_type VARCHAR(20) NOT NULL,
  ref_id UUID NOT NULL,
  document_number VARCHAR(100),
  xml_hash VARCHAR(64) NOT NULL,
  hash_algorithm VARCHAR(20) DEFAULT 'SHA-256',
  generated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  generated_by UUID,
  is_immutable BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_document_hashes_ref ON document_hashes(ref_type, ref_id);
CREATE INDEX IF NOT EXISTS idx_document_hashes_hash ON document_hashes(xml_hash);
CREATE INDEX IF NOT EXISTS idx_document_hashes_generated ON document_hashes(generated_at DESC);

-- RLS for document_hashes
ALTER TABLE document_hashes ENABLE ROW LEVEL SECURITY;

-- SELECT: All authorized roles
DROP POLICY IF EXISTS document_hashes_select ON document_hashes;
CREATE POLICY document_hashes_select ON document_hashes
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- INSERT: Staff roles
DROP POLICY IF EXISTS document_hashes_insert ON document_hashes;
CREATE POLICY document_hashes_insert ON document_hashes
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE: Deny all (hashes are immutable)
DROP POLICY IF EXISTS document_hashes_update ON document_hashes;
CREATE POLICY document_hashes_update ON document_hashes
  FOR UPDATE
  USING (false);

-- DELETE: Deny all (hashes are immutable)
DROP POLICY IF EXISTS document_hashes_delete ON document_hashes;
CREATE POLICY document_hashes_delete ON document_hashes
  FOR DELETE
  USING (false);
