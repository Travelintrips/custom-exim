ALTER TABLE ceisa_vehicles DROP CONSTRAINT IF EXISTS ceisa_vehicles_nomor_aju_key;
ALTER TABLE ceisa_vehicles ADD CONSTRAINT ceisa_vehicles_nomor_aju_key UNIQUE (nomor_aju);
