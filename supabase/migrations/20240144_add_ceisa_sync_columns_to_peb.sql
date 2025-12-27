ALTER TABLE peb_documents ADD COLUMN IF NOT EXISTS tanggal_aju DATE;
ALTER TABLE peb_documents ADD COLUMN IF NOT EXISTS nomor_pendaftaran VARCHAR(50);
ALTER TABLE peb_documents ADD COLUMN IF NOT EXISTS tanggal_pendaftaran DATE;
ALTER TABLE peb_documents ADD COLUMN IF NOT EXISTS eksportir_npwp VARCHAR(50);
ALTER TABLE peb_documents ADD COLUMN IF NOT EXISTS eksportir_nama VARCHAR(255);
ALTER TABLE peb_documents ADD COLUMN IF NOT EXISTS eksportir_alamat TEXT;
ALTER TABLE peb_documents ADD COLUMN IF NOT EXISTS total_nilai_fob DECIMAL(18,2) DEFAULT 0;
ALTER TABLE peb_documents ADD COLUMN IF NOT EXISTS negara_tujuan VARCHAR(100);
ALTER TABLE peb_documents ADD COLUMN IF NOT EXISTS pelabuhan_muat VARCHAR(255);
ALTER TABLE peb_documents ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE peb_documents ADD COLUMN IF NOT EXISTS synced_at TIMESTAMPTZ;
ALTER TABLE peb_documents ADD COLUMN IF NOT EXISTS source VARCHAR(20) DEFAULT 'MANUAL';

CREATE INDEX IF NOT EXISTS idx_peb_documents_tanggal_aju ON peb_documents(tanggal_aju);
CREATE INDEX IF NOT EXISTS idx_peb_documents_source ON peb_documents(source);

ALTER TABLE pib_documents ADD COLUMN IF NOT EXISTS nomor_pendaftaran VARCHAR(50);
ALTER TABLE pib_documents ADD COLUMN IF NOT EXISTS tanggal_pendaftaran DATE;
ALTER TABLE pib_documents ADD COLUMN IF NOT EXISTS importir_npwp VARCHAR(50);
ALTER TABLE pib_documents ADD COLUMN IF NOT EXISTS importir_nama VARCHAR(255);
ALTER TABLE pib_documents ADD COLUMN IF NOT EXISTS importir_alamat TEXT;
ALTER TABLE pib_documents ADD COLUMN IF NOT EXISTS total_nilai_pabean DECIMAL(18,2) DEFAULT 0;
ALTER TABLE pib_documents ADD COLUMN IF NOT EXISTS total_bea_masuk DECIMAL(18,2) DEFAULT 0;
ALTER TABLE pib_documents ADD COLUMN IF NOT EXISTS total_ppn DECIMAL(18,2) DEFAULT 0;
ALTER TABLE pib_documents ADD COLUMN IF NOT EXISTS total_pph DECIMAL(18,2) DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_pib_documents_nomor_pendaftaran ON pib_documents(nomor_pendaftaran);
