ALTER TABLE pib_documents ADD COLUMN IF NOT EXISTS tanggal_aju DATE;
ALTER TABLE pib_documents ADD COLUMN IF NOT EXISTS nama_importir VARCHAR(255);
ALTER TABLE pib_documents ADD COLUMN IF NOT EXISTS nilai_cif DECIMAL(18,2) DEFAULT 0;
ALTER TABLE pib_documents ADD COLUMN IF NOT EXISTS xml_hash VARCHAR(64);
ALTER TABLE pib_documents ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE pib_documents ADD COLUMN IF NOT EXISTS synced_at TIMESTAMPTZ;
ALTER TABLE pib_documents ADD COLUMN IF NOT EXISTS source VARCHAR(20) DEFAULT 'MANUAL';

CREATE INDEX IF NOT EXISTS idx_pib_documents_tanggal_aju ON pib_documents(tanggal_aju);
CREATE INDEX IF NOT EXISTS idx_pib_documents_source ON pib_documents(source);
