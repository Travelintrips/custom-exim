-- Supporting Documents Table
-- For storing document attachments related to PEB/PIB

CREATE TABLE IF NOT EXISTS supporting_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ref_type VARCHAR(20) NOT NULL, -- 'PEB', 'PIB'
  ref_id UUID NOT NULL,
  doc_type VARCHAR(50), -- 'INVOICE', 'PACKING_LIST', 'BL_AWB', 'COO', 'INSURANCE', 'OTHER'
  doc_no VARCHAR(100),
  doc_date DATE,
  file_url TEXT,
  file_name VARCHAR(255),
  file_size INTEGER,
  mime_type VARCHAR(100),
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_supporting_documents_ref ON supporting_documents(ref_type, ref_id);
CREATE INDEX IF NOT EXISTS idx_supporting_documents_doc_type ON supporting_documents(doc_type);
CREATE INDEX IF NOT EXISTS idx_supporting_documents_created ON supporting_documents(created_at DESC);

-- Add locked column to peb_documents if not exists
ALTER TABLE peb_documents ADD COLUMN IF NOT EXISTS locked BOOLEAN DEFAULT false;

-- Add locked column to pib_documents if not exists  
ALTER TABLE pib_documents ADD COLUMN IF NOT EXISTS locked BOOLEAN DEFAULT false;
