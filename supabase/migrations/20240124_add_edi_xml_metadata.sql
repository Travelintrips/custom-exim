-- EDI XML Metadata Table
-- Stores XML generation metadata for PEB/PIB documents (versioned)

CREATE TABLE IF NOT EXISTS edi_xml_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ref_type VARCHAR(20) NOT NULL,
  ref_id UUID NOT NULL,
  document_number VARCHAR(100),
  xml_path TEXT NOT NULL,
  xml_hash VARCHAR(64) NOT NULL,
  xml_content TEXT,
  generated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  generated_by UUID,
  storage_success BOOLEAN DEFAULT false,
  file_size INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_edi_xml_metadata_ref ON edi_xml_metadata(ref_type, ref_id);
CREATE INDEX IF NOT EXISTS idx_edi_xml_metadata_hash ON edi_xml_metadata(xml_hash);
CREATE INDEX IF NOT EXISTS idx_edi_xml_metadata_generated ON edi_xml_metadata(generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_edi_xml_metadata_document ON edi_xml_metadata(document_number);
