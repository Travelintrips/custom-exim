-- Add nomor_aju column to pib_documents and peb_documents for CEISA integration
-- This aligns with CEISA API response structure and other CEISA tables

ALTER TABLE pib_documents ADD COLUMN IF NOT EXISTS nomor_aju VARCHAR(50);
CREATE INDEX IF NOT EXISTS idx_pib_documents_nomor_aju ON pib_documents(nomor_aju);

ALTER TABLE peb_documents ADD COLUMN IF NOT EXISTS nomor_aju VARCHAR(50);
CREATE INDEX IF NOT EXISTS idx_peb_documents_nomor_aju ON peb_documents(nomor_aju);

-- Update existing records to populate nomor_aju from document_number where applicable
-- This is a one-time backfill for any existing data
UPDATE pib_documents SET nomor_aju = document_number WHERE nomor_aju IS NULL AND document_number IS NOT NULL;
UPDATE peb_documents SET nomor_aju = document_number WHERE nomor_aju IS NULL AND document_number IS NOT NULL;
