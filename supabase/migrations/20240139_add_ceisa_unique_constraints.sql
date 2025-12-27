ALTER TABLE ceisa_pkbsi DROP CONSTRAINT IF EXISTS ceisa_pkbsi_nomor_aju_key;
ALTER TABLE ceisa_pkbsi ADD CONSTRAINT ceisa_pkbsi_nomor_aju_key UNIQUE (nomor_aju);

ALTER TABLE ceisa_monitoring DROP CONSTRAINT IF EXISTS ceisa_monitoring_nomor_aju_key;
ALTER TABLE ceisa_monitoring ADD CONSTRAINT ceisa_monitoring_nomor_aju_key UNIQUE (nomor_aju);
