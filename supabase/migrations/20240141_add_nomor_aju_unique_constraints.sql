ALTER TABLE pib_documents DROP CONSTRAINT IF EXISTS pib_documents_nomor_aju_key;
ALTER TABLE pib_documents ADD CONSTRAINT pib_documents_nomor_aju_key UNIQUE (nomor_aju);

ALTER TABLE peb_documents DROP CONSTRAINT IF EXISTS peb_documents_nomor_aju_key;
ALTER TABLE peb_documents ADD CONSTRAINT peb_documents_nomor_aju_key UNIQUE (nomor_aju);
