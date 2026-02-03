-- Migration: Add API/NIB field to companies table
-- Purpose: Add API (Angka Pengenal Importir) / NIB field for companies

ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS api_nib VARCHAR(50);

COMMENT ON COLUMN companies.api_nib IS 'API (Angka Pengenal Importir) / NIB number';
