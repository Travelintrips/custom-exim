ALTER TABLE ceisa_manifests DROP CONSTRAINT IF EXISTS ceisa_manifests_nomor_aju_key;
ALTER TABLE ceisa_manifests ADD CONSTRAINT ceisa_manifests_nomor_aju_key UNIQUE (nomor_aju);

ALTER TABLE ceisa_kendaraan DROP CONSTRAINT IF EXISTS ceisa_kendaraan_nomor_aju_key;
ALTER TABLE ceisa_kendaraan ADD CONSTRAINT ceisa_kendaraan_nomor_aju_key UNIQUE (nomor_aju);
